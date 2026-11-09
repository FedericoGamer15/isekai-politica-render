# PROMPT MAESTRO PARA CLAUDE: IMPLEMENTACIÓN INTEGRAL DE `World2D.tsx`
## Título: "¡No vayas a un Isekai sin saber ESTO de política!" (Estado Moderno Isekai 2D)

> **Instrucciones para Claude:**
> Actúa como **Director de Animación 2D Senior y Desarrollador Frontend Especialista en Remotion (React + TypeScript + Multiplane + SVG Canvas)**. Tu objetivo es programar el componente integral `World2D.tsx` (1080×1920 px, 60 fps, 3600 frames exactos = 60.0 segundos, equivalente a 1440 frames @ 24 fps) para un video vertical ultra dinámico de estética **Hand-drawn 2D Anime / Light Novel Watercolor** (estilo *Studio Ghibli* y *Ranking of Kings* fusionado con el dinamismo y ritmo vertiginoso de cortes cada 1.2s–1.5s estilo *Socks Animations / Aken / Sam Elsewhere*).
>
> **UBICACIÓN DEL ARCHIVO A GENERAR:** `isekai-politica-video/src/components/World2D.tsx`
>
> **¡TODOS LOS ACTIVOS ILUSTRADOS REALES EXTRAÍDOS CON CANVA PRO MCP YA ESTÁN DISPONIBLES EN DISCO EN `public/assets/2d/`!**
> Claude debe consumirlos usando `<Img src={staticFile(ASSETS.<id>.src)} />` combinándolos con sombras de tinta, desenfoque de movimiento en whip-pans, springs elásticos y modulador orgánico de line-boil.

---

### 1. CATÁLOGO MAESTRO DE ACTIVOS EXTRAÍDOS CON CANVA PRO (`public/assets/2d/`)

Incrusta esta constante `CANVA_ASSETS` en `World2D.tsx`. Las coordenadas `(mcX, mcY)` están normalizadas con origen en el centro del lienzo `(540, 960)` donde `mcX ∈ [-540, +540]` y `mcY ∈ [-960, +960]`:

```tsx
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
```

---

### 2. REGLAS ARTÍSTICAS Y TÉCNICAS OBLIGATORIAS (TOLERANCIA CERO)

1. **PROHIBICIÓN ESTRICTA DE POWERPOINT (CERO CAJAS GENÉRICAS Y CERO EMOJIS):**
   - Prohibido crear rectángulos planos tipo tarjeta web con esquinas redondeadas o emojis del sistema (`👑`, `⚖️`, `📜`).
   - Todos los elementos deben renderizarse utilizando los **PNGs ilustrados reales de `CANVA_ASSETS`**, acompañados de viñetas medievales, texturas de pergamino (`#FBF7EE`) y trazados SVG con tinta de acuarela.
2. **LINE-BOIL ORGÁNICO A 20 FPS (HAND-DRAWN JITTER):**
   Para que las ilustraciones respiren como dibujo animado tradicional a mano:
   ```tsx
   const stepFrame = Math.floor(frame / 3);
   const boilX = Math.sin(stepFrame * 17.3) * 1.5;
   const boilY = Math.cos(stepFrame * 23.7) * 1.5;
   const boilRot = ((stepFrame % 3) - 1) * 0.35;
   ```
3. **FÍSICAS CON SQUASH & STRETCH:**
   - Caídas e impactos con `spring({ frame, fps, config: { damping: 11, stiffness: 130 } })`.
   - En aterrizajes: `scaleY: 0.82, scaleX: 1.18`. En aceleraciones o saltos: `scaleY: 1.18, scaleX: 0.88`.
4. **ZONA SEGURA VERTICAL (UI SAFE ZONE):**
   - Mantén los títulos y letreros clave fuera del 15% inferior (Y > 1632px) y del 15% derecho (X > 918px).

---

### 3. CATÁLOGO DE AUDIO SFX Y VFX DISPONIBLES EN `public/assets/`

- **SFX Táctiles Sincronizados (`staticFile("assets/audio/sfx/...")`):**
  - `ui/`: `click1.wav`, `click2.wav`, `click3.wav`, `click4.wav`, `click5.wav`, `switch1.wav`, `switch2.wav`, `switch5.wav`, `switch10.wav`, `mouseclick1.wav`.
  - `whooshes/`: `whoosh_fast.wav`, `whoosh_cinematic.wav`.
  - `impacts/`: `sub_impact_thud.wav`.
  - `glitches/`: `electrical_powerdown.wav`, `radio_static_burst.wav`.
  - `ambience/`: `tension_riser.wav`.
