import type {FC} from 'react';
import {Composition} from 'remotion';
import {AnchalOverTheWorld} from './scenes/AnchalOverTheWorld';
import {NoSorrowWhereSheStands} from './scenes/NoSorrowWhereSheStands';
import {IAmDurga} from './scenes/IAmDurga';

const fmt = {fps: 30, width: 1080, height: 1920};

export const RemotionRoot: FC = () => (
  <>
    <Composition id="anchal-over-the-world" component={AnchalOverTheWorld} durationInFrames={240} {...fmt} />
    <Composition id="no-sorrow-where-she-stands" component={NoSorrowWhereSheStands} durationInFrames={300} {...fmt} />
    <Composition id="i-am-durga" component={IAmDurga} durationInFrames={240} {...fmt} />
  </>
);
