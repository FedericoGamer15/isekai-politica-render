/**
 * isekai-politica-video/src/components/World2D.tsx
 * "¡No vayas a un Isekai sin saber ESTO de política!"  1080x1920 · 60 fps · 3600 frames
 *
 * ENTREGA 3/3 (FINAL)  ->  Base + constantes + SFX + SVGs + ESCENAS 0-4 + iris-wipe final + banderas de pulido.
 * (Solo quedan ajustes visuales que exigen render: ver "RESUMEN DE ESTADO" al final del archivo.)
 *
 * CONVENCIONES (importantes para las entregas 2 y 3)
 *  - Cada escena es un <Sequence>; dentro de ella useCurrentFrame() es LOCAL (0 = inicio de la escena).
 *    Las tablas S0_T / S1_T / S2_T / S3_T / S4_T están en frames LOCALES (comentario con el absoluto).
 *  - Los SFX son ABSOLUTOS y viven en SFX_CUES (los reproduce <SfxLayer/> en el master).
 *  - Cada escena dura (to - from) + SCENE_TAIL frames: la cola queda debajo de la escena siguiente,
 *    que entra encima con whip-pan / bloom, así nunca se ve un hueco.
 *  - mcX/mcY del catálogo son el CENTRO del sprite respecto al centro del lienzo (540,960), con Y hacia ABAJO.
 *    Tamaño real en pantalla = (ancho/alto nativo) * ART_K. Los fondos scene_XX_bg se estiran a 1080x1920.
 *  - ANCHORS son fracciones (0..1) dentro de la caja del sprite; son estimaciones: afinar tras el primer render.
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

/* ══════════════════════════════════════════════════════════════════════════
 * 0. CONSTANTES GLOBALES
 * ════════════════════════════════════════════════════════════════════════ */
export const FPS = 60;
export const TOTAL_FRAMES = 3600;
export const W = 1080;
export const H = 1920;
export const CX = W / 2;
export const CY = H / 2;
/** Zona segura de UI: títulos/letreros NO deben pasar de x>918 ni de y>1632. */
export const SAFE = { left: 60, right: 918, top: 90, bottom: 1632 } as const;

/* ── Banderas de pulido: se cambian aquí y se re-renderiza; no hay que tocar nada más ── */
/** true = dibuja cruces con etiqueta sobre los ANCHORS de la Escena 4 (astrolabio, ojo, boca, pajita). */
export const DEBUG_ANCHORS = false;
/** Escena 0: la corona vectorial (CrownGag) se SUMA a la corona torcida que ya trae el sprite del estudiante.
 *  Revisar los frames 90, 140 y 166: si se ven DOS coronas, ponerla en false. */
export const ENABLE_CROWN_GAG = true;
/** Escena 4: párpado vectorial del guiño. Si queda desalineado con el ojo real, ponerlo en false
 *  (el guiño sigue funcionando con estrellas + inclinación de cabeza). */
export const WINK_LID = true;

export const PALETTE = {
  parchment: "#FBF7EE",
  parchment2: "#EADFC4",
  ink: "#2A1B12",
  inkSoft: "#4A3426",
  gold: "#E2B13C",
  goldDeep: "#B8862B",
  indigo: "#2C2F6B",
  blood: "#9B2D20",
  emerald: "#2E8B6A",
  steel: "#C9CED6",
  skin: "#F2C9A0",
} as const;

export const FONT_TITLE =
  '"Cinzel Decorative","Cinzel","IM Fell English SC","Palatino Linotype",Georgia,serif';

/* ══════════════════════════════════════════════════════════════════════════
 * 1. CATÁLOGO DE ACTIVOS CANVA PRO
 * ════════════════════════════════════════════════════════════════════════ */
export const CANVA_ASSETS = {
  // ESCENA 0 [00:00 - 00:05] (f.0 - f.300): EL GANCHO
  scene_00_bg: {
    src: "assets/2d/environments/scene_00_bg.png",
    width: 1072, height: 1920, mcX: 0, mcY: 0, mcBottomY: 960,
    desc: "Trono de piedra en castillo en ruinas (placa limpia Canva reconstructed)"
  },
  student_on_ruined_throne: {
    src: "assets/2d/characters/student_on_ruined_throne.png",
    width: 1454, height: 2665, mcX: 4, mcY: -5, mcBottomY: 924,
    desc: "Estudiante con corona torcida sentado en el trono con capa real (100% alfa Canva)"
  },
  open_chest_coin: {
    src: "assets/2d/props/open_chest_coin.png",
    width: 615, height: 853, mcX: 302, mcY: 585, mcBottomY: 882,
    desc: "Cofre del tesoro abierto con 1 moneda y telaraña (alfa transparente)"
  },

  // ESCENA 1 [00:05 - 00:12] (f.300 - f.720): EL PROBLEMA Y EL ARMA SECRETA
  scene_01_bg: {
    src: "assets/2d/environments/scene_01_bg.png",
    width: 1072, height: 1920, mcX: 0, mcY: 0, mcBottomY: 960,
    desc: "Taller arcano índigo limpio sin personajes (placa limpia Canva reconstructed)"
  },
  mc_close_smug: {
    src: "assets/2d/characters/mc_close_smug.png",
    width: 1536, height: 2659, mcX: 0, mcY: 32, mcBottomY: 960,
    desc: "Primer plano astuto del MC con ojos brillantes y sonrisa confiada (100% alfa Canva)"
  },
  crumbling_noble: {
    src: "assets/2d/characters/crumbling_noble.png",
    width: 783, height: 1211, mcX: 221, mcY: -384, mcBottomY: 38,
    desc: "Noble absolutista desmoronándose como carbón (alfa transparente)"
  },
  magical_blueprints: {
    src: "assets/2d/props/magical_blueprints.png",
    width: 1229, height: 1101, mcX: 0, mcY: 0, mcBottomY: 384,
    desc: "Planos arquitectónicos mágicos dorados desplegados (alfa transparente)"
  },

  // ESCENA 2 [00:12 - 00:31] (f.720 - f.1860): LOS 3 BLOQUES AUTÓNOMOS
  scene_02_bg: {
    src: "assets/2d/environments/scene_02_bg.png",
    width: 1072, height: 1920, mcX: 0, mcY: 0, mcBottomY: 960,
    desc: "Pergamino manuscrito antiguo sin elementos (placa limpia Canva reconstructed)"
  },
  three_powers_runic_assembly: {
    src: "assets/2d/props/three_powers_runic_assembly.png",
    width: 1495, height: 2674, mcX: 5, mcY: -9, mcBottomY: 924,
    desc: "Ensemble completo de los 3 Bloques Autónomos rúnicos (100% alfa Canva)"
  },
  table_legislative_grimoire: {
    src: "assets/2d/props/table_legislative_grimoire.png",
    width: 814, height: 1211, mcX: -233, mcY: -384, mcBottomY: 38,
    desc: "Mesa redonda del Bloque Legislativo redactando el Grimorio (alfa transparente)"
  },
  chibi_mc_padlock: {
    src: "assets/2d/characters/chibi_mc_padlock.png",
    width: 384, height: 716, mcX: -27, mcY: -173, mcBottomY: 77,
    desc: "Chibi MC con candado gigante intentando alterar la ley sin éxito (alfa transparente)"
  },
  table_executive_strategy: {
    src: "assets/2d/props/table_executive_strategy.png",
    width: 768, height: 1211, mcX: 248, mcY: -384, mcBottomY: 38,
    desc: "Mesa de estrategia del Bloque Ejecutivo con mapas y bolsas de oro (alfa transparente)"
  },
  scale_judicial_balance: {
    src: "assets/2d/props/scale_judicial_balance.png",
    width: 1291, height: 1183, mcX: 0, mcY: 451, mcBottomY: 864,
    desc: "Balanza de hierro del Bloque Judicial con jueza ciega y mazo (alfa transparente)"
  },

  // ESCENA 3 [00:31 - 00:51] (f.1860 - f.3060): LOS 14 MINISTERIOS EN 4 MISIONES
  scene_03_bg: {
    src: "assets/2d/environments/scene_03_bg.png",
    width: 1072, height: 1920, mcX: 0, mcY: 0, mcBottomY: 960,
    desc: "Árbol de Habilidades RPG parte 1 limpio sin escudos (placa limpia Canva reconstructed)"
  },
  shields_logistics_hr: {
    src: "assets/2d/props/shields_logistics_hr.png",
    width: 1483, height: 2677, mcX: 2, mcY: -7, mcBottomY: 927,
    desc: "Escudos Oro (Logística) y Esmeralda (RRHH) ensamblados (100% alfa Canva)"
  },
  shield_logistics_gold: {
    src: "assets/2d/props/shield_logistics_gold.png",
    width: 752, height: 2091, mcX: -243, mcY: 0, mcBottomY: 730,
    desc: "Escudo Dorado de Logística: Economía, Trabajo, Agricultura (alfa transparente)"
  },
  shield_human_resources_emerald: {
    src: "assets/2d/props/shield_human_resources_emerald.png",
    width: 752, height: 2091, mcX: 243, mcY: 0, mcBottomY: 730,
    desc: "Escudo Esmeralda de RRHH: Salud, Educación, Desarrollo Social (alfa transparente)"
  },

  scene_04_bg: {
    src: "assets/2d/environments/scene_04_bg.png",
    width: 1072, height: 1920, mcX: 0, mcY: 0, mcBottomY: 960,
    desc: "Árbol de Habilidades RPG parte 2 limpio sin escudos (placa limpia Canva reconstructed)"
  },
  shields_territory_planning: {
    src: "assets/2d/props/shields_territory_planning.png",
    width: 1536, height: 2604, mcX: 0, mcY: 35, mcBottomY: 944,
    desc: "Escudos Acero (Territorio) y Piedra (Planificación) ensamblados (100% alfa Canva)"
  },
  shield_territory_steel: {
    src: "assets/2d/props/shield_territory_steel.png",
    width: 752, height: 2091, mcX: -243, mcY: 0, mcBottomY: 730,
    desc: "Escudo de Acero de Territorio: Interior, Defensa, Relaciones Exteriores (alfa transparente)"
  },
  shield_planning_stone: {
    src: "assets/2d/props/shield_planning_stone.png",
    width: 752, height: 2091, mcX: 243, mcY: 0, mcBottomY: 730,
    desc: "Escudo de Piedra de Planificación: Transporte, Vivienda, Ambiente (alfa transparente)"
  },

  // ESCENA 4 [00:51 - 01:00] (f.3060 - f.3600): CLÍMAX Y CIERRE
  scene_05_bg: {
    src: "assets/2d/environments/scene_05_bg.png",
    width: 1072, height: 1920, mcX: 0, mcY: 0, mcBottomY: 960,
    desc: "Reino próspero soleado sin reloj ni MC en balcón (placa limpia Canva reconstructed)"
  },
  celestial_clockwork_astrolabe: {
    src: "assets/2d/props/celestial_clockwork_astrolabe.png",
    width: 1536, height: 2719, mcX: 0, mcY: -12, mcBottomY: 936,
    desc: "Astrolabio celestial de engranajes dorados y runas giratorias (100% alfa Canva)"
  },
  student_king_balcony_sipping: {
    src: "assets/2d/characters/student_king_balcony_sipping.png",
    width: 797, height: 1347, mcX: 260, mcY: 424, mcBottomY: 894,
    desc: "Estudiante rey relajado en balcón bebiendo jugo con pajita (100% alfa Canva)"
  },
} as const;

export type AssetKey = keyof typeof CANVA_ASSETS;

/**
 * Factor de escala de los sprites (no-fondo) en pantalla.
 * Deducido del propio catálogo: (mcBottomY - mcY) * 2 / altura nativa ≈ 0.697 en TODOS los props/personajes.
 */
export const ART_K = 0.697;

/** Caja en pantalla (px, sistema 1080x1920) de un sprite del catálogo. */
export const spriteBox = (asset: AssetKey) => {
  const a = CANVA_ASSETS[asset];
  const isBg = asset.startsWith("scene_");
  const w = isBg ? W : a.width * ART_K;
  const h = isBg ? H : a.height * ART_K;
  return { w, h, left: CX + a.mcX - w / 2, top: CY + a.mcY - h / 2 };
};

