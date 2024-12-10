import Path from "@mojojs/path";
import Ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import stream from "stream";
import { defer } from "./utils.js";
import PQueue from "p-queue";
import { logger } from "./logger.js";

interface FfmpegPromise {
	ffmpeg: Ffmpeg.FfmpegCommand
	promise: Promise<void>
}

function createFfmpegCommand(
	input: stream.Readable,
	outputPath?: string,
	options?: Ffmpeg.FfmpegCommandOptions,
): FfmpegPromise {
	const { resolve, reject, promise } = defer()
	const ffmpeg = Ffmpeg(input, { logger, ...options })
	ffmpeg
		.on('start', () => {
			logger.info(`[ffmpeg]: Start exporting, output path: ${outputPath}`);
		})
		.on("end", resolve)
		.on("end", () => logger.info(`[ffmpeg]: Export finished, output path: ${outputPath}`))
		.on("error", (err, stdout, stderr) => {
			reject("[ffmpeg]: Export failed: \n" + stderr);
		});
	return { ffmpeg, promise }
}

class CropSize {
	width: number;
	height: number;
	x: number;
	y: number;

	constructor(w: number, h: number, x: number, y: number) {
		this.width = w;
		this.height = h;
		this.x = x;
		this.y = y;
	}

	toString(): string {
		return [this.width, this.height, this.x, this.y].join(":");
	}

	addWidth(addend: number): this {
		this.width += addend;
		this.x -= addend;
		return this;
	}

	addHeight(addend: number): this {
		this.height += addend;
		this.y -= addend;
		return this;
	}

	static fromString(dimensionString: string): CropSize {
		const params = dimensionString.split(":").map((value) => parseInt(value));
		return new CropSize(params[0], params[1], params[2], params[3]);
	}
}

async function calculateCropSize(images: Buffer[]): Promise<CropSize> {
	const options: any[] = [];
	for (let image of images.slice(1)) {
		options.push({
			input: image,
			blend: "over",
			gravity: "center",
		});
	}
	let temp = await sharp(images[0])
		.composite(options)
		.png({ compressionLevel: 0 })
		.toBuffer();

	const { info } = await sharp(temp)
		.trim({ background: "#00000000" })
		.toBuffer({ resolveWithObject: true });

	const size = new CropSize(info.width, info.height, Math.abs(info.trimOffsetLeft!), Math.abs(info.trimOffsetTop!));
	if (size.width % 2 !== 0) size.addWidth(1);
	if (size.height % 2 !== 0) size.addHeight(1);

	return size;
}

const cropSize = async (animationFrames: Buffer[]) => (await calculateCropSize(animationFrames)).toString()

async function toGIF(animationFrames: Buffer[], fps: number, autoCrop: boolean, outputPath: string) {
	const dataStream = stream.Readable.from(animationFrames);
	const { ffmpeg, promise } = createFfmpegCommand(dataStream, outputPath)
	ffmpeg
		.inputFPS(fps)
		.complexFilter([
			`${autoCrop 
			? `[0:v]crop=${await cropSize(animationFrames)}[middle]; [middle]` 
			: '[0:v]'}split[a][b]; 
			[a]palettegen=transparency_color=ffffff[p]; 
			[b][p]paletteuse[out]`,
		])
		.outputFPS(fps)
		.map("[out]")
		.save(outputPath);

	return promise
}

async function toMOV(animationFrames: Buffer[], fps: number, autoCrop: boolean, outputPath: string) {
	const dataStream = stream.Readable.from(animationFrames);
	const {ffmpeg, promise} = createFfmpegCommand(dataStream, outputPath);

	ffmpeg
		.inputFPS(fps)
		if (autoCrop) {ffmpeg.complexFilter("crop=" + await cropSize(animationFrames))}
	ffmpeg
		.outputFPS(fps)
		.outputOptions("-pix_fmt yuv420p")
		.save(outputPath);

	return promise
}

async function toPNGSequence(animationFrames: Buffer[], autoCrop: boolean, outputPath: string) {
	const indexLength = animationFrames.length.toString().length;
	const dataStream = stream.Readable.from(animationFrames);

	const { ffmpeg, promise } = createFfmpegCommand(dataStream, outputPath)
	if (autoCrop) {ffmpeg.complexFilter("crop=" + await cropSize(animationFrames))}
	ffmpeg
		.outputFormat("image2")
		.save(`${outputPath}_%0${indexLength}d.png`);

	return promise
}

async function toSingleFramePNG(frame: Buffer, autoCrop: boolean, outputPath: string) {
	const dataStream = stream.Readable.from([frame]);

	const { ffmpeg, promise } = createFfmpegCommand(dataStream, outputPath)
		if (autoCrop) {ffmpeg.complexFilter("crop=" + await cropSize([frame]))}
	ffmpeg
		.frames(1)
		.save(outputPath);

	return promise
}

export const Exporters = {
	gif: toGIF,
	png: toSingleFramePNG,
	sequence: toPNGSequence,
	mov: toMOV,
};

export type TExporterType = keyof typeof Exporters;
export type TExportFunc = () => Promise<void>;

export interface ExportOptions {
	outputPath: string;
	fps?: number;
	autoCrop?: boolean
}

export class FfmpegFrameExporter {
	queue: PQueue
	
	constructor(concurrency: number) {
		this.queue = new PQueue({ concurrency });
	}
	
	run (animationFrames: Buffer[], exportType: TExporterType, options: ExportOptions) {
		let { fps = 30, autoCrop = false, outputPath } = options;

		const obj: { [key in TExporterType]: TExportFunc } = {
			gif: () => {
				return Exporters.gif(animationFrames, fps, autoCrop, outputPath + ".gif");
			},
			png: () => {
				return Exporters.png(animationFrames[0], autoCrop, outputPath + ".png");
			},
			sequence: () => {
				return Exporters.sequence(animationFrames, autoCrop, outputPath);
			},
			mov: () => {
				return Exporters.mov(animationFrames, fps, autoCrop, outputPath + ".mov");
			},
		};
	
		new Path(outputPath).dirname().mkdirSync({ recursive: true });
	
		const func = obj[exportType];
		if (!func) {
			throw new Error("导出类型不存在！");
		}
		
		this.queue.add(func).catch((reason) => logger.error(reason))
	}
}
