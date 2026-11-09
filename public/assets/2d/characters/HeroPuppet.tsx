/**
 * HeroPuppet.tsx — Erudito Alquimista (rig 2D de cuerpo completo en SVG puro)
 * Skill: remotion-video-studio-2d
 *
 * CONVENCIONES (léelas antes de animar)
 * ─────────────────────────────────────────────────────────────────────────────
 * · El componente devuelve un <g>: colócalo dentro de tu <svg> / <AbsoluteFill>.
 * · ANCLA (x, y) = centro de la PELVIS. Con la pose de pie, la suela queda
 *   HERO_FOOT_OFFSET px por debajo de y (a scale = 1) y la coronilla del pelo
 *   unos 430 px por encima.
 * · El personaje mira hacia +x (derecha). `flipX` lo espeja.
 * · Vista 3/4: el lado DERECHO del personaje es el cercano a cámara (capas
 *   delanteras, aparece a la izquierda de la pantalla); el IZQUIERDO es el
 *   lejano (capas traseras). `turn` (0 = frontal … 1 = perfil) cierra el cuerpo.
 * · Todos los ángulos están en GRADOS y se aplican en el plano sagital
 *   (como una vista de perfil): "adelante" = +x.
 *      shoulder  0 = brazo colgando · −90 = horizontal adelante · −180 = arriba
 *                +45 = hacia atrás
 *      elbow     0 = recto · 145 = antebrazo plegado hacia delante (solo flexión)
 *      wrist     + = la mano se curva hacia delante (misma dirección que el codo)
 *      hip       + = muslo hacia delante (elevación) · − = hacia atrás
 *      knee      0 = recto · −140 = pantorrilla plegada hacia atrás (nunca al revés)
 *      ankle     + = puntera hacia abajo · − = puntera hacia arriba
 *      headRot / spineRot  + = inclinación hacia delante (sentido horario)
 * · TODA rotación pasa por clamp() con JOINT_LIMITS: es imposible forzar
 *   ángulos no anatómicos desde `pose`.
 *
 * EXTENSIONES OPCIONALES (no rompen la firma original)
 *   · HeroPose.turn   0..1   giro del cuerpo (por defecto 0.3).
 *   · HeroPose.bodyY  px     desplaza la pelvis (agacharse / apoyar los pies).
 *   · HeroPose.coin   bool   moneda sobre el pulgar (POSE_RAILGUN_FLICK).
 *   · rightHandPose acepta además "relaxed".
 *   · HeroPuppetProps.id     id estable para <clipPath>/<defs> si renderizas
 *                            varios héroes en el mismo <svg>.
 */
import React from "react";

/* ═════════════════════════════ PALETA ═════════════════════════════ */

export const HERO_COLORS = {
  ink: "#11161B", // contorno de tinta bold (strokeWidth 4 a 6 px)
  skin: "#F7E2CE", // piel anime cálida con alto contraste
  skinShadow: "#D8B69C", // sombra de oclusión de cuello, ojeras y cuencas (Akihabara 2010 shading)
  hair: "#2A1E1A", // cabello castaño oscuro alborotado peinado hacia atrás (messy swept-back dark brown hair)
  hairHighlight: "#46332C",
  clothDark: "#F4F5F7", // bata de laboratorio blanca larga y holgada (loose long white lab coat)
  clothAccent: "#D8DDE6", // pliegues, solapas y sombras de la bata blanca
  shirtGreen: "#556B53", // camiseta verde apagado con cuello en V (dull green V-neck t-shirt)
  trousersBrown: "#3B2B23", // pantalones marrón oscuro (dark brown trousers)
  leather: "#F7E2CE", // manos descubiertas (piel)
  leatherDark: "#241914", // zapatos/botines marrón muy oscuro
  gold: "#A88B5C", // hebilla metálica discreta / gadget Divergencia
  manaCyan: "#D99B26", // brillo ámbar/avellana Steins;Gate (hazel eyes / Nixie tube glow)
  white: "#FFFFFF", // esclera y reflejo especular
  belt: "#261B16", // correa de cuero oscuro del cinturón
  irisDeep: "#6E4F28", // iris color avellana (tired hazel eyes)
} as const;

const C = HERO_COLORS;

/* ═══════════════════ LÍMITES BIOMECÁNICOS Y UTILIDADES ═══════════════════ */

export const clamp = (val: number, min: number, max: number): number =>
  Math.min(Math.max(val, min), max);

export const JOINT_LIMITS = {
  neck: { min: -25, max: 25 }, // Inclinación de cabeza
  shoulder: { min: -180, max: 45 }, // Rotación del brazo superior
  elbow: { min: 0, max: 145 }, // Codo: ¡PROHIBIDA hiperextensión negativa (< 0°)!
  wrist: { min: -40, max: 40 }, // Flexión de muñeca
  spine: { min: -15, max: 15 }, // Inclinación del torso
  hip: { min: -60, max: 85 }, // Elevación de muslo
  knee: { min: -140, max: 0 }, // Rodilla: ¡SÓLO flexiona hacia atrás (<= 0°)!
  ankle: { min: -30, max: 30 }, // Flexión del pie
};

type Limit = { min: number; max: number };
const lim = (v: number | undefined, l: Limit, fallback = 0) =>
  clamp(v ?? fallback, l.min, l.max);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const n = (v: number) => Math.round(v * 100) / 100;

const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Mezcla dos colores #rrggbb (t = 0 → a, t = 1 → b). */
export const mixColor = (a: string, b: string, t: number): string => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return (
    "#" +
    A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, "0")).join("")
  );
};

/* ═════════════════════════════ TIPOS ═════════════════════════════ */

export type LeftHandPose = "open" | "fist" | "point" | "relaxed";
export type RightHandPose = "open" | "fist" | "point" | "flick" | "snap" | "relaxed";
type AnyHandPose = LeftHandPose | RightHandPose;