/** Fracciones (0..1) dentro de la caja del sprite. ⚠ ESTIMADAS: afinar tras el primer render. */
export const ANCHORS = {
  student: { crownY: 0.205, eyesY: 0.285, crownW: 0.3 },
  chestCoin: { x: 0.5, y: 0.38 },
  noble: { handX: 0.2, handY: 0.5 },
  mcClose: { eyeL: { x: 0.37, y: 0.255 }, eyeR: { x: 0.63, y: 0.255 } },
  /** Escena 4 (⚠ estimados). x,y = fracción de la caja 1070x1895; r = radio visible del reloj como fracción del ANCHO. */
  astrolabe: { x: 0.5, y: 0.34, r: 0.34 },
  /** Escena 4 (⚠ estimados). Fracciones de la caja del rey 555x939; eyeW = ancho del ojo como fracción del ANCHO de la caja. */
  king: { eye: { x: 0.52, y: 0.17 }, mouth: { x: 0.47, y: 0.235 }, straw: { x: 0.36, y: 0.30 }, eyeW: 0.075 },
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 * 2. CRONOGRAMA (frames LOCALES por escena)
 * ════════════════════════════════════════════════════════════════════════ */
export const SCENES = {
  s0: { from: 0, to: 300 },
  s1: { from: 300, to: 720 },
  s2: { from: 720, to: 1860 },
  s3: { from: 1860, to: 3060 },
  s4: { from: 3060, to: 3600 },
} as const;
export const SCENE_TAIL = 14;

/** Escena 0 (local = absoluto). */
export const S0_T = {
  flashEnd: 45,
  spinStart: 30, spinEnd: 90,
  fallStart: 30, impact: 55,
  crownDrop: 90, crownPoke: 140, crownUp: 158, eyeBags: 166,
  titleIn: 96, titleOut: 282,
  chestIn: 120, chestLand: 150, coinGlint: 176,
  scrollIn: 190,
} as const;

/** Escena 1 (local = abs - 300). */
export const S1_T = {
  nobleIn: 6,
  swordRaise: 36, swordStrike: 72, impactBend: 80,      // abs 380 = electrical_powerdown
  dissolveStart: 84, dissolveEnd: 150,
  whipZoom: 150, cut: 166, eyeGlint: 180,                // abs 450 / 466 / 480 (click2)
  blueprints: 250, riser: 260, mcShrink: 250, bloom: 420, // abs 550 / 560 (tension_riser) / 720
} as const;

/** Escena 2 (local = abs - 720). */
export const S2_T = {
  stones: 0, crownCrack: 30, crownSplit: 46, stonesOut: 56, assemblyIn: 92,   // corona -> 3 piedras -> ensemble
  legislative: 140, chibiIn: 170, padlock: 260, seal: 440,                    // abs 860 / 980 (switch2) / 1160
  executive: 460, execIn: 470, table: 600,                                    // abs 1180 / 1320 (click3)
  judicial: 780, judIn: 790, whoosh: 790, thud: 940,                          // abs 1500 / 1510 / 1660
  pullOut: 1040, converge: 1090, end: 1140,
} as const;

/** Escena 3 (local = abs - 1860). Los frames marcados (derived) no vienen en el prompt. */
export const S3_T = {
  glasses: 0, glassAdjust: 20, glassSweep: 30,
  badges: 78, snap: 75, mcExit: 88,              // snap = abs 1935 (switch1)
  missions12: 120, gold: 150, emerald: 300,      // abs 2010 (click1) / 2160 (click2)   (derived)
  exit12: 540,                                   // abs 2400 (switch5)                  (derived)
  pan: 630, missions34: 660,                     // pan abs 2490 (whoosh)               (derived)
  steel: 720, stone: 870,                        // abs 2580 / 2730 (switch10)          (derived)
  pulse1: 1080, pulse2: 1130, end: 1200,         // abs 2940 (click4) / 2990 (click5)
} as const;

/** Escena 4 (local = abs - 3060). Las 6 primeras claves vienen del prompt; el resto es (derived). */
export const S4_T = {
  zoomOut: 0, thud: 20, balcony: 240, slurp: 390, wink: 460, irisEnd: 540,   // thud abs 3080 / wink abs 3520 / fin abs 3600
  capClock: 36, capGears: 150, capFinale: 262, scroll: 300,                  // (derived) captions y pergamino
  push: 470, irisStart: 500,                                                 // (derived) push-in y apertura del iris
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 * 3. AUDIO (SFX) Y VFX
 * ════════════════════════════════════════════════════════════════════════ */
const SFX_ROOT = "assets/audio/sfx";
export const SFX = {
  click1: `${SFX_ROOT}/ui/click1.wav`,
  click2: `${SFX_ROOT}/ui/click2.wav`,
  click3: `${SFX_ROOT}/ui/click3.wav`,
  click4: `${SFX_ROOT}/ui/click4.wav`,
  click5: `${SFX_ROOT}/ui/click5.wav`,
  switch1: `${SFX_ROOT}/ui/switch1.wav`,
  switch2: `${SFX_ROOT}/ui/switch2.wav`,
  switch5: `${SFX_ROOT}/ui/switch5.wav`,
  switch10: `${SFX_ROOT}/ui/switch10.wav`,
  mouseclick1: `${SFX_ROOT}/ui/mouseclick1.wav`,
  whooshFast: `${SFX_ROOT}/whooshes/whoosh_fast.wav`,
  whooshCinematic: `${SFX_ROOT}/whooshes/whoosh_cinematic.wav`,
  subImpactThud: `${SFX_ROOT}/impacts/sub_impact_thud.wav`,
  electricalPowerdown: `${SFX_ROOT}/glitches/electrical_powerdown.wav`,
  radioStaticBurst: `${SFX_ROOT}/glitches/radio_static_burst.wav`,
  tensionRiser: `${SFX_ROOT}/ambience/tension_riser.wav`,
} as const;
export type SfxKey = keyof typeof SFX;

export type SfxCue = {
  frame: number;            // ABSOLUTO (0..3600)
  sfx: SfxKey | null;       // null = falta el archivo (placeholder)
  volume: number;
  dur?: number;             // frames que dura el <Sequence> (por defecto 240)
  note: string;
  derived?: boolean;        // true = frame inventado por mí (el prompt no daba frame exacto)
};

export const SFX_CUES: ReadonlyArray<SfxCue> = [
  // Escena 0
  { frame: 10, sfx: "whooshCinematic", volume: 0.9, note: "Truck-kun beam" },
  { frame: 55, sfx: "subImpactThud", volume: 1, note: "Aterrizaje en el trono" },
  { frame: 140, sfx: "click1", volume: 0.8, note: "Dedo sube la corona" },
  // Escena 1
  { frame: 310, sfx: "whooshFast", volume: 0.8, note: "Whip-pan de entrada" },
  { frame: 380, sfx: "electricalPowerdown", volume: 0.9, note: "Espada se dobla / noble se desmorona" },
  { frame: 480, sfx: "click2", volume: 0.8, note: "Destello de ojos del MC" },
  { frame: 560, sfx: "tensionRiser", volume: 0.7, dur: 600, note: "Despliegue de planos mágicos" },
  // Escena 2
  { frame: 980, sfx: "switch2", volume: 0.8, note: "Candado del chibi MC" },
  { frame: 1320, sfx: "click3", volume: 0.8, note: "Mesa ejecutiva" },
  { frame: 1510, sfx: "whooshFast", volume: 0.8, note: "Paneo a la balanza" },
  { frame: 1660, sfx: "subImpactThud", volume: 1, note: "Mazo de la jueza" },
  // Escena 3
  { frame: 1935, sfx: "switch1", volume: 0.8, note: "Chasquido de dedos del MC", derived: true },
  { frame: 2010, sfx: "click1", volume: 0.8, note: "Entra escudo dorado", derived: true },
  { frame: 2160, sfx: "click2", volume: 0.8, note: "Entra escudo esmeralda", derived: true },
  { frame: 2400, sfx: "switch5", volume: 0.8, note: "Cierre misiones 1-2", derived: true },
  { frame: 2490, sfx: "whooshFast", volume: 0.7, note: "Paneo a scene_04_bg", derived: true },
  { frame: 2580, sfx: "switch10", volume: 0.7, note: "Entra escudo de acero", derived: true },
  { frame: 2730, sfx: "switch10", volume: 0.7, note: "Entra escudo de piedra", derived: true },
  { frame: 2940, sfx: "click4", volume: 0.8, note: "Pulso de 14 insignias", derived: true },
  { frame: 2990, sfx: "click5", volume: 0.8, note: "Pulso de 14 insignias", derived: true },
  // Escena 4
  { frame: 3080, sfx: "subImpactThud", volume: 1, note: "Astrolabio encaja" },
  { frame: 3300, sfx: "whooshFast", volume: 0.6, note: "El rey entra al balcón", derived: true },
  { frame: 3450, sfx: null, volume: 0.8, note: "TODO: sorbo de jugo cómico (no hay archivo en el catálogo)" },
  { frame: 3520, sfx: "switch1", volume: 0.8, note: "Guiño del MC" },
];

export const VFX = {
  star01: "assets/2d/vfx/particles/star_01.png",
  star02: "assets/2d/vfx/particles/star_02.png",
  light01: "assets/2d/vfx/particles/light_01.png",
  light02: "assets/2d/vfx/particles/light_02.png",
  fire01: "assets/2d/vfx/particles/fire_01.png",
  smoke: [1, 2, 3, 4, 5].map((n) => `assets/2d/vfx/smoke/smoke_0${n}.png`),
  spark: [1, 2, 3, 4].map((n) => `assets/2d/vfx/sparks/spark_0${n}.png`),
};

/** Reproduce todos los SFX en su frame absoluto exacto. */
export const SfxLayer: React.FC = () => (
  <>
    {SFX_CUES.map((c, i) =>
      c.sfx === null ? null : (
        <Sequence key={`${c.sfx}-${c.frame}-${i}`} from={c.frame} durationInFrames={c.dur ?? 240} layout="none">
          <Audio src={staticFile(SFX[c.sfx])} volume={c.volume} />
        </Sequence>
      )
    )}
  </>
);

/* ══════════════════════════════════════════════════════════════════════════
 * 4. UTILIDADES DE ANIMACIÓN (springs, squash & stretch, line-boil)
 * ════════════════════════════════════════════════════════════════════════ */
export type SpringCfg = { damping: number; stiffness: number; mass?: number };
export const SPRING_BOUNCE: SpringCfg = { damping: 11, stiffness: 130 }; // regla del prompt
export const SPRING_SOFT: SpringCfg = { damping: 18, stiffness: 90 };
export const SPRING_SNAP: SpringCfg = { damping: 14, stiffness: 200 };

export const ease = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  outExpo: Easing.out(Easing.exp),
};

/** interpolate con clamp en ambos extremos. */
export const ramp = (
  f: number,
  input: [number, number],
  output: [number, number],
  easing?: (t: number) => number
) => interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const springAt = (f: number, delay: number, fps: number, config: SpringCfg = SPRING_BOUNCE) =>
  spring({ frame: Math.max(0, f - delay), fps, config });

/** Pseudo-aleatorio determinista (0..1). */
export const rand = (i: number, seed = 0) => {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Squash & stretch de aterrizaje.
 *  antes del impacto: estirado (sx .88 / sy 1.18); en el impacto: aplastado (sx 1.25 / sy .80); luego rebote elástico.
 */
export const landingSquash = (f: number, hit: number, fps: number, amp = 1) => {
  if (f < hit) return { sx: 1 - 0.12 * amp, sy: 1 + 0.18 * amp };
  const t = springAt(f, hit, fps, SPRING_BOUNCE); // 0 -> 1 con overshoot
  return { sx: 1 + 0.25 * amp * (1 - t), sy: 1 - 0.2 * amp * (1 - t) };
};

/** Frame ABSOLUTO compartido por contexto (los Sequence resetean useCurrentFrame, esto no). */
const FrameCtx = React.createContext(0);
export const FrameProvider = FrameCtx.Provider;
export const useAbsFrame = () => React.useContext(FrameCtx);

/** Line-boil a 20 fps (fórmula del prompt). `seed` desfasa cada capa; `amp` = intensidad. */
export const useBoil = (seed = 0, amp = 1) => {
  const abs = useAbsFrame();
  const stepFrame = Math.floor(abs / 3) + seed * 13;
  return {
    x: Math.sin(stepFrame * 17.3) * 1.5 * amp,
    y: Math.cos(stepFrame * 23.7) * 1.5 * amp,
    rot: ((stepFrame % 3) - 1) * 0.35 * amp,
    step: stepFrame,
  };
};

/* ══════════════════════════════════════════════════════════════════════════
 * 5. SPRITE ILUSTRADO (consume CANVA_ASSETS)
 * ════════════════════════════════════════════════════════════════════════ */
const INK_FILTER =
  "drop-shadow(6px 10px 0px rgba(42,27,18,0.28)) drop-shadow(0px 0px 1.5px rgba(42,27,18,0.85))";

export type ArtSpriteProps = {
  asset: AssetKey;
  scale?: number;
  dx?: number;
  dy?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  opacity?: number;
  origin?: string;
  boil?: boolean;
  boilSeed?: number;
  boilAmp?: number;
  ink?: boolean;
  blur?: number;
  extraFilter?: string;
  blend?: React.CSSProperties["mixBlendMode"];
  flipX?: boolean;
  children?: React.ReactNode; // overlays en coordenadas LOCALES del sprite (px de la caja)
};

export const ArtSprite: React.FC<ArtSpriteProps> = ({
  asset, scale = 1, dx = 0, dy = 0, rot = 0, sx = 1, sy = 1, opacity = 1,
  origin = "50% 100%", boil = true, boilSeed = 0, boilAmp = 1, ink = true, blur = 0,
  extraFilter = "", blend, flipX = false, children,
}) => {
  const a = CANVA_ASSETS[asset];
  const isBg = asset.startsWith("scene_");
  const box = spriteBox(asset);
  const b = useBoil(boilSeed, boil ? boilAmp : 0);
  const filters = [ink && !isBg ? INK_FILTER : "", blur > 0 ? `blur(${blur}px)` : "", extraFilter]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.w,
        height: box.h,
        opacity,
        transformOrigin: origin,
        transform: `translate(${dx + b.x}px, ${dy + b.y}px) rotate(${rot + b.rot}deg) scale(${(flipX ? -1 : 1) * sx * scale}, ${sy * scale})`,
        filter: filters || undefined,
        mixBlendMode: blend,
        willChange: "transform",
      }}
    >
      <Img
        src={staticFile(a.src)}
        style={{ width: "100%", height: "100%", objectFit: isBg ? "cover" : "contain", display: "block" }}
      />
      {children}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 6. SVGs REUTILIZABLES (tinta, pergamino, medieval, VFX vectoriales)
 * ════════════════════════════════════════════════════════════════════════ */

/** Defs globales: filtro de temblor de tinta (usar con filter="url(#ink-wobble)"). Montar UNA vez en el master. */
export const InkFilterDefs: React.FC = () => {
  const abs = useAbsFrame();
  const seed = Math.floor(abs / 3) % 7;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id="ink-wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.022" numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};

/** Disolución tipo carbón: progress 0 (intacto) -> 1 (desaparece). Aplicar con style={{filter:`url(#${id})`}}. */
export const DissolveDefs: React.FC<{ id: string; progress: number; seed?: number; freq?: number }> = ({
  id, progress, seed = 3, freq = 0.011,
}) => {
  const t = -0.1 + 1.15 * progress;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={seed} result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="mask">
            <feFuncA type="linear" slope={14} intercept={-14 * t} />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
      </defs>
    </svg>
  );
};

/** Grano de papel acuarela (parpadea a 20 fps). */
export const PaperGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => {
  const abs = useAbsFrame();
  const seed = Math.floor(abs / 3) % 5;
  return (
    <svg width={W + 40} height={H + 40} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity, pointerEvents: "none" }}>
      <filter id="paper-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-grain)" />
    </svg>
  );
};

/** Viñeta de tinta en los bordes. */
export const InkVignette: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
    <defs>
      <radialGradient id="ink-vig" cx="50%" cy="48%" r="75%">
        <stop offset="55%" stopColor={PALETTE.ink} stopOpacity="0" />
        <stop offset="100%" stopColor={PALETTE.ink} stopOpacity="0.55" />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#ink-vig)" />
  </svg>
);

const CORNER_D =
  "M4 146 C4 70 30 30 90 8 M4 146 C30 100 60 70 112 56 M90 8 C112 2 132 12 126 30 C120 46 100 44 98 32 C97 24 106 22 110 28 M112 56 C128 54 142 62 138 78 C134 90 118 88 118 78";
const LEAF_D = "M30 60 C20 40 34 24 52 22 C50 40 44 54 30 60 Z";

/** Marco medieval: 4 viñetas de esquina + doble filete a mano. (Es decoración de borde, sin texto.) */
export const MedievalFrame: React.FC<{ inset?: number; color?: string; opacity?: number }> = ({
  inset = 26, color = PALETTE.ink, opacity = 0.8,
}) => {
  const c = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path d={CORNER_D} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      <path d={LEAF_D} fill={PALETTE.gold} stroke={color} strokeWidth={3} />
    </g>
  );
  const l = inset, r = W - inset, t = inset, bt = H - inset, len = 150;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      <g filter="url(#ink-wobble)">
        <path
          d={`M${l + len} ${t} H${r - len} M${l + len} ${bt} H${r - len} M${l} ${t + len} V${bt - len} M${r} ${t + len} V${bt - len}`}
          stroke={color} strokeWidth={3} fill="none"
        />
        {c(l, t, 1, 1)}
        {c(r, t, -1, 1)}
        {c(l, bt, 1, -1)}
        {c(r, bt, -1, -1)}
      </g>
    </svg>
  );
};

export type ScrollLine = { t: string; size?: number; fill?: string };

