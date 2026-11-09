import React, { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface WordTiming {
  text: string;
  start: number;
  end: number;
}

interface SceneVo {
  text: string;
  seconds: number;
  words: WordTiming[];
}

interface TimedWord {
  text: string;
  startFrame: number;
  endFrame: number;
  sceneIndex: number;
}

interface PhraseGroup {
  words: TimedWord[];
  startFrame: number;
  endFrame: number;
}

const SCENE_START = [0, 300, 720, 1860, 3060];

// Palabras clave temáticas a resaltar en dorado (#FFD700) o rojo carmesí (#EF233C)
const HIGHLIGHT_WORDS: Record<string, string> = {
  isekai: "#FFD700",
  política: "#FFD700",
  moderna: "#00F5D4",
  corona: "#FFD700",
  reino: "#FFD700",
  fuerza: "#EF233C",
  rebelión: "#EF233C",
  tres: "#FFD700",
  bloques: "#FFD700",
  legislativo: "#3A86FF",
  grimorio: "#3A86FF",
  leyes: "#3A86FF",
  ejecutivo: "#FFB703",
  oro: "#FFD700",
  judicial: "#F4F5F7",
  jueces: "#F4F5F7",
  castigan: "#EF233C",
  delega: "#00F5D4",
  catorce: "#FFD700",
  ministerios: "#FFD700",
  misiones: "#FFD700",
  logístico: "#EAB308",
  economía: "#EAB308",
  trabajo: "#EAB308",
  agricultura: "#EAB308",
  humanos: "#10B981",
  salud: "#10B981",
  educación: "#10B981",
  social: "#10B981",
  territorial: "#64748B",
  policía: "#64748B",
  defensa: "#64748B",
  monstruos: "#EF233C",
  diplomacia: "#64748B",
  planificación: "#A8763E",
  transporte: "#A8763E",
  vivienda: "#A8763E",
  ambiente: "#10B981",
  engranaje: "#FFD700",
  cabeza: "#00F5D4",
};

export const AnimatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let voData: Record<string, SceneVo> | null = null;
  try {
    voData = require("../data/vo.json");
  } catch {
    voData = null;
  }

  const allWords = useMemo<TimedWord[]>(() => {
    if (!voData) return [];
    const list: TimedWord[] = [];
    ["s0", "s1", "s2", "s3", "s4"].forEach((key, sIdx) => {
      const scene = voData?.[key];
      if (!scene?.words) return;
      const baseFrame = SCENE_START[sIdx];
      for (const w of scene.words) {
        list.push({
          text: w.text,
          startFrame: baseFrame + Math.round(w.start * fps),
          endFrame: baseFrame + Math.round(w.end * fps),
          sceneIndex: sIdx,
        });
      }
    });
    return list;
  }, [voData, fps]);

  const groups = useMemo<PhraseGroup[]>(() => {
    const res: PhraseGroup[] = [];
    let current: TimedWord[] = [];

    for (let i = 0; i < allWords.length; i++) {
      current.push(allWords[i]);
      const isPunctuation = /[.,!?;:]$/.test(allWords[i].text);
      const isNextDifferentScene =
        i < allWords.length - 1 &&
        allWords[i + 1].sceneIndex !== allWords[i].sceneIndex;

      if (current.length >= 4 || isPunctuation || isNextDifferentScene) {
        res.push({
          words: current,
          startFrame: current[0].startFrame,
          endFrame: current[current.length - 1].endFrame + 10,
        });
        current = [];
      }
    }
    if (current.length > 0) {
      res.push({
        words: current,
        startFrame: current[0].startFrame,
        endFrame: current[current.length - 1].endFrame + 10,
      });
    }
    return res;
  }, [allWords]);

  const activeGroup = groups.find(
    (g) => frame >= g.startFrame && frame <= g.endFrame
  );

  if (!activeGroup) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 240, // Fuera del 15% inferior (zona segura UI)
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 900,
        padding: "0 60px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px 16px",
          backgroundColor: "rgba(18, 18, 24, 0.78)",
          backdropFilter: "blur(8px)",
          padding: "16px 28px",
          borderRadius: 24,
          border: "2px solid rgba(212, 175, 55, 0.45)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
          maxWidth: 960,
        }}
      >
        {activeGroup.words.map((w, idx) => {
          const isCurrent = frame >= w.startFrame && frame <= w.endFrame;
          const clean = w.text.toLowerCase().replace(/[^a-záéíóúñ]/g, "");
          const highlightColor = HIGHLIGHT_WORDS[clean];

          const wordSpring = spring({
            frame: frame - w.startFrame,
            fps,
            config: { damping: 12, stiffness: 220 },
          });

          return (
            <span
              key={`${w.text}-${idx}`}
              style={{
                fontFamily: '"Cinzel Decorative", "Impact", "Plus Jakarta Sans", sans-serif',
                fontWeight: 900,
                fontSize: 44,
                letterSpacing: "0.02em",
                color: isCurrent
                  ? highlightColor || "#FFD700"
                  : highlightColor
                  ? highlightColor
                  : "#FFFFFF",
                transform: isCurrent ? `scale(${1 + wordSpring * 0.16})` : "scale(1)",
                display: "inline-block",
                textShadow: isCurrent
                  ? "0 0 20px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0,0,0,0.9)"
                  : "0 2px 4px rgba(0,0,0,0.8)",
                transition: "color 0.1s ease",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default AnimatedCaptions;