export interface HeroPose {
  // Cabeza y Rostro
  headRot?: number; // -25° a +25°
  look?: { x: number; y: number }; // Posición pupila (-12 a +12)
  blink?: number; // 0 (abierto) a 1 (cerrado con piel 100% opaca)
  smile?: number; // -1 (triste/serio), 0 (neutro), 1 (sonrisa arrogante)
  eyebrow?: number; // -1 (confuso), 0 (neutro), 1 (concentrado/analítico)
  glow?: number; // 0 a 1 (intensidad del iris de maná cian)

  // Torso y Respiración
  spineRot?: number; // -15° a +15°
  breathe?: number; // Micro-escala Y (1.0 a 1.03)

  // Brazo Izquierdo (lejano) — FK con topes
  leftShoulder?: number; // -180° a +45°
  leftElbow?: number; // 0° a 145° (sólo flexión interna)
  leftWrist?: number; // -40° a +40°
  leftHandPose?: LeftHandPose;

  // Brazo Derecho (cercano) — FK con topes
  rightShoulder?: number; // -180° a +45°
  rightElbow?: number; // 0° a 145° (sólo flexión interna)
  rightWrist?: number; // -40° a +40°
  rightHandPose?: RightHandPose;

  // Piernas y Apoyo
  leftHip?: number; // -60° a +85°
  leftKnee?: number; // -140° a 0° (sólo hacia atrás)
  leftAnkle?: number; // -30° a +30°
  rightHip?: number; // -60° a +85°
  rightKnee?: number; // -140° a 0° (sólo hacia atrás)
  rightAnkle?: number; // -30° a +30°

  // — Extensiones opcionales —
  turn?: number; // 0 frontal … 1 perfil (def. 0.3)
  bodyY?: number; // desplazamiento vertical de la pelvis, px (−60 … 60)
  coin?: boolean; // moneda sobre el pulgar (con rightHandPose "flick")
}

export interface HeroPuppetProps {
  x: number;
  y: number;
  scale?: number;
  pose?: HeroPose;
  flipX?: boolean;
  /** id estable para defs/clipPaths (por defecto React.useId()). */
  id?: string;
}

/* ═════════════════════════ GEOMETRÍA DEL RIG ═════════════════════════
 * Origen local = centro de la pelvis. y negativo = arriba.               */

const WAIST = { x: 0, y: -21 }; // pivote de la columna
const HIP_Y = 26;
const THIGH = 140;
const SHIN = 132;
const SHOULDER_Y = -184;
const SHOULDER_X = 56; // a turn = 0
const HIP_X = 30; // a turn = 0
const UPPER_ARM = 88;
const FOREARM = 80;
const NECK_Y = -204; // base del cuello (pivote de la cabeza)
const TORSO_H = 176; // alto aproximado del torso (para la respiración)

/** Distancia de la pelvis a la suela con las piernas rectas (scale = 1). */
export const HERO_FOOT_OFFSET = HIP_Y + THIGH + SHIN + 44;