/** Pergamino enrollable (rodillos + cuerpo de bordes ondulados). unroll: 0..1. */
export const ParchmentScroll: React.FC<{
  id: string; unroll: number; lines: ScrollLine[]; width?: number;
}> = ({ id, unroll, lines, width = 760 }) => {
  const bodyMax = 290, top = 70;
  const bh = Math.max(4, bodyMax * Math.min(1, Math.max(0, unroll)));
  const bottom = top + bh;
  const body = `M 72 ${top} L 690 ${top} C 682 ${top + bh * 0.35} 702 ${top + bh * 0.7} 688 ${bottom} L 74 ${bottom} C 84 ${top + bh * 0.68} 62 ${top + bh * 0.34} 72 ${top} Z`;
  const roll = (cy: number) => (
    <g>
      <path
        d={`M 44 ${cy - 32} L 716 ${cy - 32} C 740 ${cy - 30} 744 ${cy + 30} 716 ${cy + 32} L 44 ${cy + 32} C 18 ${cy + 30} 14 ${cy - 30} 44 ${cy - 32} Z`}
        fill={`url(#${id}-roll)`} stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round"
      />
      <ellipse cx={30} cy={cy} rx={16} ry={32} fill={PALETTE.parchment2} stroke={PALETTE.ink} strokeWidth={4} />
      <path d={`M 30 ${cy - 20} C 42 ${cy - 20} 42 ${cy + 4} 28 ${cy + 6} C 20 ${cy + 6} 20 ${cy - 8} 30 ${cy - 8}`} fill="none" stroke={PALETTE.inkSoft} strokeWidth={3} />
      <ellipse cx={730} cy={cy} rx={16} ry={32} fill={PALETTE.parchment2} stroke={PALETTE.ink} strokeWidth={4} />
    </g>
  );
  const totalText = lines.reduce((s, l) => s + (l.size ?? 52) * 1.2, 0);
  let cursor = top + bodyMax / 2 - totalText / 2;
  return (
    <svg width={width} height={width * (430 / 760)} viewBox="0 0 760 430" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PALETTE.parchment} />
          <stop offset="100%" stopColor={PALETTE.parchment2} />
        </linearGradient>
        <linearGradient id={`${id}-roll`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PALETTE.parchment} />
          <stop offset="100%" stopColor="#C9B58A" />
        </linearGradient>
        <clipPath id={`${id}-clip`}><path d={body} /></clipPath>
      </defs>
      <g filter="url(#ink-wobble)">
        <path d={body} fill={`url(#${id}-paper)`} stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round" />
        <g clipPath={`url(#${id}-clip)`}>
          <circle cx={140} cy={120} r={46} fill="#B8862B" opacity={0.12} />
          <circle cx={610} cy={300} r={60} fill="#9B2D20" opacity={0.08} />
          <circle cx={400} cy={210} r={90} fill="#B8862B" opacity={0.07} />
          {lines.map((l, i) => {
            const size = l.size ?? 52;
            const y = cursor + size * 0.95;
            cursor += size * 1.2;
            return (
              <text key={i} x={381} y={y} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={900} fontSize={size} fill={l.fill ?? PALETTE.ink}>
                {l.t}
              </text>
            );
          })}
        </g>
        {roll(36)}
        {roll(bottom + 30)}
      </g>
    </svg>
  );
};

export type CapPart = { t: string; fill?: string };
export type CapLine = { size?: number; parts: CapPart[] };
export const cap = (t: string, size = 56, fill?: string): CapLine => ({ size, parts: [{ t, fill }] });

/** Letrero de pincelada de tinta (NO es una caja redondeada). progress 0..1 = barrido izquierda->derecha. */
export const BrushCaption: React.FC<{
  lines: CapLine[]; progress: number; y: number; x?: number; width?: number; rot?: number; opacity?: number;
}> = ({ lines, progress, y, x = SAFE.left, width = SAFE.right - SAFE.left, rot = -1.5, opacity = 1 }) => {
  const p = Math.min(1, Math.max(0, progress));
  if (p <= 0 || opacity <= 0) return null;
  const textH = lines.reduce((s, l) => s + (l.size ?? 56) * 1.16, 0);
  const h = textH + 70;
  return (
    <div style={{ position: "absolute", left: x, top: y, width, height: h, transform: `rotate(${rot}deg)`, opacity, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
      <svg width={width} height={h} viewBox="0 0 700 160" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, filter: "url(#ink-wobble)" }}>
        <path d="M 6 34 C 70 6 190 44 340 20 S 600 40 694 12 L 700 128 C 610 154 470 108 340 140 S 90 122 2 150 Z" fill={PALETTE.ink} />
        <path d="M 14 44 C 90 22 200 54 340 34 S 600 52 688 26" fill="none" stroke={PALETTE.gold} strokeWidth={3} opacity={0.7} vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT_TITLE, fontWeight: 900, lineHeight: 1.16, textAlign: "center", whiteSpace: "nowrap" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: l.size ?? 56 }}>
            {l.parts.map((pt, j) => (
              <span key={j} style={{ color: pt.fill ?? PALETTE.parchment }}>{pt.t}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Onomatopeya de manga con contorno de tinta y pop elástico. */
export const Onomatopoeia: React.FC<{
  text: string; x: number; y: number; f: number; start: number; fps: number;
  size?: number; rot?: number; fill?: string; life?: number;
}> = ({ text, x, y, f, start, fps, size = 150, rot = -8, fill = PALETTE.gold, life = 60 }) => {
  if (f < start) return null;
  const s = springAt(f, start, fps, SPRING_BOUNCE);
  const op = ramp(f, [start + life - 12, start + life], [1, 0]);
  if (op <= 0) return null;
  return (
    <svg width={800} height={320} viewBox="0 0 800 320" style={{ position: "absolute", left: x - 400, top: y - 160, opacity: op, transform: `rotate(${rot}deg) scale(${s})`, overflow: "visible" }}>
      <g filter="url(#ink-wobble)">
        <text x={408} y={218} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={900} fontSize={size} fill={PALETTE.ink}>{text}</text>
        <text x={400} y={210} textAnchor="middle" fontFamily={FONT_TITLE} fontWeight={900} fontSize={size} fill={fill} stroke={PALETTE.ink} strokeWidth={size * 0.09} paintOrder="stroke" strokeLinejoin="round">{text}</text>
      </g>
    </svg>
  );
};

/** Líneas de velocidad radiales (whip-zoom, impactos). */
export const SpeedLines: React.FC<{
  opacity: number; innerR?: number; count?: number; cx?: number; cy?: number; color?: string;
}> = ({ opacity, innerR = 260, count = 70, cx = CX, cy = CY, color = PALETTE.ink }) => {
  const abs = useAbsFrame();
  const flick = Math.floor(abs / 3) % 3;
  if (opacity <= 0) return null;
  const R = 1800;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + (rand(i, flick) - 0.5) * 0.06;
        const w = 0.004 + rand(i, flick + 5) * 0.014;
        const r0 = innerR * (0.9 + rand(i, flick + 9) * 0.5);
        const p = (ang: number, r: number) => `${cx + Math.cos(ang) * r},${cy + Math.sin(ang) * r}`;
        return <polygon key={i} points={`${p(a - w, R)} ${p(a + w, R)} ${p(a, r0)}`} fill={color} />;
      })}
    </svg>
  );
};

/** Destello de 4 puntas (vector) + sprite star_01 del catálogo VFX. x,y = centro (px locales). p: 0..1. */
export const Glint: React.FC<{ x: number; y: number; size: number; p: number; color?: string }> = ({
  x, y, size, p, color = PALETTE.gold,
}) => {
  const s = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);
  if (s <= 0.01) return null;
  const rot = p * 70;
  return (
    <>
      <svg width={size} height={size} viewBox="-1.1 -1.1 2.2 2.2" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity: s, transform: `rotate(${rot}deg) scale(${0.4 + 0.8 * s})`, overflow: "visible" }}>
        <path d="M0 -1 C0.12 -0.12 0.12 -0.12 1 0 C0.12 0.12 0.12 0.12 0 1 C-0.12 0.12 -0.12 0.12 -1 0 C-0.12 -0.12 -0.12 -0.12 0 -1 Z" fill="#FFFDF2" stroke={color} strokeWidth={0.06} />
      </svg>
      <Img src={staticFile(VFX.star01)} style={{ position: "absolute", left: x - size * 0.8, top: y - size * 0.8, width: size * 1.6, height: size * 1.6, opacity: s * 0.9, mixBlendMode: "screen", transform: `rotate(${-rot}deg)` }} />
    </>
  );
};

/** Ráfaga de sprites VFX (estrellas, luces, chispas). Coordenadas = las del padre posicionado. */
export const SpriteBurst: React.FC<{
  f: number; start: number; x: number; y: number; src: string;
  count?: number; size?: number; spread?: number; dur?: number; seed?: number;
}> = ({ f, start, x, y, src, count = 10, size = 90, spread = 260, dur = 40, seed = 1 }) => {
  const t = f - start;
  if (t < 0 || t > dur) return null;
  const p = t / dur;
  const e = Easing.out(Easing.cubic)(p);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = rand(i, seed) * Math.PI * 2;
        const d = spread * (0.3 + rand(i, seed + 1) * 0.7) * e;
        const s = size * (0.5 + rand(i, seed + 2)) * (1 - p * 0.5);
        return (
          <Img key={i} src={staticFile(src)} style={{ position: "absolute", left: x + Math.cos(a) * d - s / 2, top: y + Math.sin(a) * d - s / 2, width: s, height: s, opacity: 1 - p, mixBlendMode: "screen", transform: `rotate(${rand(i, seed + 3) * 360 + p * 90}deg)` }} />
        );
      })}
    </>
  );
};

/** Nube de humo/polvo con los sprites smoke_0X. */
export const SmokePuff: React.FC<{
  f: number; start: number; x: number; y: number; size?: number; idx?: number; dur?: number;
}> = ({ f, start, x, y, size = 380, idx = 0, dur = 70 }) => {
  const t = f - start;
  if (t < 0 || t > dur) return null;
  const p = t / dur;
  const s = size * (0.6 + 0.7 * Easing.out(Easing.cubic)(p));
  return (
    <Img src={staticFile(VFX.smoke[idx % VFX.smoke.length])} style={{ position: "absolute", left: x - s / 2, top: y - s / 2 - p * 80, width: s, height: s, opacity: 0.75 * (1 - p), transform: `rotate(${idx * 70 + p * 25}deg)` }} />
  );
};

/** Ceniza/carboncillo que cae al piso. Coordenadas px del lienzo, frame LOCAL `f`. */
export const CharcoalDebris: React.FC<{
  f: number; t0: number; region: { x: number; y: number; w: number; h: number };
  groundY: number; count?: number; life?: number;
}> = ({ f, t0, region, groundY, count = 90, life = 120 }) => {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x0: region.x + rand(i, 1) * region.w,
        y0: region.y + rand(i, 2) * region.h,
        vx: (rand(i, 3) - 0.5) * 1.2,
        vy: 3 + rand(i, 4) * 4,
        s: 5 + rand(i, 5) * 13,
        delay: rand(i, 6) * 40,
        rot0: rand(i, 7) * 360,
        spin: (rand(i, 8) - 0.5) * 8,
        tone: Math.floor(rand(i, 9) * 4),
        floor: rand(i, 10) * 40,
      })),
    [count, region.x, region.y, region.w, region.h]
  );
  const tones = ["#1F1A17", "#2E2622", "#3D332D", "#574A41"];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {flakes.map((p, i) => {
        const t = f - t0 - p.delay;
        if (t < 0) return null;
        const yRaw = p.y0 + p.vy * t + 0.05 * t * t;
        const settled = yRaw >= groundY;
        const y = settled ? groundY + p.floor : yRaw;
        const x = p.x0 + p.vx * t + Math.sin(t * 0.08 + i) * 8;
        const op = ramp(t, [life, life + 60], [1, 0]) * ramp(t, [0, 6], [0, 1]);
        if (op <= 0) return null;
        const r = settled ? p.rot0 : p.rot0 + p.spin * t;
        const s = p.s;
        return (
          <path key={i} d={`M0 ${-s} L${s * 0.8} ${-s * 0.3} L${s * 0.6} ${s * 0.7} L${-s * 0.5} ${s * 0.8} L${-s * 0.9} 0 Z`} transform={`translate(${x} ${y}) rotate(${r})`} fill={tones[p.tone]} opacity={op} />
        );
      })}
    </svg>
  );
};

/** Anillo rúnico dorado giratorio (planos mágicos). */
export const RuneRing: React.FC<{
  cx: number; cy: number; r: number; rot: number; opacity: number; color?: string;
}> = ({ cx, cy, r, rot, opacity, color = PALETTE.gold }) => {
  const glyphs = [
    "M0 -14 L8 0 L0 14 L-8 0 Z M0 -14 L0 14",
    "M-8 -12 L8 -12 M0 -12 L0 14 M-8 4 L8 4",
    "M-8 12 L0 -12 L8 12 M-5 4 L5 4",
    "M0 -14 C12 -8 12 8 0 14 C-12 8 -12 -8 0 -14 Z M0 -4 L0 4",
  ];
  if (opacity <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <g transform={`translate(${cx} ${cy}) rotate(${rot})`} filter="url(#ink-wobble)" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
        <circle r={r} strokeWidth={4} strokeDasharray="22 12" />
        <circle r={r - 56} strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={glyphs[i % 4]} strokeWidth={4} transform={`rotate(${i * 30}) translate(0 ${-(r - 28)}) scale(1.4)`} />
        ))}
      </g>
    </svg>
  );
};

/** Espada gigante que se dobla. El origen (0,0) es la empuñadura; bend>0 desvía la punta. Rotar desde el wrapper. */
export const BentSword: React.FC<{ length?: number; bend: number }> = ({ length = 520, bend }) => {
  const L = length;
  const tipX = bend * 0.9;
  const tipY = -L + Math.abs(bend) * 0.55;
  const blade = `M 0 -30 Q ${bend * 1.4} ${-L * 0.6} ${tipX} ${tipY}`;
  return (
    <svg width={2 * L} height={2 * L} viewBox={`${-L} ${-L} ${2 * L} ${2 * L}`} style={{ position: "absolute", left: -L, top: -L, overflow: "visible" }}>
      <g filter="url(#ink-wobble)" strokeLinecap="round" fill="none">
        <path d={blade} stroke={PALETTE.ink} strokeWidth={36} />
        <path d={blade} stroke={PALETTE.steel} strokeWidth={24} />
        <path d={blade} stroke="#FFFFFF" strokeWidth={6} transform="translate(-5 0)" opacity={0.8} />
        <path d="M -52 -30 L 52 -30" stroke={PALETTE.ink} strokeWidth={22} />
        <path d="M -52 -30 L 52 -30" stroke={PALETTE.gold} strokeWidth={13} />
        <path d="M 0 -30 L 0 6" stroke={PALETTE.ink} strokeWidth={22} />
        <path d="M 0 -30 L 0 6" stroke="#6B3E22" strokeWidth={13} />
        <circle cx={0} cy={14} r={13} fill={PALETTE.gold} stroke={PALETTE.ink} strokeWidth={5} />
      </g>
    </svg>
  );
};

/** Corona dorada dibujada a mano (para el gag de la corona que cae sobre los ojos). */
export const GoldCrown: React.FC<{ width: number }> = ({ width }) => (
  <svg width={width} height={width * 0.75} viewBox="0 0 240 180" style={{ overflow: "visible" }}>
    <g filter="url(#ink-wobble)" strokeLinejoin="round" stroke={PALETTE.ink} strokeWidth={6}>
      <path d="M 20 150 L 10 50 L 70 100 L 120 20 L 170 100 L 230 50 L 220 150 Z" fill={PALETTE.gold} />
      <path d="M 20 150 L 220 150 L 218 174 L 22 174 Z" fill={PALETTE.goldDeep} />
      <circle cx={10} cy={48} r={11} fill={PALETTE.blood} />
      <circle cx={120} cy={18} r={12} fill={PALETTE.indigo} />
      <circle cx={230} cy={48} r={11} fill={PALETTE.blood} />
      <path d="M 90 120 L 120 80 L 150 120 Z" fill="#FFF3C4" strokeWidth={3} />
    </g>
  </svg>
);

