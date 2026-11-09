import React from "react";
import { Composition } from "remotion";
import { MainSequence } from "./MainSequence";
import { World2D, SfxLayer } from "./components/World2D";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="IsekaiPolitica"
        component={MainSequence}
        durationInFrames={3600}
        fps={60}
        width={1080}
        height={1920}
      />
      <Composition
        id="World2D"
        component={World2D}
        durationInFrames={3600}
        fps={60}
        width={1080}
        height={1920}
      />
      <Composition
        id="World2DAudio"
        component={SfxLayer}
        durationInFrames={3600}
        fps={60}
        width={100}
        height={100}
      />
    </>
  );
};

export default Root;