const DEFAULT_TURN = 0.3;
const INK_STROKE = {
  stroke: C.ink,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

/** Cápsula afilada que cuelga hacia +y desde (0,0). */
const limb = (w1: number, w2: number, len: number): string => {
  const a = w1 / 2;
  const b = w2 / 2;
  return `M ${n(-a)} 0 L ${n(-b)} ${len} A ${n(b)} ${n(b)} 0 0 0 ${n(b)} ${len} L ${n(a)} 0 A ${n(a)} ${n(a)} 0 0 0 ${n(-a)} 0 Z`;
};

/* ═══════════════════ POSE: RESOLUCIÓN Y CLAMP CENTRAL ═══════════════════ */

const resolvePose = (p: HeroPose) => ({
  headRot: lim(p.headRot, JOINT_LIMITS.neck),
  lookX: clamp(p.look?.x ?? 0, -12, 12),
  lookY: clamp(p.look?.y ?? 0, -12, 12),
  blink: clamp(p.blink ?? 0, 0, 1),
  smile: clamp(p.smile ?? 0, -1, 1),
  eyebrow: clamp(p.eyebrow ?? 0, -1, 1),
  glow: clamp(p.glow ?? 0, 0, 1),
  spine: lim(p.spineRot, JOINT_LIMITS.spine),
  breathe: clamp(p.breathe ?? 1, 1, 1.03),
  lShoulder: lim(p.leftShoulder, JOINT_LIMITS.shoulder),
  lElbow: lim(p.leftElbow, JOINT_LIMITS.elbow),
  lWrist: lim(p.leftWrist, JOINT_LIMITS.wrist),
  lHand: (p.leftHandPose ?? "relaxed") as AnyHandPose,
  rShoulder: lim(p.rightShoulder, JOINT_LIMITS.shoulder),
  rElbow: lim(p.rightElbow, JOINT_LIMITS.elbow),
  rWrist: lim(p.rightWrist, JOINT_LIMITS.wrist),
  rHand: (p.rightHandPose ?? "relaxed") as AnyHandPose,
  lHip: lim(p.leftHip, JOINT_LIMITS.hip),
  lKnee: lim(p.leftKnee, JOINT_LIMITS.knee),
  lAnkle: lim(p.leftAnkle, JOINT_LIMITS.ankle),
  rHip: lim(p.rightHip, JOINT_LIMITS.hip),
  rKnee: lim(p.rightKnee, JOINT_LIMITS.knee),
  rAnkle: lim(p.rightAnkle, JOINT_LIMITS.ankle),
  turn: clamp(p.turn ?? DEFAULT_TURN, 0, 1),
  bodyY: clamp(p.bodyY ?? 0, -60, 60),
  coin: !!p.coin,
});
type RP = ReturnType<typeof resolvePose>;

/* ═════════════════════════════ OJOS ═════════════════════════════
 * Cuenca = <clipPath> que encierra esclera + iris + pupila. El párpado
 * superior es una masa SÓLIDA de piel (fill = C.skin) que desciende dentro
 * del clip. Con blink = 1 cubre el 100 % de esclera y pupila; fuera del clip
 * solo queda el trazo de tinta de las pestañas cerradas.                  */

const EYE_RX = 17;
const EYE_RY = 20;
const EYE_X = 25;
const EYE_Y = -90;
const Y_CLOSED = 9; // altura (relativa al ojo) del trazo de pestañas cerradas
const K = 0.5523; // constante de aproximación de elipse con cúbicas

interface EyeProps {
  id: string;
  cx: number;
  cy: number;
  sx: number; // escala horizontal (perspectiva 3/4)
  outer: -1 | 1; // lado de la comisura externa
  blink: number;
  lidBase: number; // cierre en reposo (entrecerrar por ceño/sonrisa)
  lookX: number;
  lookY: number;
  glow: number;
}

const Eye: React.FC<EyeProps> = ({
  id, cx, cy, sx, outer, blink, lidBase, lookX, lookY, glow,
}) => {
  const rx = EYE_RX;
  const ry = EYE_RY;
  // cierre total del párpado 0..1
  const t = clamp(lidBase + (1 - lidBase) * blink, 0, 1);
  // fase 1 (0→0.7): el borde del párpado baja hasta la línea de pestañas cerradas
  const k1 = clamp(t / 0.7, 0, 1);
  const ease = k1 * k1 * (3 - 2 * k1);
  const lashY = lerp(-ry, Y_CLOSED, ease);
  // fase 2 (0.7→1): el párpado sigue deslizando hasta tapar TODA la cuenca
  const sweep = lerp(0, ry + 10, clamp((t - 0.7) / 0.3, 0, 1));
  const c1 = lashY * K * (1 - 0.35 * blink);

  const fwd =
    `M ${-rx} 0 C ${-rx} ${n(c1)} ${n(-rx * K)} ${n(lashY)} 0 ${n(lashY)} ` +
    `C ${n(rx * K)} ${n(lashY)} ${rx} ${n(c1)} ${rx} 0`;
  const rev =
    `C ${rx} ${n(c1)} ${n(rx * K)} ${n(lashY)} 0 ${n(lashY)} ` +
    `C ${n(-rx * K)} ${n(lashY)} ${-rx} ${n(c1)} ${-rx} 0`;
  const W = rx + 8;
  const H = ry + 8;
  const lidD =
    `M ${-W} ${-H} L ${W} ${-H} L ${W} 0 L ${rx} 0 ${rev} L ${-W} 0 Z ` +
    `M ${-W} 0 L ${W} 0 L ${W} ${n(sweep)} L ${-W} ${n(sweep)} Z`;

  const px = lookX * 0.6;
  const py = lookY * 0.6;

  return (
    <g transform={`translate(${n(cx)} ${n(cy)}) scale(${n(sx)} 1)`}>
      {/* Cuenca: sombra de oclusión alrededor del ojo */}
      <ellipse cx={0} cy={2} rx={rx + 5} ry={ry + 4} fill={C.skinShadow} opacity={0.75} />

      <g clipPath={`url(#eye-clip-${id})`}>
        {/* esclera */}
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={C.white} />
        {/* iris + pupila (se mueven con look) */}
        <g transform={`translate(${n(px)} ${n(py)})`}>
          <circle r={13} fill={C.manaCyan} opacity={0.28 * glow} />
          <circle r={9.2} fill={`url(#iris-${id})`} />
          <circle r={9.2} fill="none" stroke={C.ink} strokeWidth={1.6} opacity={0.55} />
          <circle r={4.4} fill={C.ink} />
          <circle cx={-3.2} cy={-3.6} r={2.8} fill={C.white} />
          <circle cx={3.4} cy={3} r={1.4} fill={C.white} opacity={0.9} />
        </g>
        {/* contorno inferior (solo mitad interior: el párpado lo tapa) */}
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={C.ink} strokeWidth={8} />
        {/* sombra que proyecta el párpado sobre la esclera */}
        <path d={lidD} transform="translate(0 3)" fill={C.skinShadow} />
        {/* PÁRPADO: piel sólida y opaca */}
        <path d={lidD} fill={C.skin} />
      </g>

      {/* Pestañas: único trazo exterior (bold) */}
      <path d={fwd} fill="none" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" />
      <path
        d={`M ${outer * (rx - 1)} ${n(Math.min(-1, lashY * 0.1))} l ${outer * 6} -4`}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        opacity={1 - blink}
      />
    </g>
  );
};

/* ═════════════════════════════ CABEZA ═════════════════════════════ */

const HEAD_PATH =
  "M -56 -102 C -56 -146 -32 -164 0 -164 C 32 -164 56 -146 56 -102 " +
  "C 55 -58 34 -28 0 -26 C -34 -28 -55 -58 -56 -102 Z";

// Cabello corto castaño oscuro peinado hacia atrás de forma alborotada (swept-back dark brown hair, dejando la frente prominente visible)
const HAIR_FRONT =
  "M -56 -100 C -64 -128 -62 -158 -44 -172 L -52 -196 L -28 -180 L -20 -210 " +
  "L -2 -184 L 10 -214 L 24 -182 L 42 -204 L 44 -174 L 64 -186 L 54 -158 " +
  "C 62 -142 62 -114 56 -96 L 52 -128 C 44 -148 24 -158 0 -158 " +
  "C -24 -158 -44 -148 -52 -128 Z";

const HAIR_BACK =
  "M -50 -152 L -82 -164 L -70 -138 L -90 -124 L -64 -102 L -60 -70 " +
  "L -42 -60 L -38 -118 Z";

const Head: React.FC<{ P: RP; id: string }> = ({ P, id }) => {
  const shift = P.turn * 8; // la cara se desplaza hacia donde mira (+x)
  const lidBase =
    0.08 + 0.12 * Math.max(0, P.eyebrow) + 0.06 * Math.max(0, P.smile);

  // Boca
  const mx = shift + 4;
  const my = -52;
  const hw = P.smile >= 0 ? 14 + 5 * P.smile : 12;
  const cornerY = -P.smile * 3;
  const yL = my + cornerY;
  const yR = my + cornerY - Math.max(0, P.smile) * 3; // sonrisa arrogante: sube hacia +x
  const yc = my + P.smile * 12;
  const mouth = `M ${n(mx - hw)} ${n(yL)} Q ${n(mx)} ${n(yc)} ${n(mx + hw)} ${n(yR)}`;

  // Cejas
  const brow = (side: -1 | 1) => {
    const bx = side * EYE_X + shift;
    const base = -126 + P.eyebrow * 4;
    const inner = base + P.eyebrow * 8;
    const outerY = base - P.eyebrow * 2;
    const extra = side === 1 ? Math.min(0, P.eyebrow) * 6 : 0; // ceja lejana arqueada al dudar
    const x1 = bx - side * 20;
    const x2 = bx + side * 20;
    const y1 = inner + extra;
    const y2 = outerY + extra;
    return `M ${n(x1)} ${n(y1)} Q ${n(bx)} ${n((y1 + y2) / 2 - 7)} ${n(x2)} ${n(y2)}`;
  };

  return (
    <g>
      {/* cabello trasero */}
      <path d={HAIR_BACK} fill={C.hair} {...INK_STROKE} strokeWidth={5} />
      {/* orejas */}
      <ellipse cx={-59} cy={-92} rx={8} ry={13} fill={C.skin} {...INK_STROKE} strokeWidth={5} />
      <ellipse cx={59} cy={-92} rx={8} ry={13} fill={C.skin} {...INK_STROKE} strokeWidth={5} />
      {/* cara afilada (sharp facial features + prominent forehead) */}
      <path d={HEAD_PATH} fill={C.skin} {...INK_STROKE} strokeWidth={6} />
      {/* sombra de mandíbula y barba incipiente en el mentón (light stubble on chin) */}
      <path d="M -42 -50 Q 0 -24 42 -50 Q 0 -34 -42 -50 Z" fill={C.skinShadow} opacity={0.65} />
      <path
        d="M -14 -33 L -12 -29 M -8 -31 L -7 -27 M -2 -30 L -2 -26 M 4 -30 L 4 -26 M 9 -31 L 10 -27 M 14 -33 L 13 -29 M -5 -35 L -4 -32 M 5 -35 L 4 -32"
        stroke={C.hair}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.75}
      />
      {/* ojeras de cansancio bajo los ojos (tired hazel eyes) */}
      <path
        d={`M ${n(-EYE_X + shift - 14)} ${EYE_Y + 21} Q ${n(-EYE_X + shift)} ${EYE_Y + 27} ${n(-EYE_X + shift + 14)} ${EYE_Y + 20}`}
        fill="none"
        stroke={C.skinShadow}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path
        d={`M ${n(EYE_X + shift - 13)} ${EYE_Y + 20} Q ${n(EYE_X + shift)} ${EYE_Y + 26} ${n(EYE_X + shift + 13)} ${EYE_Y + 20}`}
        fill="none"
        stroke={C.skinShadow}
        strokeWidth={3.5}
        strokeLinecap="round"
      />

      {/* Ojos con máscara opaca (clipPath + párpado de piel) */}
      <Eye
        id={id} cx={-EYE_X + shift} cy={EYE_Y} sx={1 + 0.06 * P.turn} outer={-1}
        blink={P.blink} lidBase={lidBase} lookX={P.lookX} lookY={P.lookY} glow={P.glow}
      />
      <Eye
        id={id} cx={EYE_X + shift} cy={EYE_Y} sx={1 - 0.25 * P.turn} outer={1}
        blink={P.blink} lidBase={lidBase} lookX={P.lookX} lookY={P.lookY} glow={P.glow}
      />

      {/* cejas */}
      <path d={brow(-1)} fill="none" {...INK_STROKE} strokeWidth={7} />
      <path d={brow(1)} fill="none" {...INK_STROKE} strokeWidth={7} />
      {/* nariz */}
      <path d={`M ${n(shift + 3)} -74 q 6 11 -3 13`} fill="none" {...INK_STROKE} strokeWidth={4} opacity={0.8} />
      {/* boca */}
      <path d={mouth} fill="none" {...INK_STROKE} strokeWidth={5} />
      {P.smile > 0.4 && (
        <path
          d={`M ${n(mx + hw + 2)} ${n(yR - 2)} q 3 2 2 6`}
          fill="none" {...INK_STROKE} strokeWidth={4}
        />
      )}

      {/* cabello delantero */}
      <path d={HAIR_FRONT} fill={C.hair} {...INK_STROKE} strokeWidth={5} />
      <path d="M -40 -158 Q -22 -178 -4 -170" fill="none" stroke={C.hairHighlight} strokeWidth={4} strokeLinecap="round" />
      <path d="M 14 -168 Q 30 -184 48 -166" fill="none" stroke={C.hairHighlight} strokeWidth={4} strokeLinecap="round" />
      <path d="M -58 -128 Q -62 -110 -58 -96" fill="none" stroke={C.hairHighlight} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/* ═════════════════════════════ MANOS ═════════════════════════════ */

const Finger: React.FC<{ x: number; y: number; a: number; len: number; w?: number }> = ({
  x, y, a, len, w = 8,
}) => (
  <path
    d={limb(w, w * 0.88, len)}
    transform={`translate(${x} ${y}) rotate(${a})`}
    fill={C.leather}
    {...INK_STROKE}
    strokeWidth={4}
  />
);

/** Origen en la muñeca; los dedos apuntan a +y; el pulgar queda en +x (hacia delante). */
const Hand: React.FC<{ pose: AnyHandPose; glow: number; coin: boolean }> = ({
  pose, glow, coin,
}) => {
  const palm = (h: number, rx = 9) => (
    <rect x={-12} y={4} width={24} height={h} rx={rx} fill={C.leather} {...INK_STROKE} strokeWidth={4} />
  );
  const rolls = (
    <path d="M -10 16 Q 0 20 10 16 M -10 25 Q 0 29 10 25" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
  );
  const fist = (extraHeight = 32) => (
    <>
      <rect x={-13} y={4} width={26} height={extraHeight} rx={11} fill={C.leather} {...INK_STROKE} strokeWidth={4} />
      {rolls}
    </>
  );

  let body: React.ReactNode;
  switch (pose) {
    case "open":
      body = (
        <>
          <Finger x={-9} y={26} a={10} len={22} />
          <Finger x={-3} y={28} a={3} len={25} />
          <Finger x={3} y={28} a={-3} len={24} />
          <Finger x={9} y={26} a={-9} len={19} w={7} />
          {palm(28)}
          <Finger x={11} y={14} a={-50} len={20} w={9} />
        </>
      );
      break;
    case "fist":
      body = (
        <>
          {fist()}
          <Finger x={12} y={26} a={80} len={18} w={9} />
        </>
      );
      break;
    case "point":
      body = (
        <>
          <Finger x={6} y={30} a={-2} len={28} />
          {fist(30)}
          <Finger x={12} y={24} a={80} len={16} w={9} />
        </>
      );
      break;
    case "flick":
      body = (
        <>
          {fist()}
          <Finger x={11} y={14} a={-78} len={28} w={9} />
          {coin && (
            <g transform="translate(40 6)">
              <circle r={10} fill={C.gold} {...INK_STROKE} strokeWidth={4} />
              <circle r={5.5} fill="none" stroke={C.ink} strokeWidth={2} opacity={0.6} />
              <circle cx={-3} cy={-3.5} r={1.8} fill={C.white} />
            </g>
          )}
        </>
      );
      break;
    case "snap":
      body = (
        <>
          <Finger x={-9} y={24} a={34} len={13} w={7} />
          <Finger x={-4} y={28} a={22} len={13} w={7} />
          <Finger x={1} y={28} a={4} len={24} w={8} />
          {palm(26)}
          <Finger x={11} y={16} a={28} len={34} w={9} />
          {glow > 0.55 && (
            <path
              d="M -4 52 l -11 6 M -4 52 l 13 6 M -4 52 l 1 13"
              stroke={C.manaCyan} strokeWidth={3} strokeLinecap="round" fill="none"
              opacity={glow}
            />
          )}
        </>
      );
      break;
    case "relaxed":
    default:
      body = (
        <>
          <Finger x={-8} y={24} a={6} len={16} />
          <Finger x={-3} y={26} a={3} len={18} />
          <Finger x={3} y={26} a={0} len={17} />
          <Finger x={8} y={24} a={-3} len={14} w={7} />
          {palm(24)}
          <Finger x={11} y={13} a={-24} len={16} w={9} />
        </>
      );
  }

  return (
    <g>
      {body}
      {/* puño del guante con runa de maná */}
      <rect x={-14} y={-10} width={28} height={20} rx={6} fill={C.leatherDark} {...INK_STROKE} strokeWidth={4} />
      <path
        d="M -7 -3 L -2 3 L 2 -5 L 7 2"
        fill="none" stroke={C.manaCyan} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"
        opacity={0.5 + 0.5 * glow}
      />
    </g>
  );
};

/* ═════════════════════════════ BRAZO ═════════════════════════════ */

interface ArmProps {
  x: number;
  shoulder: number;
  elbow: number;
  wrist: number;
  hand: AnyHandPose;
  glow: number;
  coin: boolean;
}

const Arm: React.FC<ArmProps> = ({ x, shoulder, elbow, wrist, hand, glow, coin }) => (
  <g transform={`translate(${n(x)} ${SHOULDER_Y}) rotate(${n(shoulder)})`}>
    {/* manga (brazo superior) */}
    <path d={limb(32, 27, UPPER_ARM)} fill={C.clothDark} {...INK_STROKE} strokeWidth={5} />
    <path d="M -8 14 Q -4 40 -7 66" fill="none" stroke={C.clothAccent} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
    {/* codo: rotate(−elbow) ⇒ solo flexión hacia delante */}
    <g transform={`translate(0 ${UPPER_ARM}) rotate(${n(-elbow)})`}>
      <path d={limb(25, 21, FOREARM)} fill={C.skin} {...INK_STROKE} strokeWidth={5} />
      <path d="M 6 24 Q 8 40 5 58" fill="none" stroke={C.skinShadow} strokeWidth={4} strokeLinecap="round" />
      {/* manga arremangada */}
      <rect x={-17} y={-9} width={34} height={22} rx={8} fill={C.clothAccent} {...INK_STROKE} strokeWidth={5} />
      <path d="M -10 -2 L 10 -2" stroke={C.gold} strokeWidth={2.5} strokeLinecap="round" opacity={0.85} />
      {/* muñeca */}
      <g transform={`translate(0 ${FOREARM}) rotate(${n(-wrist)})`}>
        <Hand pose={hand} glow={glow} coin={coin} />
      </g>
    </g>
  </g>
);

/* ═════════════════════════════ PIERNA ═════════════════════════════ */

const Leg: React.FC<{ x: number; hip: number; knee: number; ankle: number }> = ({
  x, hip, knee, ankle,
}) => (
  <g transform={`translate(${n(x)} ${HIP_Y}) rotate(${n(-hip)})`}>
    {/* muslo (pantalón marrón oscuro: dark brown trousers) */}
    <path d={limb(40, 31, THIGH)} fill={C.trousersBrown} {...INK_STROKE} strokeWidth={5} />
    <path d={`M 7 20 L 6 ${THIGH - 22}`} fill="none" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" opacity={0.45} />
    {/* rodilla: rotate(−knee) con knee ≤ 0 ⇒ la pantorrilla solo se pliega hacia atrás */}
    <g transform={`translate(0 ${THIGH}) rotate(${n(-knee)})`}>
      {/* espinilla (pantalón marrón oscuro) */}
      <path d={limb(31, 26, SHIN)} fill={C.trousersBrown} {...INK_STROKE} strokeWidth={5} />
      {/* botín / zapato oscuro */}
      <path
        d={`M -17 ${SHIN - 36} L 17 ${SHIN - 36} L 17 ${SHIN} L -17 ${SHIN} Z`}
        fill={C.leatherDark} {...INK_STROKE} strokeWidth={5}
      />
      {/* pliegue de rodilla del pantalón */}
      <circle r={15} fill={C.trousersBrown} {...INK_STROKE} strokeWidth={5} />
      <path d="M -6 -4 Q 4 -6 9 2" fill="none" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
      {/* pie */}
      <g transform={`translate(0 ${SHIN}) rotate(${n(ankle)})`}>
        <circle r={15} fill={C.leatherDark} />
        <path
          d="M -17 -10 L 17 -10 L 19 0 C 32 2 50 8 59 22 C 64 29 62 36 55 36 L -21 36 C -24 36 -23 20 -19 4 Z"
          fill={C.leatherDark} {...INK_STROKE} strokeWidth={5}
        />
        <path d="M -23 34 L 61 34 C 66 34 66 44 58 44 L -23 44 Z" fill={C.ink} {...INK_STROKE} strokeWidth={4} />
      </g>
    </g>
  </g>
);

/* ═══════════════════════ TORSO, CINTURÓN Y FALDÓN DE BATA ═══════════════════════ */

const Skirt: React.FC<{ tx: number; lHip: number; rHip: number; spine: number }> = ({
  tx, lHip, rHip, spine,
}) => {
  // inercia secundaria: los faldones largos de la bata blanca de laboratorio se balancean con el movimiento
  const sway = (hip: number) => clamp(-hip * 0.35 + spine * 0.4, -22, 22);
  const flap = (px: number, rot: number, side: -1 | 1) => (
    <g transform={`translate(${n(px)} -10) rotate(${n(rot)}) scale(${n(tx)} 1)`}>
      <path
        d={
          side === -1
            ? "M -34 0 L 14 0 L 22 138 L -48 144 Z"
            : "M -14 0 L 34 0 L 48 144 L -22 138 Z"
        }
        fill={C.clothDark} {...INK_STROKE} strokeWidth={5}
      />
      <path d="M -8 12 L -14 126 M 10 12 L 16 126" fill="none" stroke={C.clothAccent} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
  return (
    <>
      {flap(HIP_X * tx, sway(lHip), 1)}
      {flap(-HIP_X * tx, sway(rHip), -1)}
    </>
  );
};

const Pelvis: React.FC<{ tx: number }> = ({ tx }) => (
  <path
    d={`M ${n(-48 * tx)} -14 L ${n(48 * tx)} -14 L ${n(46 * tx)} 30 C ${n(38 * tx)} 50 ${n(-38 * tx)} 50 ${n(-46 * tx)} 30 Z`}
    fill={C.trousersBrown} {...INK_STROKE} strokeWidth={5}
  />
);

const Belt: React.FC<{ tx: number; glow: number }> = ({ tx }) => {
  const X = (v: number) => n(v * tx);
  return (
    <g>
      {/* cinturón de cuero oscuro */}
      <rect x={X(-50)} y={-28} width={n(100 * tx)} height={22} rx={4} fill={C.belt} {...INK_STROKE} strokeWidth={5} />
      {/* hebilla metálica clásica */}
      <rect x={-12} y={-30} width={24} height={26} rx={4} fill={C.gold} {...INK_STROKE} strokeWidth={4.5} />
      <rect x={-6} y={-24} width={12} height={14} rx={2} fill={C.belt} {...INK_STROKE} strokeWidth={3} />
    </g>
  );
};

const UpperTorso: React.FC<{ tx: number; breathe: number; glow: number }> = ({
  tx, breathe,
}) => {
  const X = (v: number) => n(v * tx);
  // Cuerpo base con camiseta verde apagado cuello en V (dull green V-neck t-shirt) y bata blanca abierta encima
  const torsoBase =
    `M ${X(-22)} -208 C ${X(-40)} -206 ${X(-54)} -200 ${X(-60)} -184 L ${X(-52)} -26 ` +
    `Q 0 -20 ${X(52)} -26 L ${X(60)} -184 C ${X(54)} -200 ${X(40)} -206 ${X(22)} -208 ` +
    `Q 0 -196 ${X(-22)} -208 Z`;
  const leftCoatPanel =
    `M ${X(-24)} -208 C ${X(-42)} -206 ${X(-56)} -200 ${X(-62)} -184 L ${X(-58)} -22 ` +
    `L ${X(-16)} -22 L ${X(-18)} -150 Z`;
  const rightCoatPanel =
    `M ${X(24)} -208 C ${X(42)} -206 ${X(56)} -200 ${X(62)} -184 L ${X(58)} -22 ` +
    `L ${X(16)} -22 L ${X(18)} -150 Z`;
  return (
    <g transform={`translate(0 -30) scale(1 ${n(breathe)}) translate(0 30)`}>
      {/* Camiseta interior verde apagado (dull green V-neck t-shirt) */}
      <path d={torsoBase} fill={C.shirtGreen} {...INK_STROKE} strokeWidth={6} />
      {/* Cuello en V mostrando la piel y clavícula */}
      <path d={`M ${X(-22)} -208 L 0 -154 L ${X(22)} -208 Q 0 -196 ${X(-22)} -208 Z`} fill={C.skin} {...INK_STROKE} strokeWidth={4.5} />
      <path d={`M ${X(-18)} -206 L 0 -164 L ${X(18)} -206 Z`} fill={C.skinShadow} opacity={0.35} />
      {/* Paneles delanteros de la bata blanca de laboratorio (loose long white lab coat) */}
      <path d={leftCoatPanel} fill={C.clothDark} {...INK_STROKE} strokeWidth={5.5} />
      <path d={rightCoatPanel} fill={C.clothDark} {...INK_STROKE} strokeWidth={5.5} />
      {/* Solapas anchas de la bata blanca */}
      <path d={`M ${X(-24)} -208 L ${X(-52)} -190 L ${X(-38)} -118 L ${X(-16)} -144 Z`} fill={C.clothAccent} {...INK_STROKE} strokeWidth={4.5} />
      <path d={`M ${X(24)} -208 L ${X(52)} -190 L ${X(38)} -118 L ${X(16)} -144 Z`} fill={C.clothAccent} {...INK_STROKE} strokeWidth={4.5} />
      {/* Bolsillo en el pecho con bolígrafo (detalle clásico de Okabe) */}
      <rect x={X(-46)} y={-136} width={n(22 * tx)} height={26} rx={3} fill={C.clothDark} {...INK_STROKE} strokeWidth={3.5} />
      <rect x={X(-40)} y={-144} width={4} height={10} rx={1.5} fill="#C83E37" {...INK_STROKE} strokeWidth={2.5} />
      {/* Pliegues de tela en la bata */}
      <path d={`M ${X(-38)} -76 Q ${X(-28)} -62 ${X(-22)} -72 M ${X(30)} -96 Q ${X(40)} -84 ${X(36)} -72`} fill="none" stroke={C.clothAccent} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

const Neck: React.FC = () => (
  <g>
    <path d="M -15 10 L -14 -34 L 14 -34 L 15 10 Z" fill={C.skin} />
    {/* sombra de oclusión bajo la barbilla */}
    <path d="M -14.5 -34 L 14.5 -34 L 15 -10 Q 0 2 -15 -10 Z" fill={C.skinShadow} />
    <path d="M -15 10 L -14 -34 M 15 10 L 14 -34" fill="none" {...INK_STROKE} strokeWidth={5} />
  </g>
);

/* ═════════════════════════ COMPONENTE PRINCIPAL ═════════════════════════ */

export const HeroPuppet: React.FC<HeroPuppetProps> = ({
  x, y, scale = 1, pose, flipX = false, id,
}) => {
  const autoId = React.useId();
  const uid = (id ?? autoId).replace(/[^a-zA-Z0-9_-]/g, "");
  const P = resolvePose(pose ?? {});

  const tx = 1 - 0.55 * P.turn; // estrechamiento horizontal al girar
  const lift = (P.breathe - 1) * TORSO_H; // cuánto sube el hombro al respirar
  const spineT = `rotate(${n(P.spine)} ${WAIST.x} ${WAIST.y})`;
  const upper = `${spineT} translate(0 ${n(-lift)})`;

  const irisEdge = mixColor(C.irisDeep, C.manaCyan, 0.35 * P.glow);
  const irisMid = mixColor(C.hairHighlight, C.manaCyan, 0.6 * P.glow);
  const irisCore = mixColor("#3E5C8A", C.manaCyan, 0.95 * P.glow);

  const sx = SHOULDER_X * tx;
  const hx = HIP_X * tx;

  return (
    <g transform={`translate(${n(x)} ${n(y)}) scale(${n(flipX ? -scale : scale)} ${n(scale)})`}>
      <defs>
        {/* cuenca ocular: encierra esclera + iris + pupila (se reutiliza en ambos ojos) */}
        <clipPath id={`eye-clip-${uid}`}>
          <ellipse cx={0} cy={0} rx={EYE_RX} ry={EYE_RY} />
        </clipPath>
        <radialGradient id={`iris-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={irisCore} />
          <stop offset="65%" stopColor={irisMid} />
          <stop offset="100%" stopColor={irisEdge} />
        </radialGradient>
      </defs>

      <g transform={`translate(0 ${n(P.bodyY)})`}>
        {/* 1 · Pierna trasera (izquierda, lejana) */}
        <Leg x={hx} hip={P.lHip} knee={P.lKnee} ankle={P.lAnkle} />

        {/* 2 · Brazo trasero (izquierdo, lejano) */}
        <g transform={upper}>
          <Arm
            x={sx} shoulder={P.lShoulder} elbow={P.lElbow} wrist={P.lWrist}
            hand={P.lHand} glow={P.glow} coin={false}
          />
        </g>

        {/* 3 · Torso inferior: pelvis + faldón */}
        <Pelvis tx={tx} />
        <Skirt tx={tx} lHip={P.lHip} rHip={P.rHip} spine={P.spine} />

        {/* 4 · Cinturón */}
        <g transform={spineT}>
          <Belt tx={tx} glow={P.glow} />
        </g>

        {/* 5 · Torso superior (respiración = escala Y) */}
        <g transform={spineT}>
          <UpperTorso tx={tx} breathe={P.breathe} glow={P.glow} />
        </g>

        {/* 6 · Cuello  7 · Cabeza  8 · Ojos  9 · Cabello (dentro de <Head/>) */}
        <g transform={`${upper} translate(0 ${NECK_Y})`}>
          <g transform={`rotate(${n(P.headRot * 0.4)})`}>
            <Neck />
          </g>
          <g transform={`rotate(${n(P.headRot)})`}>
            <Head P={P} id={uid} />
          </g>
        </g>

        {/* 10 · Brazo delantero (derecho, cercano) */}
        <g transform={upper}>
          <Arm
            x={-sx} shoulder={P.rShoulder} elbow={P.rElbow} wrist={P.rWrist}
            hand={P.rHand} glow={P.glow} coin={P.coin}
          />
        </g>

        {/* 11 · Pierna delantera (derecha, cercana) */}
        <Leg x={-hx} hip={P.rHip} knee={P.rKnee} ankle={P.rAnkle} />
      </g>
    </g>
  );
};

/* ═══════════════════════════ POSES PRECONFIGURADAS ═══════════════════════════ */

/** Respiración natural, peso en la cadera derecha, brazos sueltos. */
export const POSE_IDLE: HeroPose = {
  headRot: 3,
  look: { x: 4, y: -1 },
  blink: 0,
  smile: 0.15,
  eyebrow: 0,
  glow: 0.25,
  spineRot: -3,
  breathe: 1.015,
  leftShoulder: 6,
  leftElbow: 14,
  leftWrist: 4,
  leftHandPose: "relaxed",
  rightShoulder: 4,
  rightElbow: 20,
  rightWrist: 6,
  rightHandPose: "relaxed",
  leftHip: -3,
  leftKnee: 0,
  leftAnkle: -3,
  rightHip: 8,
  rightKnee: -16,
  rightAnkle: -8,
  turn: 0.3,
  bodyY: 0,
};

/** Mano en la barbilla, mirada inclinada, ceño calculador. */
export const POSE_ANALYSIS: HeroPose = {
  headRot: 8,
  look: { x: 9, y: -8 },
  blink: 0,
  smile: -0.2,
  eyebrow: 1,
  glow: 0.55,
  spineRot: 4,
  breathe: 1.012,
  leftShoulder: 8,
  leftElbow: 22,
  leftWrist: 6,
  leftHandPose: "relaxed",
  rightShoulder: -28,
  rightElbow: 145,
  rightWrist: 12,
  rightHandPose: "fist",
  leftHip: -2,
  leftKnee: 0,
  leftAnkle: -2,
  rightHip: 8,
  rightKnee: -16,
  rightAnkle: -8,
  turn: 0.4,
  bodyY: 0,
};

/** Cuerpo semi-perfilado, pulgar extendido lanzando la moneda. */
export const POSE_RAILGUN_FLICK: HeroPose = {
  headRot: 6,
  look: { x: 10, y: -6 },
  blink: 0,
  smile: 0.7,
  eyebrow: 1,
  glow: 0.9,
  spineRot: 6,
  breathe: 1.02,
  leftShoulder: 28,
  leftElbow: 30,
  leftWrist: 0,
  leftHandPose: "fist",
  rightShoulder: -80,
  rightElbow: 35,
  rightWrist: -15,
  rightHandPose: "flick",
  coin: true,
  rightHip: 25,
  rightKnee: -25,
  rightAnkle: 0,
  leftHip: -18,
  leftKnee: 0,
  leftAnkle: -18,
  turn: 0.75,
  bodyY: 14,
};

/** Dos dedos en la sien, listos para el chasquido hacia cámara. */
export const POSE_SNAP_LOOP: HeroPose = {
  headRot: -4,
  look: { x: 0, y: 0 },
  blink: 0,
  smile: 1,
  eyebrow: 0.4,
  glow: 0.8,
  spineRot: -2,
  breathe: 1.01,
  leftShoulder: 8,
  leftElbow: 20,
  leftWrist: 0,
  leftHandPose: "relaxed",
  rightShoulder: -111,
  rightElbow: 129,
  rightWrist: -28,
  rightHandPose: "snap",
  rightHip: 8,
  rightKnee: -16,
  rightAnkle: -8,
  leftHip: -3,
  leftKnee: 0,
  leftAnkle: -3,
  turn: 0.2,
  bodyY: 0,
};

/* ═════════════════════════ UTILIDAD DE ANIMACIÓN ═════════════════════════ */

const NUMERIC_DEFAULTS = {
  headRot: 0, blink: 0, smile: 0, eyebrow: 0, glow: 0, spineRot: 0, breathe: 1,
  leftShoulder: 0, leftElbow: 0, leftWrist: 0,
  rightShoulder: 0, rightElbow: 0, rightWrist: 0,
  leftHip: 0, leftKnee: 0, leftAnkle: 0,
  rightHip: 0, rightKnee: 0, rightAnkle: 0,
  turn: DEFAULT_TURN, bodyY: 0,
};
type NumericKey = keyof typeof NUMERIC_DEFAULTS;

/**
 * Interpola dos poses (t = 0 → a, t = 1 → b). Los campos numéricos se
 * interpolan; las poses de mano y la moneda cambian a t ≥ 0.5.
 * Ejemplo Motion Canvas:  lerpPose(POSE_IDLE, POSE_ANALYSIS, poseSignal())
 */
export const lerpPose = (a: HeroPose, b: HeroPose, t: number): HeroPose => {
  const out: HeroPose = {};
  (Object.keys(NUMERIC_DEFAULTS) as NumericKey[]).forEach((k) => {
    out[k] = lerp(a[k] ?? NUMERIC_DEFAULTS[k], b[k] ?? NUMERIC_DEFAULTS[k], t);
  });
  out.look = {
    x: lerp(a.look?.x ?? 0, b.look?.x ?? 0, t),
    y: lerp(a.look?.y ?? 0, b.look?.y ?? 0, t),
  };
  const src = t < 0.5 ? a : b;
  out.leftHandPose = src.leftHandPose;
  out.rightHandPose = src.rightHandPose;
  out.coin = src.coin;
  return out;
};

export default HeroPuppet;
