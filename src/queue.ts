// Fork from https://stackoverflow.com/questions/38903707/nodejs-create-simple-queue-on-async

import { SpineRenderer } from "./renderer.js";

export class Queue {
	private __queue: Array<any> = [];
	private renderer: SpineRenderer;
	constructor(renderer: SpineRenderer) {
		this.renderer = renderer;
	}

	async enqueue<T>(func: () => T): Promise<T> {
		if (this.renderer.isRendering) {
			await new Promise((resolve) => {
				this.__queue.push(resolve);
			});
		}

		try {
			return await func();
		} catch (err) {
			throw err;
		} finally {
			if (this.__queue.length) {
				this.__queue.shift()();
			}
		}
	}
}
