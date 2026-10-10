import { Composition } from "remotion";
import { Film, FILM_FRAMES, FPS } from "./Film";

export const RemotionRoot = () => (
  <Composition id="Mahalaya" component={Film} durationInFrames={FILM_FRAMES} fps={FPS} width={1920} height={1080} />
);
