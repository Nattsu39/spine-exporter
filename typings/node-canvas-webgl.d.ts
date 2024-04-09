import {
	Canvas as BaseCanvas,
	CanvasRenderingContext2D,
	NodeCanvasRenderingContext2DSettings,
} from "canvas";
import { WebGLRenderingContext, WebGLContextAttributes } from "gl";
import { EventEmitter } from "events";

declare module "node-canvas-webgl" {
	export const createCanvas = (
		width: number,
		height: number,
		type?: "image" | "pdf" | "svg",
	) => Canvas.prototype;

	class NodeCanvasElement<K = any, V = any> extends BaseCanvas {
		readonly clientWidth: number;
		readonly clientHeight: number;
		readonly __ctx__: CanvasRenderingContext2D;
		__event__ = EventEmitter.prototype;
		__attributes__: Map<K, V>;
		style: Map;
		getContext(
			type: "2d",
			contextAttributes?: NodeCanvasRenderingContext2DSettings | undefined,
		): CanvasRenderingContext2D | null;
		getContext(
			type: "webgl" | "webgl2",
			contextAttributes?: WebGLContextAttributes | undefined,
		): WebGLRenderingContext | null;
		addEventListener(
			type: string | symbol,
			listener: (...args: any[]) => void,
		): EventEmitter.prototype;
		removeEventListener(
			type: string | symbol,
			listener: (...args: any[]) => void,
		): EventEmitter.prototype;
		dispatchEvent(event: Event): boolean;
		getAttribute(key: K): V;
		setAttribute(key: K, value: V): void;
		removeAttribute(key): void;
	}

	export const putImageData = (gl: WebGLRenderingContext, canvas: Canvas) =>
		CanvasRenderingContext2D;
	export type Canvas = NodeCanvasElement;
}
