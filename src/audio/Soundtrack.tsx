import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

const SCENE_START = [0, 300, 720, 1860, 3060];

export const Soundtrack: React.FC = () => {
  return (
    <>
      {/* 1. Música de fondo: medieval tensa (0-8s) -> RPG Town + Lo-Fi beat (8-60s) */}
      <Audio
        src={staticFile("audio/music.wav")}
        volume={0.22}
      />

      {/* 2. Locución por escenas cronometradas */}
      <Sequence from={SCENE_START[0]} layout="none">
        <Audio src={staticFile("audio/vo/s0.wav")} volume={1.0} />
      </Sequence>
      <Sequence from={SCENE_START[1]} layout="none">
        <Audio src={staticFile("audio/vo/s1.wav")} volume={1.0} />
      </Sequence>
      <Sequence from={SCENE_START[2]} layout="none">
        <Audio src={staticFile("audio/vo/s2.wav")} volume={1.0} />
      </Sequence>
      <Sequence from={SCENE_START[3]} layout="none">
        <Audio src={staticFile("audio/vo/s3.wav")} volume={1.0} />
      </Sequence>
      <Sequence from={SCENE_START[4]} layout="none">
        <Audio src={staticFile("audio/vo/s4.wav")} volume={1.0} />
      </Sequence>
    </>
  );
};

export default Soundtrack;