- **Partículas VFX Transparentes (`staticFile("assets/2d/vfx/...")`):**
  - `particles/`: `star_01.png`, `star_02.png`, `light_01.png`, `light_02.png`, `fire_01.png`.
  - `smoke/`: `smoke_01.png` hasta `smoke_05.png`.
  - `sparks/`: `spark_01.png` hasta `spark_04.png`.

---

### 4. CRONOGRAMA TÉCNICO SEGUNDO A SEGUNDO (TOTAL: 3600 FRAMES = 60.0 SEGUNDOS @ 60 FPS)

#### Escena 0: El Gancho Isekai — Corona de Quiebra (Frames `0` – `300` / `00:00 - 00:05`)
- **Fondo:** `CANVA_ASSETS.scene_00_bg.src` (Castillo en ruinas con ventanas en llamas de rebelión).
- **Acción:**
  - `f.0 - 45`: Destello blanco cegador (*Truck-kun beam*) que inunda la pantalla y se disipa radialmente.
  - `f.30 - 90`: La cámara gira 360° en picado mientras el protagonista `CANVA_ASSETS.student_on_ruined_throne.src` cae desde arriba y aterriza de golpe en el trono de piedra tosca con squash & stretch elástico (`sub_impact_thud.wav` en f.55 con `scaleY: 0.8, scaleX: 1.25`).
  - `f.90 - 200`: La corona dorada le cae sobre los ojos; el MC la sube cómicamente con un dedo mostrando sus ojeras.
  - `f.120 - 300`: A la derecha entra con rebote el cofre abierto `CANVA_ASSETS.open_chest_coin.src` mostrando 1 sola moneda de cobre y una telaraña. Emerge el pergamino de quest: *"MISIÓN: SALVAR UN REINO EN QUIEBRA"*.
  - **SFX:** `whoosh_cinematic.wav` (f.10), `sub_impact_thud.wav` (f.55), `ui/click1.wav` (f.140).

#### Escena 1: El Absolutismo vs. El Hack Moderno (Frames `300` – `720` / `00:05 - 00:12`)
- **Fondo:** `CANVA_ASSETS.scene_01_bg.src`.
- **Acción:**
  - `f.300 - 450`: El noble arrogante `CANVA_ASSETS.crumbling_noble.src` alza su espada gigante; al atacar, la espada se dobla y su cuerpo se desmorona en trazos de carboncillo que caen al piso como ceniza (`electrical_powerdown.wav` en f.380).
  - `f.450 - 550`: Whip-zoom al rostro en primer plano del protagonista `CANVA_ASSETS.mc_close_smug.src`. Sus ojos ambarinos despiden un destello de poder (`particles/star_01.png` + `ui/click2.wav`).
  - `f.550 - 720`: De su mente se despliegan en el aire los planos mágicos dorados `CANVA_ASSETS.magical_blueprints.src` con fórmulas de estado moderno que envuelven la pantalla.
  - **SFX:** `whoosh_fast.wav` (f.310), `glitches/electrical_powerdown.wav` (f.380), `ui/click2.wav` (f.480), `ambience/tension_riser.wav` (f.560).

#### Escena 2: Los 3 Bloques Autónomos (Frames `720` – `1860` / `00:12 - 00:31`)
- **Fondo:** `CANVA_ASSETS.scene_02_bg.src` (Pergamino antiguo con trazados rúnicos).
- **Acción:**
  - `f.720 - 860`: El MC parte una corona tiránica en 3 piedras rúnicas (Azul, Dorada, Blanca) que levitan en órbita triangular de equilibrio perfecto (`CANVA_ASSETS.three_powers_runic_assembly.src`).
  - `f.860 - 1180` **Piedra 1 - Legislativo:** Zoom a la mesa redonda `CANVA_ASSETS.table_legislative_grimoire.src` donde diversas razas redactan el gran Grimorio de las Leyes. A su lado, el chibi MC `CANVA_ASSETS.chibi_mc_padlock.src` forcejea con un candado gigante en las manos sin poder alterarlo (`ui/switch2.wav` en f.980).
  - `f.1180 - 1500` **Piedra 2 - Ejecutivo:** El grimorio se cierra sellado; la escena pasa a la mesa de estrategia `CANVA_ASSETS.table_executive_strategy.src` con el MC y ministros administrando mapas y sacos de oro (`ui/click3.wav` en f.1320).
  - `f.1500 - 1860` **Piedra 3 - Judicial:** Paneo vertical a la gran balanza de hierro `CANVA_ASSETS.scale_judicial_balance.src` con la jueza de ojos vendados. El campesino equilibra al Duque y al propio MC; la jueza estampa su mazo haciendo saltar a los tres por igual (`sub_impact_thud.wav` en f.1660).
  - **SFX:** `ui/switch2.wav` (f.980), `ui/click3.wav` (f.1320), `whoosh_fast.wav` (f.1510), `impacts/sub_impact_thud.wav` (f.1660).

