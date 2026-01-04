import path from 'node:path';
import { $ART } from '@phosart/common/server';

export const $CACHEDIR = () => path.join($ART(), '..', '..', '.cache', 'bluesky');
export const $CACHEFILE = () => path.join($CACHEDIR(), '.posts.pack.gz');
export const $FILESET = () => path.join($CACHEDIR(), '.imgset2.pack.gz');
export const $SKIPSET = () => path.join($CACHEDIR(), '.skipset.pack.gz');

export const $IMGDIR = () => path.join($CACHEDIR(), 'images');
