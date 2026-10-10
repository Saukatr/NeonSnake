import { Composition } from "remotion";
import { Mahalaya } from "./Mahalaya";
import { FPS, TOTAL_FRAMES } from "./timing";

export const RemotionRoot = () => (
  <Composition id="Mahalaya" component={Mahalaya} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
