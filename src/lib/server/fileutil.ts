/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from 'node:stream';

export function asNodeStream<R>(web: ReadableStream<R>): Readable {
	return Readable.fromWeb(web as any);
}
export function asWebStream(node: Readable): ReadableStream<any> {
	return Readable.toWeb(node) as any;
}