#### Escena 3: La Cuadrilla de Especialistas — 14 Ministerios en 4 Misiones (Frames `1860` – `3060` / `00:31 - 00:51`)
- **Fondo:** `CANVA_ASSETS.scene_03_bg.src` y `CANVA_ASSETS.scene_04_bg.src` (Árbol de Habilidades RPG en acuarela).
- **Acción:**
  - `f.1860 - 1980`: El MC se acomoda unas gafas reflectivas brillantes (*shining glasses*) y chasquea los dedos (`ui/switch1.wav`). El árbol se expande desplegando 14 insignias circulares en sus ramas.
  - `f.1980 - 2520` **Misiones 1 y 2 (Logística y Recursos Humanos):**
    - Izquierda: Entra con spring el escudo dorado `CANVA_ASSETS.shield_logistics_gold.src` (o el conjunto `CANVA_ASSETS.shields_logistics_hr.src`) (Economía, Trabajo, Agricultura).
    - Derecha: Entra el escudo verde esmeralda `CANVA_ASSETS.shield_human_resources_emerald.src` (Salud, Educación, Desarrollo Social).
    - SFX: `ui/click1.wav`, `ui/click2.wav`, `ui/switch5.wav`.
  - `f.2520 - 3060` **Misiones 3 y 4 (Blindaje Territorial y Planificación):**
    - Paneo fluido a `CANVA_ASSETS.scene_04_bg.src`.
    - Izquierda: Entra el escudo de acero `CANVA_ASSETS.shield_territory_steel.src` (o el conjunto `CANVA_ASSETS.shields_territory_planning.src`) (Policía/Interior, Defensa en muralla, Diplomacia).
    - Derecha: Entra el escudo de piedra `CANVA_ASSETS.shield_planning_stone.src` (Transporte, Vivienda, Ambiente).
    - Las 14 insignias en los bordes emiten un pulso de luz dorada simultánea (`ui/click4.wav`, `ui/click5.wav`).

#### Escena 4: Clímax y Cierre — El Reloj Astronómico y el Rey Relajado (Frames `3060` – `3600` / `00:51 - 01:00`)
- **Fondo:** `CANVA_ASSETS.scene_05_bg.src` (Reino próspero soleado con chimeneas pacíficas y murallas seguras).
- **Acción:**
  - `f.3060 - 3300`: Gran zoom out. En el cielo, las 3 piedras rúnicas y los 14 engranajes encajan con precisión milimétrica formando el colosal astrolabio/reloj astronómico `CANVA_ASSETS.celestial_clockwork_astrolabe.src` girando suavemente con partículas doradas (`sub_impact_thud.wav` en f.3080).
  - `f.3300 - 3600`: En el balcón real, el protagonista `CANVA_ASSETS.student_king_balcony_sipping.src` aparece recostado en la baranda, bebiendo su jugo con pajita en total serenidad mientras el reino marcha automáticamente a sus espaldas.
  - En el `f.3520`, el MC guiña un ojo a cámara con sonrisa cómplice; un destello de estrella brilla en su pupila (`particles/star_02.png` + `ui/switch1.wav`) mientras un círculo negro (*iris wipe*) se cierra centrado en su sonrisa hasta el frame 3600 exacto.
  - **SFX:** `sub_impact_thud.wav` (f.3080), sorbo de jugo cómico (f.3450), `ui/switch1.wav` (f.3520).

---

### 5. ESQUELETO COMPLETO DE `World2D.tsx` (REMOTION + REACT + TYPESCRIPT)

```tsx
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme";

// [INSERTA AQUÍ LA CONSTANTE CANVA_ASSETS DE LA SECCIÓN 1]

export const World2D: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Modulador Line-boil a 20 fps para dar sensación de dibujo a mano artesanal
  const stepFrame = Math.floor(frame / 3);
  const boilX = Math.sin(stepFrame * 17.3) * 1.5;
  const boilY = Math.cos(stepFrame * 23.7) * 1.5;
  const boilRot = ((stepFrame % 3) - 1) * 0.35;

  // Renderizado condicional y transiciones de las 5 escenas (f.0 a f.3600)
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: THEME.order.parchment }}>
      {/* 1. Capa de Fondos Reconstruidos Limpios (scene_00_bg a scene_05_bg) */}

      {/* 2. Capa Narrativa y Personajes con Squash & Stretch (CANVA_ASSETS) */}

      {/* 3. Capa de Partículas y VFX (Luz, Estrellas, Humo) */}

      {/* 4. Disparadores de Efectos de Sonido Táctiles (Audio tags en frames exactos) */}
    </AbsoluteFill>
  );
};

export default World2D;
```