/** Dedo índice que empuja hacia arriba (punta en y=0). */
export const FingerPoke: React.FC<{ width?: number }> = ({ width = 56 }) => (
  <svg width={width} height={width * 4} viewBox="-30 0 60 240" style={{ overflow: "visible" }}>
    <g filter="url(#ink-wobble)" stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round">
      <path d="M 0 0 C -22 0 -26 30 -26 60 L -26 240 L 26 240 L 26 60 C 26 30 22 0 0 0 Z" fill={PALETTE.skin} />
      <path d="M -14 22 C -8 12 8 12 14 22" fill="none" stroke="#C98F66" strokeWidth={3} />
      <path d="M -16 110 L 16 110 M -16 150 L 16 150" stroke="#C98F66" strokeWidth={3} />
    </g>
  </svg>
);

/** Ojeras dibujadas con trazo (se "dibujan" con progress 0..1). cx,cy = centro entre ambos ojos. */
export const EyeBags: React.FC<{ cx: number; cy: number; gap: number; size: number; p: number }> = ({ cx, cy, gap, size, p }) => {
  if (p <= 0) return null;
  const bag = (x: number) => `M ${x - size} ${cy} Q ${x} ${cy + size * 0.75} ${x + size} ${cy}`;
  const bag2 = (x: number) => `M ${x - size * 0.8} ${cy + size * 0.35} Q ${x} ${cy + size * 1.05} ${x + size * 0.8} ${cy + size * 0.35}`;
  return (
    <svg width={cx * 2} height={cy * 2} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g fill="none" stroke="#3A2A5A" strokeWidth={7} strokeLinecap="round" opacity={0.85}>
        {[cx - gap, cx + gap].map((x, i) => (
          <React.Fragment key={i}>
            <path d={bag(x)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            <path d={bag2(x)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeWidth={4} />
          </React.Fragment>
        ))}
      </g>
    </svg>
  );
};

/** Flash de pantalla completa en frame ABSOLUTO (bloom de transición, golpes). Montar en el master. */
export const FlashPulse: React.FC<{ at: number; rise: number; fall: number; color?: string; peak?: number }> = ({
  at, rise, fall, color = "#FFE9A8", peak = 1,
}) => {
  const abs = useAbsFrame();
  const o = interpolate(abs, [at - rise, at, at + fall], [0, peak, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{ backgroundColor: color, opacity: o, pointerEvents: "none" }} />;
};

/** Entrada whip-pan (desliza con desenfoque y skew). Envolver el contenido completo de una escena. */
export const WhipPanIn: React.FC<{ f: number; dur?: number; dir?: 1 | -1; children: React.ReactNode }> = ({
  f, dur = 14, dir = 1, children,
}) => {
  const p = ramp(f, [0, dur], [1, 0], ease.outExpo);
  return (
    <AbsoluteFill style={{ transform: `translateX(${dir * W * p}px) skewX(${dir * -12 * p}deg)`, filter: p > 0.01 ? `blur(${p * 26}px)` : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 7. ESCENA 0 — EL GANCHO ISEKAI: CORONA DE QUIEBRA (abs 0–300)
 * ════════════════════════════════════════════════════════════════════════ */

/** Gag de la corona (SVG) sobre el sprite del estudiante. Coordenadas = px locales de la caja del sprite. */
const CrownGag: React.FC<{ f: number; fps: number; bw: number; bh: number }> = ({ f, fps, bw, bh }) => {
  const T = S0_T;
  const A = ANCHORS.student;
  if (f < T.crownDrop - 1) return null;
  const restY = A.crownY * bh;
  const eyesY = A.eyesY * bh;
  const cx = bw / 2;
  const cw = A.crownW * bw;
  const ch = cw * 0.75;
  const drop = springAt(f, T.crownDrop, fps, SPRING_BOUNCE);
  const lift = ramp(f, [T.crownPoke, T.crownUp], [0, 1], ease.out);
  const settle = ramp(f, [T.crownUp, T.crownUp + 40], [0, 1]);
  const y = f < T.crownPoke ? lerp(restY, eyesY, drop) : lerp(eyesY, restY, lift);
  const rot =
    f < T.crownPoke
      ? lerp(-4, 8, Math.min(1, drop))
      : lerp(8, -9, lift) + Math.sin((f - T.crownUp) * 0.5) * 4 * (1 - settle);
  const sy = f < T.crownPoke ? 1 + (1 - drop) * 0.25 : 1;
  const fingerOn = f >= T.crownPoke - 10 && f <= T.crownUp + 14;
  const jab =
    ramp(f, [T.crownPoke - 10, T.crownPoke], [90, 0], ease.out) +
    ramp(f, [T.crownUp, T.crownUp + 14], [0, 110], ease.in);
  return (
    <>
      <div style={{ position: "absolute", left: cx - cw / 2, top: y - ch / 2, transform: `rotate(${rot}deg) scaleY(${sy})`, transformOrigin: "50% 100%" }}>
        <GoldCrown width={cw} />
      </div>
      {fingerOn && (
        <div style={{ position: "absolute", left: cx + cw * 0.18, top: y + ch / 2 - 8 + jab }}>
          <FingerPoke width={cw * 0.17} />
        </div>
      )}
      <EyeBags cx={cx} cy={eyesY + bh * 0.018} gap={bw * 0.075} size={bw * 0.055} p={ramp(f, [T.eyeBags, T.eyeBags + 24], [0, 1])} />
    </>
  );
};

export const Scene0: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = S0_T;

  // Cámara: giro 360° en picado (f.30–90). La escala 'cover' = |cos|+1.78|sin| garantiza que nunca se vean bordes.
  const spinP = ramp(f, [T.spinStart, T.spinEnd], [0, 1], ease.inOut);
  const rad = spinP * 2 * Math.PI;
  const cover = Math.abs(Math.cos(rad)) + 1.78 * Math.abs(Math.sin(rad));
  const camScale = 1 + (cover - 1) * 1.04;
  const camBlur = 4 * Math.sin(spinP * Math.PI);
  const shakeAmp = f >= T.impact ? Math.exp(-(f - T.impact) / 9) * 16 : 0;
  const shakeX = Math.sin((f - T.impact) * 2.3) * shakeAmp;
  const shakeY = Math.cos((f - T.impact) * 1.9) * shakeAmp * 0.8;

  // Estudiante: caída acelerada (f.30–55) + squash & stretch elástico en el trono
  const fallY = f < T.impact ? ramp(f, [T.fallStart, T.impact], [-2300, 0], Easing.in(Easing.quad)) : 0;
  const sq = landingSquash(f, T.impact, fps);
  const stu = spriteBox("student_on_ruined_throne");

  // Cofre: entra rebotando desde la derecha
  const chestSp = springAt(f, T.chestIn, fps, SPRING_BOUNCE);
  const chestSq = landingSquash(f, T.chestLand, fps, 0.5);
  const chest = spriteBox("open_chest_coin");

  // HUD
  const scrollU = Math.min(1, springAt(f, T.scrollIn, fps, SPRING_SOFT));
  const titleP = springAt(f, T.titleIn, fps, SPRING_SOFT);
  const titleOp = ramp(f, [T.titleOut, T.titleOut + 16], [1, 0]);
  const flashR = ramp(f, [6, T.flashEnd], [0, 160], ease.out);

  return (
    <AbsoluteFill>
      {/* ── Mundo (cámara) ── */}
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) rotate(${spinP * 360}deg) scale(${camScale})`, transformOrigin: "50% 50%", filter: camBlur > 0.3 ? `blur(${camBlur}px)` : undefined }}>
        <ArtSprite asset="scene_00_bg" ink={false} boilAmp={0.6} scale={1.03 - ramp(f, [0, 300], [0, 0.03])} origin="50% 50%" />
        <ArtSprite asset="student_on_ruined_throne" dy={fallY} sx={sq.sx} sy={sq.sy} boilSeed={1} opacity={f < T.fallStart - 1 ? 0 : 1}>
          {ENABLE_CROWN_GAG && <CrownGag f={f} fps={fps} bw={stu.w} bh={stu.h} />}
        </ArtSprite>
        <ArtSprite asset="open_chest_coin" dx={(1 - chestSp) * 720} sx={chestSq.sx} sy={chestSq.sy} boilSeed={2} opacity={f >= T.chestIn ? 1 : 0}>
          <Glint x={ANCHORS.chestCoin.x * chest.w} y={ANCHORS.chestCoin.y * chest.h} size={150} p={ramp(f, [T.coinGlint, T.coinGlint + 30], [0, 1])} />
        </ArtSprite>
        <SmokePuff f={f} start={T.impact} x={330} y={1790} idx={0} />
        <SmokePuff f={f} start={T.impact + 2} x={760} y={1800} idx={2} />
      </AbsoluteFill>

      {/* ── HUD (no gira con la cámara) ── */}
      <div style={{ position: "absolute", left: 110, top: 1130, opacity: ramp(f, [T.scrollIn, T.scrollIn + 6], [0, 1]), transform: "rotate(-3deg)", transformOrigin: "50% 50%" }}>
        <ParchmentScroll
          id="quest"
          unroll={scrollU}
          lines={[
            { t: "MISIÓN:", size: 46, fill: PALETTE.blood },
            { t: "SALVAR UN REINO", size: 52 },
            { t: "EN QUIEBRA", size: 52 },
          ]}
        />
      </div>
      <BrushCaption
        y={110}
        progress={titleP}
        opacity={titleOp}
        lines={[
          cap("¡NO VAYAS A UN ISEKAI", 50),
          { size: 62, parts: [{ t: "SIN SABER " }, { t: "ESTO", fill: PALETTE.gold }] },
          cap("DE POLÍTICA!", 62),
        ]}
      />

      {/* ── Truck-kun beam + flash cegador (f.0–45) ── */}
      {f < T.flashEnd + 12 && (
        <>
          <div style={{ position: "absolute", left: CX - 40 - 160 * ramp(f, [0, 20], [0.3, 1]), width: 80 + 320 * ramp(f, [0, 20], [0.3, 1]), top: -100, height: 1400, opacity: interpolate(f, [0, 4, 30], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,240,190,0.6) 70%, rgba(255,240,190,0))", filter: "blur(18px)" }} />
          <Img src={staticFile(VFX.light01)} style={{ position: "absolute", left: CX - 700, top: 780 - 700, width: 1400, height: 1400, opacity: interpolate(f, [0, 10, T.flashEnd], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), mixBlendMode: "screen", transform: `scale(${ramp(f, [0, T.flashEnd], [0.6, 1.8])})` }} />
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(255,255,255,0) ${Math.max(0, flashR - 25)}%, rgba(255,255,255,0.96) ${flashR}%)`, opacity: f < T.flashEnd ? 1 : ramp(f, [T.flashEnd, T.flashEnd + 12], [1, 0]) }} />
        </>
      )}
      <SpriteBurst f={f} start={40} x={CX} y={900} src={VFX.light02} count={8} size={160} spread={420} dur={40} seed={4} />
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 8. ESCENA 1 — EL ABSOLUTISMO VS. EL HACK MODERNO (abs 300–720)
 * ════════════════════════════════════════════════════════════════════════ */
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = S1_T;

  // ── Cámara: whip-zoom al rostro (f.150–166), rebote al cut y temblor creciente con el riser ──
  const camZoom = f < T.cut ? ramp(f, [T.whipZoom, T.cut], [1, 2.3], Easing.in(Easing.cubic)) : ramp(f, [T.cut, T.cut + 36], [1.45, 1], ease.out);
  const camBlur = f < T.cut ? ramp(f, [T.whipZoom, T.cut], [0, 14]) : ramp(f, [T.cut, T.cut + 14], [14, 0]);
  const shakeAmp = ramp(f, [T.riser, T.bloom], [0, 7]);
  const shakeX = Math.sin(f * 1.7) * shakeAmp;
  const shakeY = Math.cos(f * 2.3) * shakeAmp;

  // ── Noble ──
  const noble = spriteBox("crumbling_noble");
  const nobleSp = springAt(f, T.nobleIn, fps, SPRING_SOFT);
  const lunge =
    f < T.swordStrike ? 0
    : f < T.impactBend ? ramp(f, [T.swordStrike, T.impactBend], [0, -70], Easing.in(Easing.quad))
    : ramp(f, [T.impactBend, T.impactBend + 14], [-70, -10], ease.out);
  const nobleDx = (1 - nobleSp) * 760 + lunge;
  const nobleTilt = ramp(f, [T.swordRaise, T.swordStrike], [0, -3]);
  const dis = ramp(f, [T.dissolveStart, T.dissolveEnd], [0, 1], Easing.inOut(Easing.quad));
  const nobleVisible = f < T.dissolveEnd + 4;

  // ── Espada: se alza (36–72), golpea (72–80), se dobla (80+), cae y desaparece ──
  const handX = noble.left + ANCHORS.noble.handX * noble.w + nobleDx;
  const handY = noble.top + ANCHORS.noble.handY * noble.h;
  const swordAngle =
    f < T.swordStrike ? ramp(f, [T.swordRaise, T.swordStrike], [55, -6], ease.out)
    : f < T.impactBend ? ramp(f, [T.swordStrike, T.impactBend], [-6, -100], Easing.in(Easing.quad))
    : -100 - ramp(f, [92, 130], [0, 70], ease.in);
  const bend = springAt(f, T.impactBend, fps, { damping: 9, stiffness: 160 }) * 150;
  const swordFall = f < 92 ? 0 : Math.pow((f - 92) * 0.35, 2) * 6;
  const swordOp = ramp(f, [T.swordRaise - 6, T.swordRaise], [0, 1]) * ramp(f, [118, 140], [1, 0]);

  // ── MC en primer plano ──
  const mcSq = landingSquash(f, T.cut, fps, 0.35);
  const mcBreath = 1 + 0.012 * Math.sin((f - T.cut) / 22);
  const shrink = springAt(f, T.mcShrink, fps, SPRING_SOFT);
  const mc = spriteBox("mc_close_smug");
  const glintP = ramp(f, [T.eyeGlint, T.eyeGlint + 34], [0, 1]);
  const eyeGlow = Math.sin(Math.min(1, Math.max(0, glintP)) * Math.PI);

  // ── Planos mágicos ──
  const bp = springAt(f, T.blueprints, fps, SPRING_SOFT);
  const bpOp = ramp(f, [T.blueprints, T.blueprints + 10], [0, 1]);
  const bpPush = ramp(f, [T.bloom - 20, T.bloom], [1, 1.35], Easing.in(Easing.cubic));
  const bpScale = lerp(0.15, 1.9, bp) * bpPush;
  const bpRot = lerp(-25, 4, bp) + Math.max(0, f - T.blueprints) * 0.03;

  // ── Capas de efectos ──
  const speedOp = f < T.cut ? ramp(f, [T.whipZoom, T.whipZoom + 8], [0, 0.9]) : ramp(f, [T.cut, T.cut + 16], [0.9, 0]);
  const creamOp = interpolate(f, [T.cut - 2, T.cut, T.cut + 6], [0, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <WhipPanIn f={f} dur={14} dir={1}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${camZoom})`, transformOrigin: f < T.cut ? "18% 42%" : "50% 40%", filter: camBlur > 0.3 ? `blur(${camBlur}px)` : undefined }}>
        <ArtSprite asset="scene_01_bg" ink={false} boilAmp={0.6} scale={1.03 + f * 0.00012} origin="50% 50%" />

        {/* Aro rúnico + planos mágicos (detrás de los personajes) */}
        <RuneRing cx={CX} cy={700} r={520} rot={f * 0.4} opacity={bpOp * 0.85} />
        {f >= T.blueprints && (
          <>
            <ArtSprite asset="magical_blueprints" dy={-260} scale={bpScale * 0.78} rot={-bpRot - 12} opacity={bpOp * 0.45} origin="50% 50%" boilSeed={5} ink={false} />
            <ArtSprite asset="magical_blueprints" dy={-260} scale={bpScale * 1.25} rot={bpRot + 14} opacity={bpOp * 0.3} origin="50% 50%" boilSeed={6} ink={false} />
            <ArtSprite asset="magical_blueprints" dy={-260} scale={bpScale} rot={bpRot} opacity={bpOp} origin="50% 50%" boilSeed={4} />
          </>
        )}

        {/* Noble: se desmorona como carbón */}
        {f >= T.nobleIn && nobleVisible && (
          <>
            {dis > 0 && <DissolveDefs id="dissolve-noble" progress={dis} seed={7} />}
            <AbsoluteFill style={{ filter: dis > 0 ? "url(#dissolve-noble)" : undefined }}>
              <ArtSprite asset="crumbling_noble" dx={nobleDx} rot={nobleTilt} boilSeed={3} extraFilter={`grayscale(${dis}) brightness(${1 - 0.5 * dis}) contrast(${1 + 0.3 * dis})`} />
            </AbsoluteFill>
            <div style={{ position: "absolute", left: handX, top: handY + swordFall, width: 0, height: 0, transform: `rotate(${swordAngle}deg)`, opacity: swordOp }}>
              <BentSword length={520} bend={bend} />
            </div>
          </>
        )}
        <CharcoalDebris f={f} t0={T.dissolveStart} region={{ x: noble.left + 40, y: noble.top + 60, w: noble.w - 80, h: noble.h - 120 }} groundY={noble.top + noble.h - 30} />
        <Onomatopoeia text="¡CLANG!" x={340} y={620} f={f} start={T.impactBend} fps={fps} size={170} rot={-8} />

        {/* MC primer plano */}
        {f >= T.cut && (
          <ArtSprite asset="mc_close_smug" sx={mcSq.sx} sy={mcSq.sy} scale={lerp(1, 0.84, shrink) * mcBreath} dy={shrink * 90} boilSeed={7}>
            {/* Ojos ambarinos: resplandor + destello vectorial + estrellas */}
            {[ANCHORS.mcClose.eyeL, ANCHORS.mcClose.eyeR].map((e, i) => (
              <div key={i} style={{ position: "absolute", left: e.x * mc.w - 110, top: e.y * mc.h - 110, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,196,60,0.95), rgba(255,160,20,0) 70%)", opacity: eyeGlow * 0.9, mixBlendMode: "screen" }} />
            ))}
            <Glint x={ANCHORS.mcClose.eyeL.x * mc.w} y={ANCHORS.mcClose.eyeL.y * mc.h} size={200} p={glintP} />
            <Glint x={ANCHORS.mcClose.eyeR.x * mc.w} y={ANCHORS.mcClose.eyeR.y * mc.h} size={200} p={ramp(f, [T.eyeGlint + 6, T.eyeGlint + 40], [0, 1])} />
            <SpriteBurst f={f} start={T.eyeGlint} x={mc.w / 2} y={ANCHORS.mcClose.eyeL.y * mc.h} src={VFX.star01} count={12} size={110} spread={420} dur={45} seed={2} />
          </ArtSprite>
        )}
        {f >= T.blueprints && (
          <ArtSprite asset="magical_blueprints" dy={-260} scale={bpScale * 1.1} rot={bpRot * -0.5} opacity={bpOp * 0.3} origin="50% 50%" blend="screen" boilSeed={8} ink={false} />
        )}
      </AbsoluteFill>

      {/* ── HUD / FX (no afectados por el zoom) ── */}
      <SpeedLines opacity={speedOp} innerR={f < T.cut ? 300 : 380} />
      <AbsoluteFill style={{ backgroundColor: "#FFF4D6", opacity: creamOp, pointerEvents: "none" }} />
      <BrushCaption y={120} progress={ramp(f, [10, 24], [0, 1])} opacity={ramp(f, [138, 150], [1, 0])} lines={[cap("¿UN REY CON", 58), cap("TODO EL PODER?", 66, PALETTE.gold)]} />
      <BrushCaption y={120} rot={1.2} progress={ramp(f, [172, 186], [0, 1])} opacity={ramp(f, [240, 252], [1, 0])} lines={[cap("EL HACK:", 58), cap("¡REPARTIR EL PODER!", 56, PALETTE.gold)]} />
      <BrushCaption y={120} progress={ramp(f, [262, 276], [0, 1])} lines={[cap("ESTADO MODERNO", 62), cap("= PODER DIVIDIDO", 56, PALETTE.gold)]} />
    </WhipPanIn>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 8b. COMPONENTES NUEVOS (entrega 2)
 * ════════════════════════════════════════════════════════════════════════ */
export const RUNE_GLYPHS = [
  "M0 -14 L8 0 L0 14 L-8 0 Z M0 -14 L0 14",
  "M-8 -12 L8 -12 M0 -12 L0 14 M-8 4 L8 4",
  "M-8 12 L0 -12 L8 12 M-5 4 L5 4",
  "M0 -14 C12 -8 12 8 0 14 C-12 8 -12 -8 0 -14 Z M0 -4 L0 4",
];

/** Color de cada Piedra/Bloque: 1 Legislativo = azul, 2 Ejecutivo = dorada, 3 Judicial = blanca. */
export const BLOCK_COLORS = { legislative: "#3A6FD8", executive: PALETTE.gold, judicial: "#F4F1E8" } as const;

export type CamKey = { f: number; fx: number; fy: number; s: number };

/**
 * Cámara de enfoque: interpola (ease in-out) entre keys {f, punto focal, zoom} y mantiene la vista dentro del lienzo.
 * Aplicar con: transformOrigin "0 0", transform `translate(${tx}px, ${ty}px) scale(${s})`.
 */
export const camAt = (f: number, keys: ReadonlyArray<CamKey>) => {
  let a = keys[0];
  let b = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (f >= keys[i].f) {
      a = keys[i];
      b = keys[Math.min(i + 1, keys.length - 1)];
    }
  }
  const t = b.f === a.f ? 0 : ease.inOut(Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f))));
  const s = lerp(a.s, b.s, t);
  const fx = Math.min(W - CX / s, Math.max(CX / s, lerp(a.fx, b.fx, t)));
  const fy = Math.min(H - CY / s, Math.max(CY / s, lerp(a.fy, b.fy, t)));
  return { s, tx: CX - fx * s, ty: CY - fy * s };
};

/** Piedra rúnica facetada con brillo. */
export const RuneStone: React.FC<{ color: string; size: number; glyph?: number; glow?: number }> = ({
  color, size, glyph = 0, glow = 1,
}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible", filter: `drop-shadow(0 0 ${14 * glow}px ${color})` }}>
    <g filter="url(#ink-wobble)" strokeLinejoin="round">
      <polygon points="0,-46 38,-22 38,22 0,46 -38,22 -38,-22" fill={color} stroke={PALETTE.ink} strokeWidth={5} />
      <polygon points="0,-46 38,-22 0,0 -38,-22" fill="#FFFFFF" opacity={0.35} />
      <path d={RUNE_GLYPHS[glyph % 4]} transform="scale(1.6)" fill="none" stroke={PALETTE.ink} strokeWidth={3.2} strokeLinecap="round" />
    </g>
  </svg>
);

/** Sello de lacre (stamp: 0..1+). */
export const WaxSeal: React.FC<{ size: number; color?: string }> = ({ size, color = PALETTE.blood }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible" }}>
    <g filter="url(#ink-wobble)" strokeLinejoin="round">
      <path d="M 0 -44 C 20 -50 40 -34 44 -12 C 50 10 38 36 14 44 C -8 50 -36 42 -44 18 C -52 -6 -40 -38 0 -44 Z" fill={color} stroke={PALETTE.ink} strokeWidth={5} />
      <circle r={30} fill="none" stroke={PALETTE.ink} strokeWidth={3} opacity={0.7} />
      <path d="M0 -22 L6 -7 L22 -7 L9 3 L14 19 L0 10 L-14 19 L-9 3 L-22 -7 L-6 -7 Z" fill={PALETTE.gold} stroke={PALETTE.ink} strokeWidth={3} />
    </g>
  </svg>
);

/** Lluvia de monedas (física simple). Coordenadas px del lienzo, frame LOCAL. */
export const CoinShower: React.FC<{ f: number; start: number; x: number; y: number; count?: number; dur?: number }> = ({
  f, start, x, y, count = 18, dur = 90,
}) => {
  const t = f - start;
  if (t < 0 || t > dur) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const a = -Math.PI * (0.15 + 0.7 * rand(i, 21));
        const v = 14 + rand(i, 22) * 10;
        const px = x + Math.cos(a) * v * t * 0.8;
        const py = y + Math.sin(a) * v * t + 0.5 * 0.55 * t * t;
        const ry = 20 * Math.abs(Math.cos(t * 0.3 + i));
        return (
          <g key={i} transform={`translate(${px} ${py})`} opacity={ramp(t, [dur - 20, dur], [1, 0])}>
            <ellipse rx={20} ry={Math.max(3, ry)} fill={PALETTE.gold} stroke={PALETTE.ink} strokeWidth={3} />
            <ellipse rx={11} ry={Math.max(2, ry * 0.55)} fill="none" stroke={PALETTE.goldDeep} strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

/** Onda de choque circular (tamaño acotado a maxR). */
export const ShockRing: React.FC<{
  f: number; start: number; x: number; y: number; maxR?: number; dur?: number; color?: string; width?: number;
}> = ({ f, start, x, y, maxR = 500, dur = 30, color = PALETTE.gold, width = 14 }) => {
  const t = f - start;
  if (t < 0 || t > dur) return null;
  const p = t / dur;
  const r = maxR * ease.out(p);
  const box = (maxR + width) * 2;
  return (
    <svg width={box} height={box} style={{ position: "absolute", left: x - box / 2, top: y - box / 2, pointerEvents: "none", overflow: "visible" }}>
      <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke={color} strokeWidth={width * (1 - p)} opacity={1 - p} />
    </svg>
  );
};

/** Garabatos rúnicos que se "escriben" solos (progress 0..1). */
export const RuneScribble: React.FC<{
  x: number; y: number; w: number; h: number; p: number; color: string; lines?: number;
}> = ({ x, y, w, h, p, color, lines = 6 }) => {
  if (p <= 0) return null;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: x, top: y, overflow: "visible", pointerEvents: "none" }}>
      {Array.from({ length: lines }, (_, i) => {
        const yy = ((i + 0.5) * h) / lines;
        const steps = 26;
        const d = Array.from({ length: steps + 1 }, (_, k) =>
          `${k === 0 ? "M" : "L"} ${(k / steps) * w * (0.7 + 0.3 * rand(i, 1))} ${yy + Math.sin(k * 1.3 + i * 2) * (5 + rand(k, i) * 7)}`
        ).join(" ");
        const lp = Math.min(1, Math.max(0, p * lines - i));
        return (
          <path key={i} d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lp} opacity={0.9} />
        );
      })}
    </svg>
  );
};

export const BADGE_COLORS = {
  gold: "#E2B13C", emerald: "#2E8B6A", steel: "#9AA6B8", stone: "#8B8478", neutral: "#EADFC4",
} as const;
export type BadgeTone = keyof typeof BADGE_COLORS;

/** Insignia circular de ministerio. pop: spring de entrada; lit: encendido por misión; pulse: pulso dorado global. */
export const InsigniaBadge: React.FC<{
  x: number; y: number; size: number; tone: BadgeTone; pop: number; lit: number; pulse: number; glyph: number;
}> = ({ x, y, size, tone, pop, lit, pulse, glyph }) => {
  const col = BADGE_COLORS[tone];
  const glow = Math.max(lit, pulse);
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, transform: `scale(${pop}) rotate(${(1 - Math.min(1, pop)) * -90}deg)`, filter: glow > 0.01 ? `drop-shadow(0 0 ${18 * glow}px ${pulse > lit ? PALETTE.gold : col})` : undefined }}>
      <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible" }}>
        <g filter="url(#ink-wobble)">
          <circle r={46} fill="#CDBF9E" />
          <circle r={46} fill={col} opacity={lit} />
          <circle r={46} fill={PALETTE.gold} opacity={pulse} />
          <circle r={46} fill="none" stroke={PALETTE.ink} strokeWidth={5} />
          <circle r={34} fill="none" stroke={PALETTE.ink} strokeWidth={3} strokeDasharray="6 5" opacity={0.8} />
          <path d={RUNE_GLYPHS[glyph % 4]} transform="scale(1.4)" fill="none" stroke={PALETTE.ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
};

/** Gafas reflectivas con barrido de brillo (sweep 0..1). cx,cy = centro entre lentes (px locales del sprite). */
export const ShiningGlasses: React.FC<{
  cx: number; cy: number; gap: number; lensW: number; lensH: number; sweep: number; dy?: number; rot?: number;
}> = ({ cx, cy, gap, lensW, lensH, sweep, dy = 0, rot = 0 }) => {
  const w = 2 * (gap + lensW);
  const h = 2 * lensH;
  const l = { x: lensW, y: lensH };
  const r = { x: lensW + 2 * gap, y: lensH };
  const bandX = lerp(-lensW, w + lensW, sweep);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: cx - gap - lensW, top: cy - lensH, overflow: "visible", transform: `translateY(${dy}px) rotate(${rot}deg)`, transformOrigin: "50% 50%" }}>
      <defs>
        <clipPath id="glasses-clip">
          <ellipse cx={l.x} cy={l.y} rx={lensW} ry={lensH} />
          <ellipse cx={r.x} cy={r.y} rx={lensW} ry={lensH} />
        </clipPath>
      </defs>
      <g filter="url(#ink-wobble)">
        <ellipse cx={l.x} cy={l.y} rx={lensW} ry={lensH} fill="rgba(255,214,120,0.28)" stroke={PALETTE.ink} strokeWidth={8} />
        <ellipse cx={l.x} cy={l.y} rx={lensW} ry={lensH} fill="rgba(255,214,120,0.28)" stroke={PALETTE.ink} strokeWidth={8} />
        <path d={`M ${l.x + lensW} ${l.y - 6} Q ${w / 2} ${l.y - lensH * 0.5} ${r.x - lensW} ${r.y - 6}`} fill="none" stroke={PALETTE.ink} strokeWidth={7} />
        <path d={`M ${l.x - lensW} ${l.y - 4} L ${-gap * 0.4} ${l.y - lensH * 0.4} M ${r.x + lensW} ${r.y - 4} L ${w + gap * 0.4} ${r.y - lensH * 0.4}`} fill="none" stroke={PALETTE.ink} strokeWidth={7} strokeLinecap="round" />
        {sweep > 0 && sweep < 1 && (
          <g clipPath="url(#glasses-clip)">
            <rect x={bandX - lensW * 0.25} y={-lensH} width={lensW * 0.5} height={h * 2} fill="#FFFFFF" opacity={0.85} transform={`rotate(25 ${bandX} ${lensH})`} />
          </g>
        )}
      </g>
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 8c. ESCENA 2 — LOS 3 BLOQUES AUTÓNOMOS (abs 720–1860)
 *     Layout fijo en el lienzo: Legislativo arriba-izq · Ejecutivo arriba-der · Judicial abajo.
 *     Una cámara de enfoque (camAt) viaja entre los tres bloques.
 * ════════════════════════════════════════════════════════════════════════ */
export const S2_CAM: ReadonlyArray<CamKey> = [
  { f: 0, fx: 540, fy: 960, s: 1 },
  { f: 120, fx: 540, fy: 960, s: 1 },
  { f: 165, fx: 320, fy: 600, s: 1.7 },   // Legislativo
  { f: 440, fx: 320, fy: 640, s: 1.6 },
  { f: 490, fx: 760, fy: 600, s: 1.7 },   // Ejecutivo
  { f: 765, fx: 760, fy: 640, s: 1.6 },
  { f: 820, fx: 540, fy: 1400, s: 1.35 }, // Judicial (paneo vertical; fy se limita solo)
  { f: 1010, fx: 540, fy: 1400, s: 1.3 },
  { f: 1090, fx: 540, fy: 960, s: 1 },    // vista general
  { f: 1154, fx: 540, fy: 960, s: 1 },
];

const STONE_ORBIT = { cx: 540, cy: 760, r: 300, angles: [150, 30, -90] } as const; // azul, dorada, blanca
const stoneColors = [BLOCK_COLORS.legislative, BLOCK_COLORS.executive, BLOCK_COLORS.judicial];

const stoneOrbitPos = (i: number, f: number, fps: number) => {
  const a = ((STONE_ORBIT.angles[i] + (f - S2_T.stonesOut) * 0.35) * Math.PI) / 180;
  const target = { x: STONE_ORBIT.cx + STONE_ORBIT.r * Math.cos(a), y: STONE_ORBIT.cy + STONE_ORBIT.r * Math.sin(a) };
  const spawn = { x: 540 + (i - 1) * 190, y: 660 };
  const k = springAt(f, S2_T.stonesOut + i * 3, fps, SPRING_BOUNCE);
  return { x: lerp(spawn.x, target.x, k), y: lerp(spawn.y, target.y, k) };
};

export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = S2_T;

  // Cámara + desenfoque por velocidad + temblor del mazo
  const cam = camAt(f, S2_CAM);
  const cam1 = camAt(f + 1, S2_CAM);
  const camBlur = Math.min(10, (Math.hypot(cam1.tx - cam.tx, cam1.ty - cam.ty) + Math.abs(cam1.s - cam.s) * 800) * 0.4);
  const hit = f - T.thud;
  const shakeAmp = hit >= 0 ? Math.exp(-hit / 9) * 20 : 0;
  const shakeX = Math.sin(hit * 2.1) * shakeAmp;
  const shakeY = Math.cos(hit * 1.7) * shakeAmp;

  // Corona tiránica -> 3 piedras
  const crownSp = springAt(f, 4, fps, SPRING_BOUNCE);
  const crackP = ramp(f, [T.crownCrack, T.crownSplit], [0, 1]);
  const split = ramp(f, [T.crownSplit, T.crownSplit + 24], [0, 1], ease.out);
  const crownOp = f < T.crownSplit ? Math.min(1, crownSp * 3) : ramp(f, [T.crownSplit + 16, T.crownSplit + 36], [1, 0]);
  const clips = ["inset(0 66.7% 0 0)", "inset(0 33.3% 0 33.3%)", "inset(0 0 0 66.7%)"];
  const fall = f > T.crownSplit + 14 ? Math.pow((f - T.crownSplit - 14) * 0.25, 2) * 20 : 0;
  const stonesOp = ramp(f, [100, 124], [1, 0]);
  const orbit = [0, 1, 2].map((i) => stoneOrbitPos(i, f, fps));
  const asmOp = ramp(f, [T.assemblyIn, T.assemblyIn + 20], [0, 1]) * ramp(f, [128, 160], [1, 0]);

  // Legislativo
  const legIn = springAt(f, T.legislative, fps, SPRING_SOFT);
  const legSq = landingSquash(f, T.legislative + 14, fps, 0.5);
  const chibiSp = springAt(f, T.chibiIn, fps, SPRING_BOUNCE);
  const strain = f >= 200 && f < T.padlock ? ramp(f, [200, 215], [0, 1]) : 0;
  const sealP = springAt(f, T.seal, fps, SPRING_BOUNCE);

  // Ejecutivo
  const exIn = springAt(f, T.execIn, fps, SPRING_SOFT);
  const exSq = landingSquash(f, T.execIn + 14, fps, 0.5);

  // Judicial
  const judSp = springAt(f, T.judIn, fps, SPRING_SOFT);
  const jt = f - T.thud;
  const sway = f < T.thud ? Math.sin((f - T.judIn) * 0.12) * 6 * Math.exp(-(f - T.judIn) / 90) : 0;
  const jump = jt >= 0 ? -70 * Math.exp(-jt / 14) * Math.abs(Math.cos(jt * 0.22)) : 0;
  const judSq = jt >= 0 ? landingSquash(f, T.thud + 14, fps, 0.6) : { sx: 1, sy: 1 };

  // Piedras que vuelven a casa y convergen al centro (puente hacia la Escena 3)
  const homes = [{ x: 307, y: 230 }, { x: 788, y: 230 }, { x: 540, y: 1060 }];
  const conv = ramp(f, [T.converge, T.end - 2], [0, 1], Easing.in(Easing.cubic));
  const homeOp = ramp(f, [T.end - 6, T.end + 10], [1, 0]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${cam.tx + shakeX}px, ${cam.ty + shakeY}px) scale(${cam.s})`, filter: camBlur > 0.4 ? `blur(${camBlur}px)` : undefined }}>
        <ArtSprite asset="scene_02_bg" ink={false} boilAmp={0.6} scale={1.03} origin="50% 50%" />

        {/* 0–140: corona se parte en 3 piedras que orbitan en triángulo */}
        {f < T.crownSplit + 40 && (
          <div style={{ position: "absolute", left: CX - 280, top: 700 - 210, width: 560, height: 420, opacity: crownOp, transform: `scale(${lerp(0.3, 1, crownSp)})` }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: "absolute", inset: 0, clipPath: clips[i], transform: `translate(${(i - 1) * 260 * split}px, ${-100 * split * (i === 1 ? 1.4 : 0.6) + fall}px) rotate(${(i - 1) * 30 * split}deg)` }}>
                <GoldCrown width={560} />
              </div>
            ))}
            {crackP > 0 && f < T.crownSplit + 2 && (
              <svg width={560} height={420} viewBox="0 0 240 180" style={{ position: "absolute", inset: 0 }}>
                {["M 80 0 L 90 30 L 74 60 L 88 95 L 76 130 L 84 180", "M 160 0 L 150 34 L 168 66 L 152 100 L 166 138 L 158 180"].map((d, i) => (
                  <path key={i} d={d} fill="none" stroke={PALETTE.ink} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - crackP} />
                ))}
              </svg>
            )}
          </div>
        )}
        <Onomatopoeia text="¡CRAC!" x={540} y={400} f={f} start={T.crownSplit} fps={fps} size={170} rot={-6} />
        <ShockRing f={f} start={T.crownSplit} x={540} y={700} maxR={420} />
        <SpriteBurst f={f} start={T.stonesOut} x={540} y={700} src={VFX.star01} count={14} size={100} spread={460} dur={45} seed={11} />
        {f >= T.stonesOut && f < 130 && (
          <>
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: stonesOp * 0.7 }}>
              <polygon points={orbit.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={PALETTE.gold} strokeWidth={4} strokeDasharray="16 10" />
            </svg>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ position: "absolute", left: orbit[i].x - 85, top: orbit[i].y - 85, opacity: stonesOp, transform: `scale(${springAt(f, T.stonesOut + i * 3, fps, SPRING_BOUNCE)}) rotate(${(f - T.stonesOut) * 1.5}deg)` }}>
                <RuneStone color={stoneColors[i]} size={170} glyph={i} />
              </div>
            ))}
          </>
        )}
        {asmOp > 0 && (
          <ArtSprite asset="three_powers_runic_assembly" opacity={asmOp} scale={lerp(1.1, 1, ease.out(ramp(f, [T.assemblyIn, T.assemblyIn + 30], [0, 1])))} dy={Math.sin(f * 0.05) * 10} origin="50% 50%" boilSeed={9} />
        )}

        {/* 140–460: PIEDRA 1 — Legislativo */}
        {f >= T.legislative && (
          <ArtSprite asset="table_legislative_grimoire" dy={(1 - legIn) * 260} sx={legSq.sx} sy={legSq.sy} opacity={ramp(f, [T.legislative, T.legislative + 8], [0, 1])} boilSeed={10} />
        )}
        <RuneScribble x={170} y={300} w={280} h={200} p={ramp(f, [T.legislative + 20, T.legislative + 120], [0, 1]) * ramp(f, [T.seal - 6, T.seal], [1, 0])} color={BLOCK_COLORS.legislative} />
        {f >= T.chibiIn && (
          <ArtSprite asset="chibi_mc_padlock" dy={(1 - chibiSp) * 600} rot={Math.sin(f * 0.9) * 5 * strain} sx={1 + Math.sin(f * 0.9 + 1) * 0.04 * strain} boilSeed={11} />
        )}
        <Onomatopoeia text="¡CLIC!" x={513} y={640} f={f} start={T.padlock} fps={fps} size={150} rot={6} fill={PALETTE.steel} />
        <SpriteBurst f={f} start={T.padlock} x={513} y={880} src={VFX.spark[0]} count={9} size={90} spread={240} dur={30} seed={13} />
        {f >= T.seal && (
          <div style={{ position: "absolute", left: 307 - 120, top: 600 - 120, opacity: ramp(f, [T.seal, T.seal + 4], [0, 1]), transform: `rotate(-12deg) scale(${lerp(2.2, 1, Math.min(1.2, sealP))})` }}>
            <WaxSeal size={240} />
          </div>
        )}
        <ShockRing f={f} start={T.seal + 2} x={307} y={600} maxR={360} color={BLOCK_COLORS.legislative} />

        {/* 460–780: PIEDRA 2 — Ejecutivo */}
        {f >= T.execIn && (
          <ArtSprite asset="table_executive_strategy" dx={(1 - exIn) * 500} sx={exSq.sx} sy={exSq.sy} opacity={ramp(f, [T.execIn, T.execIn + 8], [0, 1])} boilSeed={12} />
        )}
        <CoinShower f={f} start={T.table} x={800} y={760} />
        <SpriteBurst f={f} start={T.table} x={800} y={700} src={VFX.light02} count={8} size={140} spread={300} dur={40} seed={17} />
        <Onomatopoeia text="¡CLING!" x={760} y={470} f={f} start={T.table} fps={fps} size={150} rot={7} />

        {/* 780–1040: PIEDRA 3 — Judicial */}
        {f >= T.judIn && (
          <ArtSprite asset="scale_judicial_balance" dy={(1 - judSp) * 700 + jump} rot={sway} sx={judSq.sx} sy={judSq.sy} opacity={ramp(f, [T.judIn, T.judIn + 8], [0, 1])} boilSeed={13} origin="50% 50%" />
        )}
        <ShockRing f={f} start={T.thud} x={540} y={1250} maxR={620} color="#FFFFFF" />
        <Onomatopoeia text="¡TOC!" x={540} y={1130} f={f} start={T.thud} fps={fps} size={200} rot={-5} fill="#FFFFFF" />

        {/* 1040–1140: las 3 piedras vuelven a casa y convergen */}
        {f >= T.pullOut && homeOp > 0 &&
          [0, 1, 2].map((i) => {
            const k = springAt(f, T.pullOut + i * 6, fps, SPRING_BOUNCE);
            const x = lerp(homes[i].x, 540, conv);
            const y = lerp(homes[i].y, 760, conv);
            return (
              <div key={i} style={{ position: "absolute", left: x - 85, top: y - 85, opacity: homeOp, transform: `scale(${k * (1 + conv * 0.6)}) rotate(${(f - T.pullOut) * 2}deg)` }}>
                <RuneStone color={stoneColors[i]} size={170} glyph={i} glow={1 + conv * 2} />
              </div>
            );
          })}
        <SpriteBurst f={f} start={T.end - 10} x={540} y={760} src={VFX.light01} count={6} size={420} spread={160} dur={30} seed={19} />
      </AbsoluteFill>

      {/* ── HUD ── */}
      <SpeedLines opacity={(hit >= 0 ? Math.exp(-hit / 6) : 0) * 0.8} cy={1300} innerR={340} />
      <BrushCaption y={120} progress={ramp(f, [8, 22], [0, 1])} opacity={ramp(f, [118, 134], [1, 0])} lines={[cap("LOS 3 BLOQUES", 62), cap("AUTÓNOMOS", 62, PALETTE.gold)]} />
      <BrushCaption y={1390} progress={ramp(f, [T.legislative + 20, T.legislative + 34], [0, 1])} opacity={ramp(f, [T.padlock - 12, T.padlock - 2], [1, 0])} lines={[cap("PIEDRA 1: LEGISLATIVO", 48), cap("HACE LAS LEYES", 44, PALETTE.gold)]} />
      <BrushCaption y={1390} rot={1.2} progress={ramp(f, [T.padlock + 14, T.padlock + 28], [0, 1])} opacity={ramp(f, [T.seal - 14, T.seal - 2], [1, 0])} lines={[cap("¡NI EL MC PUEDE", 50), cap("CAMBIAR LAS LEYES!", 50, PALETTE.gold)]} />
      <BrushCaption y={1390} progress={ramp(f, [T.execIn + 20, T.execIn + 34], [0, 1])} opacity={ramp(f, [T.table - 10, T.table], [1, 0])} lines={[cap("PIEDRA 2: EJECUTIVO", 48), cap("APLICA LAS LEYES", 44, PALETTE.gold)]} />
      <BrushCaption y={1390} rot={1.2} progress={ramp(f, [T.table + 16, T.table + 30], [0, 1])} opacity={ramp(f, [T.judicial - 16, T.judicial - 4], [1, 0])} lines={[cap("EL MC Y SUS MINISTROS", 46), cap("ADMINISTRAN EL ORO", 46, PALETTE.gold)]} />
      <BrushCaption y={120} progress={ramp(f, [T.judIn + 14, T.judIn + 28], [0, 1])} opacity={ramp(f, [T.thud - 14, T.thud - 2], [1, 0])} lines={[cap("PIEDRA 3: JUDICIAL", 48), cap("JUZGA A TODOS POR IGUAL", 42, PALETTE.gold)]} />
      <BrushCaption y={120} rot={1.2} progress={ramp(f, [T.thud + 14, T.thud + 28], [0, 1])} opacity={ramp(f, [T.pullOut - 10, T.pullOut + 4], [1, 0])} lines={[cap("DUQUE, CAMPESINO Y MC:", 44), cap("¡MISMA LEY PARA TODOS!", 44, PALETTE.gold)]} />
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 8d. ESCENA 3 — LA CUADRILLA DE ESPECIALISTAS: 14 MINISTERIOS EN 4 MISIONES (abs 1860–3060)
 *     14 insignias persistentes en los bordes (HUD): columna izq = Logística + Territorio, der = RR.HH. + Planificación.
 *     ⚠ El prompt nombra 12 ministerios (3 por misión) pero habla de 14: las 2 insignias "neutral" (slot 3 de cada
 *       columna) son las 2 que faltan. Confirmar cuáles son y, si se quiere, etiquetarlas.
 * ════════════════════════════════════════════════════════════════════════ */
