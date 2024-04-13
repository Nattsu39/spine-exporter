import Path from "@mojojs/path";
import Ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import stream from "stream";

function createFfmpeg(options?: Ffmpeg.FfmpegCommandOptions): Ffmpeg.FfmpegCommand;
function createFfmpeg(input?: string | stream.Readable, options?: Ffmpeg.FfmpegCommandOptions): Ffmpeg.FfmpegCommand;
function createFfmpeg(
	input?: string | stream.Readable | Ffmpeg.FfmpegCommandOptions,
	options?: Ffmpeg.FfmpegCommandOptions,
) {
	return Ffmpeg(...arguments).on("error", (err, stdout, stderr) => {
		console.error("[ffmpeg]: Cannot process video: \n" + stderr);
	});
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

async function toGIF(animationFrames: Buffer[], fps: number, outputPath: string) {
	const size = await calculateCropSize(animationFrames);
	const dataStream = stream.Readable.from(animationFrames);
	createFfmpeg(dataStream)
		.FPS(fps)
		.complexFilter([
			`[0:v]crop=${size.toString()}[middle]; [middle]split[a][b]; [a]palettegen=transparency_color=ffffff[p]; [b][p]paletteuse[out]`,
		])
		.map("[out]")
		.save(outputPath);
}

async function toMOV(animationFrames: Buffer[], fps: number, outputPath: string) {
	const size = await calculateCropSize(animationFrames);
	const dataStream = stream.Readable.from(animationFrames);
	createFfmpeg(dataStream)
		.FPS(fps)
		.complexFilter("crop=" + size.toString())
		.outputOptions("-pix_fmt yuv420p")
		.save(outputPath);
}

async function toPNGSequence(animationFrames: Buffer[], outputPath: string) {
	const indexLength = animationFrames.length.toString().length;
	const size = await calculateCropSize(animationFrames);
	const dataStream = stream.Readable.from(animationFrames);
	createFfmpeg(dataStream)
		.FPS(25)
		.complexFilter("crop=" + size.toString())
		.outputFormat("image2")
		.save(`${outputPath}_%0${indexLength}d.png`);
}

async function toSingleFramePNG(frame: Buffer, outputPath: string) {
	const size = await calculateCropSize([frame]);
	const dataStream = stream.Readable.from([frame]);
	createFfmpeg(dataStream)
		.complexFilter("crop=" + size.toString())
		.frames(1)
		.save(outputPath);
}

export const Exporters = {
	gif: toGIF,
	png: toSingleFramePNG,
	sequence: toPNGSequence,
	mov: toMOV,
};

export type TExporterType = keyof typeof Exporters;
export type TExportFunc = (buffer: Buffer[]) => Promise<void>;

export interface ExportOptions {
	outputPath: string;
	fps?: number;
}

export function exportFuncFactory(exportType: TExporterType, options: ExportOptions) {
	let { outputPath, fps = 30 } = options;

	type ExporterWrapObject = { [key in TExporterType]: TExportFunc };
	const obj: ExporterWrapObject = {
		gif: async (buffers: Buffer[]) => {
			await Exporters.gif(buffers, fps, outputPath + ".gif");
		},
		png: async (buffers: Buffer[]) => {
			await Exporters.png(buffers[0], outputPath + ".png");
		},
		sequence: async (buffers: Buffer[]) => {
			await Exporters.sequence(buffers, outputPath);
		},
		mov: async (buffers: Buffer[]) => {
			await Exporters.mov(buffers, fps, outputPath + ".mov");
		},
	};

	new Path(outputPath).dirname().mkdirSync({ recursive: true });

	const func = obj[exportType];
	if (func) {
		return func;
	}

	throw new Error("导出类型不存在！");
}
