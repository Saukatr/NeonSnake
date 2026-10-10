import { Composition } from "remotion";
import { Story, STORY_FRAMES, FPS } from "./story";

export const RemotionRoot = () => (
  <Composition id="Mahalaya" component={Story} durationInFrames={STORY_FRAMES} fps={FPS} width={1920} height={1080} />
);
