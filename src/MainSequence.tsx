import React from "react";
import { AbsoluteFill } from "remotion";
import { World2D } from "./components/World2D";
import { AnimatedCaptions } from "./components/AnimatedCaptions";
import { Soundtrack } from "./audio/Soundtrack";

export const MainSequence: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FBF7EE" }}>
      {/* Capa Visual 2D (World2D con estética de acuarela, tinta bold, personajes y SFX táctiles) */}
      <World2D />

      {/* Capa de Subtítulos Dinámicos Ilustrados */}
      <AnimatedCaptions />

      {/* Capa de Audio y Locución */}
      <Soundtrack />
    </AbsoluteFill>
  );
};

export default MainSequence;
