import {
	Skeleton,
	Animation,
	AnimationState,
	AnimationStateData,
	AtlasAttachmentLoader,
	SkeletonBinary,
	SkeletonJson,
	Vector2,
	MixBlend,
	MixDirection,
	TextureAtlas,
} from "@node-spine-runtimes/core-3.8.99";
import { NodeCanvasRenderingContext2DSettings } from "canvas";
import { WebGLRenderingContext } from "gl";
import { NodeCanvasElement } from "node-canvas-webgl";
import {
	ManagedWebGLRenderingContext,
	SceneRenderer,
	AssetManager,
	ResizeMode,
	GLTexture,
} from "@node-spine-runtimes/webgl-3.8.99";
import fs from "fs";
import path from "path";
import { Queue } from "./queue.js";
import { sleep, replacePathSpecific, removePathExtension } from "./utils.js";

export interface LoadedResult {
	skeleton: Skeleton;
	state: AnimationState;
}

export interface RenderOptions extends LoadedResult {
	animationName?: string;
	fps: number;
	endPosition?: number;
}

export class TimeKeeper {
	maxDelta = 0.064;
	framesPerSecond = 0;
	delta = 0;
	totalTime = 0;

	lastTime = Date.now() / 1000;
	frameCount = 0;
	frameTime = 0;

	update(delta: number) {
		let now = Date.now() / 1000;
		this.delta = delta;
		this.frameTime += this.delta;
		this.totalTime += this.delta;
		if (this.delta > this.maxDelta) this.delta = this.maxDelta;
		this.lastTime = now;

		this.frameCount++;
		if (this.frameTime > 1) {
			this.framesPerSecond = this.frameCount / this.frameTime;
			this.frameTime = 0;
			this.frameCount = 0;
		}
	}
}

export interface Viewport {
	x: number;
	y: number;
	width: number;
	height: number;
}