const BADGE_TONES_L: BadgeTone[] = ["gold", "gold", "gold", "neutral", "steel", "steel", "steel"];
const BADGE_TONES_R: BadgeTone[] = ["emerald", "emerald", "emerald", "neutral", "stone", "stone", "stone"];
export const BADGES: ReadonlyArray<{ x: number; y: number; tone: BadgeTone; i: number }> = [
  ...BADGE_TONES_L.map((tone, slot) => ({ x: 78, y: 300 + slot * 190, tone, i: slot * 2 })),
  ...BADGE_TONES_R.map((tone, slot) => ({ x: 1002, y: 300 + slot * 190, tone, i: slot * 2 + 1 })),
];

const pulseEnv = (f: number, t0: number) => ramp(f, [t0, t0 + 6], [0, 1]) * ramp(f, [t0 + 6, t0 + 40], [1, 0]);

export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = S3_T;
  const mc = spriteBox("mc_close_smug");

  // MC con gafas reflectivas (0–130)
  const exit = ramp(f, [T.mcExit, T.mcExit + 36], [0, 1], ease.in);
  const adj = ramp(f, [T.glassAdjust, T.glassAdjust + 20], [0, 1], ease.out);
  const jab = ramp(f, [T.glassAdjust - 10, T.glassAdjust], [90, 0], ease.out) + ramp(f, [T.glassAdjust + 20, T.glassAdjust + 34], [0, 110], ease.in);
  const fingerOn = f >= T.glassAdjust - 10 && f <= T.glassAdjust + 34;
  const eyeCx = 0.5 * mc.w;
  const eyeCy = ANCHORS.mcClose.eyeL.y * mc.h;
  const lensH = 0.045 * mc.h;

  // Paneo de scene_03_bg -> scene_04_bg
  const panP = ramp(f, [T.pan, T.pan + 60], [0, 1], ease.inOut);
  const bg3Scale = lerp(1.2, 1.03, ease.out(ramp(f, [60, 130], [0, 1])));

  // Escudos
  const goldSp = springAt(f, T.gold, fps, SPRING_BOUNCE);
  const emSp = springAt(f, T.emerald, fps, SPRING_BOUNCE);
  const out12 = ramp(f, [T.exit12, T.exit12 + 50], [0, 1], ease.in);
  const steelSp = springAt(f, T.steel, fps, SPRING_BOUNCE);
  const stoneSp = springAt(f, T.stone, fps, SPRING_BOUNCE);
  const gSq = landingSquash(f, T.gold + 16, fps, 0.5);
  const eSq = landingSquash(f, T.emerald + 16, fps, 0.5);
  const sSq = landingSquash(f, T.steel + 16, fps, 0.5);
  const tSq = landingSquash(f, T.stone + 16, fps, 0.5);
  const float = (t0: number) => Math.sin((f - t0) * 0.04) * 8;

  // Pulso simultáneo de las 14 insignias
  const pz = (t0: number) => (f >= t0 ? Math.exp(-(f - t0) / 8) : 0);
  const stageScale = 1 + 0.035 * (pz(T.pulse1) + pz(T.pulse2));
  const pulseAmt = Math.max(Math.min(1, pulseEnv(f, T.pulse1) + pulseEnv(f, T.pulse2)), ramp(f, [T.pulse1, T.pulse1 + 10], [0, 0.7]));
  const toneStart: Record<BadgeTone, number> = { gold: T.gold, emerald: T.emerald, steel: T.steel, stone: T.stone, neutral: 99999 };
  const goldWash = Math.max(pulseEnv(f, T.pulse1), pulseEnv(f, T.pulse2)) * 0.22;

  return (
    <WhipPanIn f={f} dur={14} dir={-1}>
      <AbsoluteFill style={{ transform: `scale(${stageScale})`, transformOrigin: "50% 50%" }}>
        <ArtSprite asset="scene_03_bg" ink={false} boilAmp={0.6} scale={bg3Scale} dx={-W * panP} origin="50% 50%" />
        <ArtSprite asset="scene_04_bg" ink={false} boilAmp={0.6} scale={1.03} dx={W * (1 - panP)} origin="50% 50%" boilSeed={3} />

        {/* MC: gafas reflectivas + chasquido */}
        {f < T.mcExit + 40 && (
          <ArtSprite asset="mc_close_smug" dy={exit * 1500} scale={lerp(1, 0.6, exit) * (1 + 0.01 * Math.sin(f / 18))} boilSeed={7}>
            <ShiningGlasses cx={eyeCx} cy={eyeCy} gap={0.13 * mc.w} lensW={0.105 * mc.w} lensH={lensH} sweep={ramp(f, [T.glassSweep, T.glassSweep + 36], [0, 1])} dy={(1 - adj) * 22} rot={(1 - adj) * 3} />
            {fingerOn && (
              <div style={{ position: "absolute", left: eyeCx - mc.w * 0.025, top: eyeCy + lensH * 0.7 + jab }}>
                <FingerPoke width={mc.w * 0.05} />
              </div>
            )}
            <Glint x={eyeCx - 0.13 * mc.w + 0.05 * mc.w} y={eyeCy - lensH * 0.5} size={220} p={ramp(f, [60, 88], [0, 1])} />
          </ArtSprite>
        )}

        {/* Misión 1 (Logística) y 2 (RR.HH.) — scene_03_bg */}
        {f >= T.gold && f < T.exit12 + 55 && (
          <ArtSprite asset="shield_logistics_gold" dx={-(1 - goldSp) * 760 - out12 * 800} dy={float(T.gold)} sx={gSq.sx} sy={gSq.sy} opacity={1 - out12} boilSeed={14} />
        )}
        {f >= T.emerald && f < T.exit12 + 55 && (
          <ArtSprite asset="shield_human_resources_emerald" dx={(1 - emSp) * 760 + out12 * 800} dy={float(T.emerald)} sx={eSq.sx} sy={eSq.sy} opacity={1 - out12} boilSeed={15} />
        )}

        {/* Misión 3 (Territorio) y 4 (Planificación) — scene_04_bg */}
        {f >= T.steel && (
          <ArtSprite asset="shield_territory_steel" dx={-(1 - steelSp) * 760} dy={float(T.steel)} sx={sSq.sx} sy={sSq.sy} boilSeed={16} />
        )}
        {f >= T.stone && (
          <ArtSprite asset="shield_planning_stone" dx={(1 - stoneSp) * 760} dy={float(T.stone)} sx={tSq.sx} sy={tSq.sy} boilSeed={17} />
        )}
      </AbsoluteFill>

      {/* ── HUD: 14 insignias en los bordes ── */}
      {BADGES.map((b) => {
        const start = T.badges + b.i * 3;
        if (f < start) return null;
        const pop = springAt(f, start, fps, SPRING_BOUNCE);
        const lit = ramp(f, [toneStart[b.tone], toneStart[b.tone] + 20], [0, 1]);
        return <InsigniaBadge key={b.i} x={b.x} y={b.y} size={84} tone={b.tone} pop={pop} lit={lit} pulse={pulseAmt} glyph={b.i} />;
      })}
      {BADGES.map((b) => (
        <React.Fragment key={b.i}>
          <ShockRing f={f} start={T.pulse1} x={b.x} y={b.y} maxR={110} dur={30} width={8} />
          <ShockRing f={f} start={T.pulse2} x={b.x} y={b.y} maxR={110} dur={30} width={8} />
        </React.Fragment>
      ))}
      <SpriteBurst f={f} start={T.pulse1} x={CX} y={960} src={VFX.light02} count={10} size={200} spread={480} dur={40} seed={23} />
      <SpriteBurst f={f} start={T.pulse2} x={CX} y={960} src={VFX.star01} count={14} size={130} spread={520} dur={45} seed={29} />
      <AbsoluteFill style={{ backgroundColor: PALETTE.gold, opacity: goldWash, mixBlendMode: "screen", pointerEvents: "none" }} />

      <Onomatopoeia text="¡SNAP!" x={540} y={560} f={f} start={T.snap} fps={fps} size={170} rot={-6} life={45} />

      {/* ── Captions (zona segura: x 60–918, y < 1632) ── */}
      <BrushCaption y={100} progress={ramp(f, [16, 30], [0, 1])} opacity={ramp(f, [108, 120], [1, 0])} lines={[cap("LA CUADRILLA", 58), cap("DE ESPECIALISTAS", 58, PALETTE.gold)]} />
      <BrushCaption y={100} progress={ramp(f, [T.gold + 14, T.gold + 28], [0, 1])} opacity={ramp(f, [T.emerald - 12, T.emerald - 2], [1, 0])} lines={[cap("MISIÓN 1: LOGÍSTICA", 46), cap("Economía, Trabajo, Agricultura", 34, PALETTE.gold)]} />
      <BrushCaption y={100} rot={1.2} progress={ramp(f, [T.emerald + 14, T.emerald + 28], [0, 1])} opacity={ramp(f, [T.exit12, T.exit12 + 14], [1, 0])} lines={[cap("MISIÓN 2: RECURSOS HUMANOS", 40), cap("Salud, Educación,", 32, PALETTE.gold), cap("Desarrollo Social", 32, PALETTE.gold)]} />
      <BrushCaption y={100} progress={ramp(f, [T.steel + 14, T.steel + 28], [0, 1])} opacity={ramp(f, [T.stone - 12, T.stone - 2], [1, 0])} lines={[cap("MISIÓN 3: TERRITORIO", 46), cap("Interior, Defensa,", 32, PALETTE.gold), cap("Relaciones Exteriores", 32, PALETTE.gold)]} />
      <BrushCaption y={100} rot={1.2} progress={ramp(f, [T.stone + 14, T.stone + 28], [0, 1])} opacity={ramp(f, [T.pulse1 - 14, T.pulse1 - 2], [1, 0])} lines={[cap("MISIÓN 4: PLANIFICACIÓN", 44), cap("Transporte, Vivienda, Ambiente", 34, PALETTE.gold)]} />
      <BrushCaption y={100} progress={ramp(f, [T.pulse1 + 5, T.pulse1 + 20], [0, 1])} lines={[cap("14 MINISTERIOS", 62), cap("4 MISIONES", 62, PALETTE.gold)]} />
    </WhipPanIn>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 8e. ESCENA 4 — CLÍMAX Y CIERRE: EL RELOJ DEL REINO + EL REY RELAJADO (abs 3060–3600)
 *     local 0-20   zoom-out; 3 piedras rúnicas + 14 engranajes convergen en espiral y el astrolabio ENCAJA (thud = abs 3080)
 *     local 36-242 captions del reloj · 240 entra el rey al balcón · 300 pergamino "MISIÓN CUMPLIDA"
 *     local 390    3 sorbos (¡SLURP!) · 460 guiño (abs 3520, star_02) · 470 push-in sobre la sonrisa
 *     local 500-539 iris-wipe negro centrado en la sonrisa (se monta en el MASTER, encima del marco)
 * ════════════════════════════════════════════════════════════════════════ */

/** Textos de la escena (derived: el prompt no los daba). Editar aquí; respetan la zona segura x 60–918. */
export const S4_COPY = {
  clock: [cap("¡EL RELOJ DEL REINO!", 50), cap("3 PODERES + 14 MINISTERIOS", 36, PALETTE.gold)],
  gears: [cap("TODO ENCAJA Y GIRA", 50), cap("¡SIN DEPENDER DE UN REY!", 38, PALETTE.gold)],
  finale: [cap("EL REINO FUNCIONA", 54), cap("AUNQUE EL REY SE RELAJE", 40, PALETTE.gold)],
  scroll: [
    { t: "MISIÓN", size: 46, fill: PALETTE.emerald },
    { t: "CUMPLIDA", size: 56 },
    { t: "REINO SALVADO", size: 40 },
  ] as ScrollLine[],
};

/** Punto de pantalla (px) de un ANCHOR del rey, con el sprite en reposo. */
export const kingPoint = (a: { readonly x: number; readonly y: number }) => {
  const b = spriteBox("student_king_balcony_sipping");
  return { x: b.left + a.x * b.w, y: b.top + a.y * b.h };
};

/** Cruces con etiqueta para afinar ANCHORS tras el primer render (solo si DEBUG_ANCHORS). Coordenadas de pantalla. */
export const AnchorDebug: React.FC<{ pts: ReadonlyArray<{ x: number; y: number; label: string }> }> = ({ pts }) => {
  if (!DEBUG_ANCHORS) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={10} fill="none" stroke="#FF2D55" strokeWidth={3} />
          <path d={`M${p.x - 24} ${p.y} H${p.x + 24} M${p.x} ${p.y - 24} V${p.y + 24}`} stroke="#FF2D55" strokeWidth={3} />
          <text x={p.x + 16} y={p.y - 14} fill="#FF2D55" fontSize={26} fontFamily="monospace">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

/** Burbujas de jugo que suben de la pajita. Coordenadas = las del padre posicionado. */
export const JuiceBubbles: React.FC<{ f: number; start: number; x: number; y: number; count?: number }> = ({
  f, start, x, y, count = 7,
}) => (
  <>
    {Array.from({ length: count }, (_, i) => {
      const t = f - (start + i * 5);
      const life = 36;
      if (t < 0 || t > life) return null;
      const p = t / life;
      const r = 9 + rand(i, 3) * 13;
      const bx = x + (rand(i, 4) - 0.5) * 80 + Math.sin(p * 7 + i) * 14;
      const by = y - ease.out(p) * (170 + rand(i, 5) * 90);
      return (
        <svg key={i} width={r * 2 + 8} height={r * 2 + 8} viewBox="-1 -1 2 2" style={{ position: "absolute", left: bx - r - 4, top: by - r - 4, opacity: 1 - p * p, overflow: "visible" }}>
          <circle r={0.82} fill="#F6A93B" stroke={PALETTE.ink} strokeWidth={0.16} />
          <circle cx={-0.3} cy={-0.32} r={0.2} fill="#FFF6DD" />
        </svg>
      );
    })}
  </>
);

/** Párpado del guiño: parche de piel + arco de pestañas. cx,cy = centro del ojo (px locales del sprite), w = ancho del ojo. p: 0 abierto -> 1 cerrado. */
export const WinkLid: React.FC<{ cx: number; cy: number; w: number; p: number }> = ({ cx, cy, w, p }) => {
  if (p <= 0.01) return null;
  const bw = w * 1.7;
  const bh = w * 1.2;
  return (
    <svg width={bw} height={bh} viewBox="-80 -55 160 110" style={{ position: "absolute", left: cx - bw / 2, top: cy - bh / 2, overflow: "visible", pointerEvents: "none" }}>
      <g filter="url(#ink-wobble)" opacity={Math.min(1, p * 1.6)}>
        <ellipse rx={62} ry={38 * p} fill={PALETTE.skin} />
        <path d="M -56 8 Q 0 -34 56 8" fill="none" stroke={PALETTE.ink} strokeWidth={9} strokeLinecap="round" />
      </g>
    </svg>
  );
};

/**
 * Iris-wipe negro. Montar en el MASTER (encima de marco y viñeta) con frames ABSOLUTOS.
 * En `to` el radio es 0 -> pantalla negra pura; con to = 3599 (último frame renderizado) el video termina en negro.
 */
export const IrisWipe: React.FC<{ from: number; to: number; cx: number; cy: number }> = ({ from, to, cx, cy }) => {
  const abs = useAbsFrame();
  if (abs < from) return null;
  const R0 = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 40;
  const r = ramp(abs, [from, to], [R0, 0], ease.inOut);
  if (r <= 0.5) return <AbsoluteFill style={{ backgroundColor: "#000" }} />;
  const d = `M0 0 H${W} V${H} H0 Z M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path d={d} fill="#000" fillRule="evenodd" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={PALETTE.gold} strokeWidth={5} opacity={Math.min(1, r / 80) * 0.85} />
    </svg>
  );
};

/** Engranaje dorado vectorial (pieza del astrolabio). */
export const GearCog: React.FC<{ size: number; rot: number; teeth?: number; color?: string }> = ({
  size, rot, teeth = 10, color = PALETTE.gold,
}) => {
  const da = Math.PI / teeth;
  const pts = Array.from({ length: teeth }, (_, t) =>
    [[0, 0.78], [0.25, 1], [0.75, 1], [1, 0.78]]
      .map(([k, r]) => `${Math.cos(t * 2 * da + da * k) * r},${Math.sin(t * 2 * da + da * k) * r}`)
      .join(" ")
  ).join(" ");
  return (
    <svg width={size} height={size} viewBox="-1.1 -1.1 2.2 2.2" style={{ overflow: "visible", transform: `rotate(${rot}deg)` }}>
      <polygon points={pts} fill={color} stroke={PALETTE.ink} strokeWidth={0.07} strokeLinejoin="round" />
      <circle r={0.34} fill={PALETTE.parchment2} stroke={PALETTE.ink} strokeWidth={0.07} />
      <circle r={0.12} fill={PALETTE.ink} />
    </svg>
  );
};

/**
 * Las 3 piedras rúnicas (azul/dorada/blanca) y los 14 engranajes (uno por ministerio) convergen en espiral hacia el
 * reloj y "encajan" en el frame `land` (= thud). Se desvanecen sobre el astrolabio, que se materializa debajo.
 * Coordenadas de pantalla; `f` = frame LOCAL de la escena.
 */
export const ClockAssembly: React.FC<{ f: number; land: number; cx: number; cy: number; r: number }> = ({ f, land, cx, cy, r }) => {
  const p = ramp(f, [0, land], [0, 1], Easing.in(Easing.cubic));
  const fade = ramp(f, [land, land + 8], [1, 0]);
  if (fade <= 0.01) return null;
  const at = (ang: number, r0: number, r1: number) => {
    const rr = lerp(r0, r1, p);
    const a = ang + (1 - p) * 1.1; // entra en espiral
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
  };
  const stoneCols = [BLOCK_COLORS.legislative, BLOCK_COLORS.executive, BLOCK_COLORS.judicial];
  const gearSize = r * 0.26;
  const stoneSize = r * 0.46;
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const pos = at((i / 14) * Math.PI * 2 + 0.3, 1000, r * 0.78);
        return (
          <div key={`g${i}`} style={{ position: "absolute", left: pos.x - gearSize / 2, top: pos.y - gearSize / 2, opacity: fade }}>
            <GearCog size={gearSize} rot={i * 20 + p * 360 * (i % 2 === 0 ? 1 : -1)} teeth={9 + (i % 3)} />
          </div>
        );
      })}
      {[150, 30, -90].map((deg, j) => {
        const pos = at((deg * Math.PI) / 180, 1150, r * 0.38);
        return (
          <div key={`s${j}`} style={{ position: "absolute", left: pos.x - stoneSize / 2, top: pos.y - stoneSize / 2, opacity: fade, transform: `rotate(${(1 - p) * 220}deg)` }}>
            <RuneStone color={stoneCols[j]} size={stoneSize} glyph={j} />
          </div>
        );
      })}
    </>
  );
};

export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = S4_T;
  const ast = spriteBox("celestial_clockwork_astrolabe");
  const king = spriteBox("student_king_balcony_sipping");
  const AA = ANCHORS.astrolabe;
  const K = ANCHORS.king;
  const astC = { x: ast.left + AA.x * ast.w, y: ast.top + AA.y * ast.h };
  const clockR = AA.r * ast.w;
  const eye = kingPoint(K.eye);
  const mouth = kingPoint(K.mouth);
  const straw = kingPoint(K.straw);
  const eyeW = K.eyeW * king.w;

  // ── Cámara: zoom-out al inicio (origen = reloj) y push-in final (origen = boca, así la sonrisa no se mueve del iris) ──
  const intro = ramp(f, [T.zoomOut, T.thud], [1.9, 1], ease.out);
  const push = ramp(f, [T.push, T.irisEnd - 1], [1, 1.12], ease.inOut);
  const org = f < T.balcony ? astC : mouth; // el cambio ocurre con intro = push = 1: no se nota
  const shakeAmp = f >= T.thud ? Math.exp(-(f - T.thud) / 10) * 18 : 0;
  const shakeX = Math.sin((f - T.thud) * 2.1) * shakeAmp;
  const shakeY = Math.cos((f - T.thud) * 1.7) * shakeAmp * 0.8;
  const camBlur = ramp(f, [T.zoomOut, T.thud], [10, 0]);

  // ── Astrolabio: cae y encaja con squash & stretch ──
  const aFall = ramp(f, [T.zoomOut, T.thud], [-240, 0], Easing.in(Easing.quad));
  const aSq = landingSquash(f, T.thud, fps, 0.18);
  const aOp = ramp(f, [T.thud - 8, T.thud + 2], [0, 1]); // se materializa mientras llegan las piezas
  const aBreath = 1 + 0.005 * Math.sin((f - T.thud) * 0.06) * ramp(f, [T.thud + 20, T.thud + 50], [0, 1]);
  const glowOp = ramp(f, [T.thud, T.thud + 10], [0, 0.9]) * ramp(f, [T.thud + 10, T.thud + 90], [1, 0.35]);
  const ringOp = ramp(f, [T.thud + 10, T.thud + 40], [0, 0.55]) * ramp(f, [T.balcony - 20, T.balcony + 30], [1, 0.25]);

  // ── Rey: entrada, reposo, 3 sorbos, guiño ──
  const kIn = springAt(f, T.balcony, fps, SPRING_SOFT);
  const calm = ramp(f, [T.wink + 10, T.wink + 30], [1, 0]); // deja de mecerse para que la boca quede fija en el iris
  const tk = f - T.balcony;
  const rock = Math.sin(tk * 0.05) * 0.7 * calm;
  const breath = 1 + 0.008 * Math.sin(tk * 0.09) * calm;
  const gulp = (s: number) => ramp(f, [s, s + 4], [0, 1]) * ramp(f, [s + 4, s + 14], [1, 0]);
  const g = Math.max(gulp(T.slurp), gulp(T.slurp + 16), gulp(T.slurp + 32));
  const winkPop = ramp(f, [T.wink, T.wink + 6], [0, 1]) * ramp(f, [T.wink + 6, T.wink + 22], [1, 0]);
  const lid = ramp(f, [T.wink, T.wink + 6], [0, 1]) * ramp(f, [T.wink + 22, T.wink + 30], [1, 0]);

  return (
    <AbsoluteFill>
      {/* ── Mundo (cámara) ── */}
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${intro * push})`, transformOrigin: `${org.x}px ${org.y}px`, filter: camBlur > 0.3 ? `blur(${camBlur}px)` : undefined }}>
        <ArtSprite asset="scene_05_bg" ink={false} boilAmp={0.6} scale={1.05 - ramp(f, [0, T.irisEnd], [0, 0.02])} origin="50% 50%" boilSeed={5} />

        {/* resplandor detrás del reloj */}
        <Img src={staticFile(VFX.light01)} style={{ position: "absolute", left: astC.x - 800, top: astC.y - 800, width: 1600, height: 1600, opacity: glowOp, mixBlendMode: "screen", transform: `scale(${1 + 0.04 * Math.sin((f - T.thud) * 0.07)})` }} />

        {/* Astrolabio (composición a pantalla completa: sin sombra de tinta, por rendimiento y porque es "cielo") */}
        <ArtSprite asset="celestial_clockwork_astrolabe" ink={false} dy={aFall} sx={aSq.sx} sy={aSq.sy} scale={aBreath} opacity={aOp} boilSeed={21} />
        <ClockAssembly f={f} land={T.thud} cx={astC.x} cy={astC.y} r={clockR} />
        <RuneRing cx={astC.x} cy={astC.y} r={clockR} rot={(f - T.thud) * 0.6} opacity={ringOp} />
        <RuneRing cx={astC.x} cy={astC.y} r={clockR * 0.62} rot={-(f - T.thud) * 0.9} opacity={ringOp * 0.8} />

        {/* impacto del encaje */}
        <ShockRing f={f} start={T.thud} x={astC.x} y={astC.y} maxR={620} dur={34} />
        <ShockRing f={f} start={T.thud + 6} x={astC.x} y={astC.y} maxR={880} dur={40} color={PALETTE.parchment} width={8} />
        <SpriteBurst f={f} start={T.thud} x={astC.x} y={astC.y} src={VFX.spark[0]} count={14} size={120} spread={560} dur={40} seed={31} />
        <SpriteBurst f={f} start={T.thud + 2} x={astC.x} y={astC.y} src={VFX.star01} count={10} size={110} spread={640} dur={44} seed={33} />
        <SmokePuff f={f} start={T.thud} x={170} y={1760} idx={1} />
        <SmokePuff f={f} start={T.thud + 3} x={910} y={1770} idx={3} />

        {/* destellos que recorren el reloj mientras gira */}
        {Array.from({ length: 5 }, (_, i) => {
          const t0 = T.thud + 34 + i * 28;
          const a = rand(i, 5) * Math.PI * 2;
          const rr = clockR * (0.55 + rand(i, 6) * 0.5);
          return <Glint key={i} x={astC.x + Math.cos(a) * rr} y={astC.y + Math.sin(a) * rr} size={130} p={ramp(f, [t0, t0 + 26], [0, 1])} />;
        })}

        {/* Rey en el balcón */}
        {f >= T.balcony && (
          <ArtSprite asset="student_king_balcony_sipping" dy={(1 - kIn) * 1100} rot={rock - 2.2 * winkPop} sx={1 + 0.035 * g} sy={(1 - 0.045 * g) * breath} scale={1 + 0.025 * winkPop} boilSeed={22}>
            {WINK_LID && <WinkLid cx={K.eye.x * king.w} cy={K.eye.y * king.h} w={eyeW} p={lid} />}
          </ArtSprite>
        )}
        <JuiceBubbles f={f} start={T.slurp} x={straw.x} y={straw.y} />
        <Glint x={eye.x + eyeW * 1.1} y={eye.y - eyeW * 0.7} size={170} p={ramp(f, [T.wink + 4, T.wink + 36], [0, 1])} />
        <SpriteBurst f={f} start={T.wink + 6} x={eye.x} y={eye.y} src={VFX.star02} count={8} size={110} spread={230} dur={40} seed={41} />

        <AnchorDebug pts={[
          { x: astC.x, y: astC.y, label: "astrolabe" },
          { x: eye.x, y: eye.y, label: "eye" },
          { x: mouth.x, y: mouth.y, label: "mouth (centro del iris)" },
          { x: straw.x, y: straw.y, label: "straw" },
        ]} />
      </AbsoluteFill>

      {/* ── HUD (no se mueve con la cámara) ── */}
      <Onomatopoeia text="¡CLANK!" x={540} y={1120} f={f} start={T.thud} fps={fps} size={160} rot={-6} life={50} />
      <Onomatopoeia text="¡SLURP!" x={400} y={1010} f={f} start={T.slurp} fps={fps} size={140} rot={-9} life={56} />

      <BrushCaption y={100} progress={ramp(f, [T.capClock, T.capClock + 14], [0, 1])} opacity={ramp(f, [T.capGears - 20, T.capGears - 8], [1, 0])} lines={S4_COPY.clock} />
      <BrushCaption y={100} rot={1.2} progress={ramp(f, [T.capGears, T.capGears + 14], [0, 1])} opacity={ramp(f, [T.balcony - 10, T.balcony + 2], [1, 0])} lines={S4_COPY.gears} />
      <BrushCaption y={100} progress={ramp(f, [T.capFinale, T.capFinale + 14], [0, 1])} lines={S4_COPY.finale} />

      {/* Pergamino de cierre: eco del "MISIÓN: SALVAR UN REINO EN QUIEBRA" de la Escena 0 */}
      {f >= T.scroll && (
        <div style={{ position: "absolute", left: 66, top: 1290, opacity: ramp(f, [T.scroll, T.scroll + 6], [0, 1]), transform: "rotate(-3deg)", transformOrigin: "50% 50%" }}>
          <ParchmentScroll id="done" unroll={Math.min(1, springAt(f, T.scroll, fps, SPRING_SOFT))} width={470} lines={S4_COPY.scroll} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
 * 9. MASTER
 * ════════════════════════════════════════════════════════════════════════ */
export const World2D: React.FC = () => {
  const frame = useCurrentFrame();

  // Modulador Line-boil a 20 fps (el master lo usa para jitter global del grano de papel)
  const stepFrame = Math.floor(frame / 3);
  const boilX = Math.sin(stepFrame * 17.3) * 1.5;
  const boilY = Math.cos(stepFrame * 23.7) * 1.5;
  const boilRot = ((stepFrame % 3) - 1) * 0.35;

  const len = (k: keyof typeof SCENES) => SCENES[k].to - SCENES[k].from + SCENE_TAIL;
  const smile = kingPoint(ANCHORS.king.mouth); // centro del iris-wipe final

  return (
    <FrameProvider value={frame}>
      <AbsoluteFill style={{ overflow: "hidden", backgroundColor: THEME.order.parchment }}>
        <InkFilterDefs />

        {/* 1-2. Escenas (fondos limpios + personajes con squash & stretch) */}
        <Sequence from={SCENES.s0.from} durationInFrames={len("s0")}>
          <Scene0 />
        </Sequence>
        <Sequence from={SCENES.s1.from} durationInFrames={len("s1")}>
          <Scene1 />
        </Sequence>

        <Sequence from={SCENES.s2.from} durationInFrames={len("s2")}>
          <Scene2 />
        </Sequence>
        <Sequence from={SCENES.s3.from} durationInFrames={len("s3")}>
          <Scene3 />
        </Sequence>
        <Sequence from={SCENES.s4.from} durationInFrames={len("s4")}>
          <Scene4 />
        </Sequence>

        {/* 3. VFX globales: bloom dorado que enlaza Escena 1 -> Escena 2 (pico en f.720) */}
        <FlashPulse at={SCENES.s2.from} rise={14} fall={22} color="#FFE9A8" />
        {/* Bloom que enlaza Escena 3 -> Escena 4 (pico en f.3060; se apaga ~f.3074 para dejar ver la convergencia de piezas) */}
        <FlashPulse at={SCENES.s4.from} rise={12} fall={14} color="#FFF3C4" peak={0.8} />

        {/* Papel acuarela + viñeta + marco medieval (siempre encima) */}
        <div style={{ position: "absolute", inset: -20, transform: `translate(${boilX * 4}px, ${boilY * 4}px) rotate(${boilRot}deg)`, pointerEvents: "none" }}>
          <PaperGrain />
        </div>
        <InkVignette />
        <MedievalFrame />

        {/* Iris-wipe final: va POR ENCIMA del marco para que el último frame (3599) sea negro puro */}
        <IrisWipe from={SCENES.s4.from + S4_T.irisStart} to={SCENES.s4.to - 1} cx={smile.x} cy={smile.y} />

        {/* 4. SFX táctiles en frames absolutos exactos */}
        <SfxLayer />
      </AbsoluteFill>
    </FrameProvider>
  );
};

export default World2D;