function calculateAnimationViewport(animation: Animation, skeleton: Skeleton, fps: number): Viewport {
	skeleton.setToSetupPose();

	let steps = animation.duration ? fps * animation.duration : 1;
	let stepTime = animation.duration ? animation.duration / steps : 0,
		time = 0;
	let minX = 100000000,
		maxX = -100000000,
		minY = 100000000,
		maxY = -100000000;
	let offset = new Vector2(),
		size = new Vector2();

	for (let i = 0; i < steps; i++, time += stepTime) {
		animation.apply(skeleton, time, time, false, [], 1, MixBlend.setup, MixDirection.mixIn);
		skeleton.updateWorldTransform();
		skeleton.getBounds(offset, size);

		if (!isNaN(offset.x) && !isNaN(offset.y) && !isNaN(size.x) && !isNaN(size.y)) {
			minX = Math.min(offset.x, minX);
			maxX = Math.max(offset.x + size.x, maxX);
			minY = Math.min(offset.y, minY);
			maxY = Math.max(offset.y + size.y, maxY);
		} else throw new Error("Animation bounds are invalid: " + animation.name);
	}

	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export async function loadTexture (assetManager: AssetManager, atlasFilePath: string, preMultipliedAlpha: boolean = false) {
	GLTexture.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = preMultipliedAlpha;

	assetManager.loadTextureAtlas(atlasFilePath);
	while (!assetManager.isLoadingComplete()) {
		await sleep(100);
	}
	return assetManager.get(atlasFilePath) as TextureAtlas
};

export class SpineRenderer {
	readonly context: ManagedWebGLRenderingContext;
	/** Tracks the current time, delta, and other time related statistics. */
	/** The HTML canvas to render to. */
	readonly canvas: NodeCanvasElement;
	/** The WebGL rendering context. */
	readonly gl: WebGLRenderingContext;
	/** The asset manager to load assets with. */
	readonly assetManager: AssetManager;
	/** The scene renderer for easy drawing of skeletons, shapes, and images. */
	private readonly renderer: SceneRenderer;
	private readonly renderQueue: Queue = new Queue(this);
	isRendering: boolean = false;

	constructor(canvas: NodeCanvasElement, config?: NodeCanvasRenderingContext2DSettings) {
		this.context = new ManagedWebGLRenderingContext(canvas, config);
		this.canvas = this.context.canvas;
		this.gl = this.context.gl;
		this.renderer = new SceneRenderer(canvas, this.context);
		this.assetManager = new AssetManager(this.context);
	}

	async load(assetPath: AssetPath, scale: number = 1, preMultipliedAlpha: boolean = false): Promise<LoadedResult> {
		const atlas = await loadTexture(this.assetManager, assetPath.atlas, preMultipliedAlpha);
		if (assetPath.loadMode === "skel") {
			this.assetManager.loadBinary(assetPath.skeleton);
		} else {
			this.assetManager.loadText(assetPath.skeleton);
		};
		while (!this.assetManager.isLoadingComplete()) {
			await sleep(100);
		}

		let atlasLoader = new AtlasAttachmentLoader(atlas);
		const skeletonBinaryOrJson: SkeletonBinary | SkeletonJson =
			assetPath.loadMode === "skel" ? new SkeletonBinary(atlasLoader) : new SkeletonJson(atlasLoader);

		skeletonBinaryOrJson.scale = scale;
		const skeletonData = skeletonBinaryOrJson.readSkeletonData(this.assetManager.get(assetPath.skeleton));
		const skeleton = new Skeleton(skeletonData);
		const animationState = new AnimationState(new AnimationStateData(skeleton.data));
		return { skeleton: skeleton, state: animationState };
	}

	async render(options: RenderOptions) {
		const time = new TimeKeeper();

		const update = (delta: number) => {
			time.update(delta);
			this.renderer.resize(ResizeMode.Expand);
			state.update(time.delta);
			state.apply(skeleton);
			skeleton.updateWorldTransform();
		};

		const render = () => {
			this.renderer.camera.position.x = viewport.x + viewport.width / 2;
			this.renderer.camera.position.y = viewport.y + viewport.height / 2;
			this.gl.clearColor(0, 0, 0, 0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			this.renderer.begin();
			this.renderer.drawSkeleton(skeleton, true);
			this.renderer.end();
		};
		let { skeleton, state, animationName = skeleton.data.animations[0].name, fps, endPosition = Infinity } = options;

		state.setAnimation(0, animationName, false);

		let isComplete: boolean = false;
		const renderingEnd = () => {
			(isComplete = true), (this.isRendering = false);
		};
		state.addListener({
			complete: renderingEnd,
		});

		const viewport = calculateAnimationViewport(skeleton.data.findAnimation(animationName)!, skeleton, fps);
		this.canvas.width = Math.round(viewport.width);
		this.canvas.height = Math.round(viewport.height);
		if (this.canvas.width % 2 !== 0) this.canvas.width += 1;
		if (this.canvas.height % 2 !== 0) this.canvas.height += 1;

		const promise = async () => {
			this.isRendering = true;

			const buffers: Buffer[] = [];
			while (!isComplete && time.frameCount !== endPosition) {
				update(1 / fps);
				render();
				const frame = this.canvas.toBuffer("image/png", { compressionLevel: 1 });
				buffers.push(frame);
			}
			renderingEnd();
			return buffers;
		};

		return await this.renderQueue.enqueue(promise);
	}
}

export class AssetPath {
	noExtFilePath: string;
	loadMode: "skel" | "json";
	assetName: string;

	skeleton: string;
	atlas: string;
	texture: string;
	constructor(skeleton: string, atlas: string, texture: string) {
		this.skeleton = replacePathSpecific(skeleton);
		this.atlas = replacePathSpecific(atlas);
		this.texture = replacePathSpecific(texture);
		this.noExtFilePath = removePathExtension(this.skeleton);
		this.loadMode = this.skeleton.slice(-4) as "skel" | "json";
		
		if (this.loadMode !== "json" && this.loadMode !== "skel") throw new TypeError("骨骼数据后缀不正确");
		if (!fs.existsSync(this.skeleton)) throw new Error(`找不到骨骼数据文件${this.skeleton}！`);
		if (!fs.existsSync(this.atlas)) throw new Error(`找不到纹理图集${this.atlas}！`);
		if (!fs.existsSync(this.texture)) throw new Error(`找不到纹理${this.texture}！`);

		this.assetName = path.basename(this.noExtFilePath);
	}

	static fromFilepath(filePath: string): AssetPath {
		let noExtFilePath: string = removePathExtension(filePath);

		let skeleton: string;
		if (fs.existsSync(noExtFilePath + ".skel")) {
			skeleton = noExtFilePath + ".skel";
		} else if (fs.existsSync(noExtFilePath + ".json")) {
			skeleton = noExtFilePath + ".json";
		} else {
			throw new Error("找不到骨骼文件！");
		}
		let atlas = noExtFilePath + ".atlas";
		let texture = noExtFilePath + ".png";

		return new this(skeleton, atlas, texture);
	}
}
