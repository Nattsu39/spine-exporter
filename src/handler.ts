import fs from "fs/promises";
import { createCanvas } from "node-canvas-webgl";
import { exportFuncFactory } from "./exporter.js";
import { AssetPath, SpineRenderer, TexturePath, loadTexture } from "./renderer.js";
import { formatOutputPath, traverseDir } from "./utils.js";
import { TExporterType } from "./exporter.js";
import { AssetManager, ManagedWebGLRenderingContext } from "@node-spine-runtimes/webgl-3.8.99";
import sharp from "sharp";
import path from "path";
import { formatString } from "./utils.js";

export function parseCanvasSize(size: string) {
	const canvasWxH = size.split("x");
	if (canvasWxH.length !== 2) {
		throw new Error("Canvas size format error! \n" + "Correct format: [width]x[height], for example 500x500.");
	}
	return { width: parseInt(canvasWxH[0]), height: parseInt(canvasWxH[1]) };
}

export interface SpineAnimationExportOptions {
	outputPath?: string;
	exportType: TExporterType;
	canvasSize?: string | null;
	selectedAnimation?: string[];
	preMultipliedAlpha: boolean;
	scale?: number;
	fps?: number;
	endPosition?: number;
}

export async function exportSpineAnimation(inputDir: string, options: SpineAnimationExportOptions) {
	let {
		outputPath = "output/{assetName}/{animationName}",
		exportType,
		canvasSize,
		selectedAnimation = [],
		preMultipliedAlpha = false,
		fps = 30,
		scale = 1,
		endPosition = Infinity,
	} = options;
	if (exportType === "png") endPosition = 1;

	const checkParams = async () => {
		if (!(await fs.stat(inputDir)).isDirectory()) throw new Error("The input path not a directory!");
	};
	await checkParams();

	const isOldCanvasMode = typeof canvasSize === "string";
	const size = isOldCanvasMode ? parseCanvasSize(canvasSize) : { width: 1000, height: 1000 };
	const renderer = new SpineRenderer(createCanvas(size.width, size.height));
	const paths = await traverseDir(inputDir, AssetPath);
	const pathArray = Array(...paths.values());

	for (let assetIndex = 0; assetIndex < pathArray.length; assetIndex++) {
		const assetPath = pathArray[assetIndex];
		const assetName = assetPath.assetName;
		const assetProcess = `[${assetIndex + 1}/${pathArray.length}]`;
		try {
			const { skeleton, state } = await renderer.load(assetPath, scale, preMultipliedAlpha);
			for (let animation of skeleton.data.animations) {
				const animationName = animation.name;
				if (selectedAnimation.length && !selectedAnimation.includes(animationName)) {
					continue;
				}

				console.log(`${assetProcess}Start rendering the animation '${animationName}' of asset '${assetName}'...`);
				const animationFrames = await renderer.render({
					skeleton,
					state,
					animationName,
					fps,
					endPosition,
				});

				const formatObject = { assetPath: path.dirname(assetPath.skeleton), assetName, animationName, fps, scale };
				const exportFunc = exportFuncFactory(exportType, {
					outputPath: formatOutputPath(outputPath, formatObject),
					fps,
					autoCrop: isOldCanvasMode,
				});

				console.log(`${assetProcess}Start exporting the animation '${animationName}' of asset '${assetName}'...`);
				await exportFunc(animationFrames);
			}
		} catch (error) {
			console.info(`Asset export error！\nasset: ${assetName}\nerror: ${error}`);
		}
	}
}

export interface TextureUnpackOptions {
	outputDir: string;
	preMultipliedAlpha?: boolean;
};

export async function textureUnpack(inputDir: string, options: TextureUnpackOptions) {
	let { outputDir = "{assetPath}/images/", preMultipliedAlpha = false } = options
	const assetManager = new AssetManager(new ManagedWebGLRenderingContext(createCanvas(1000, 1000)))
	const paths = await traverseDir(inputDir, TexturePath);
	for (let texturePath of paths.values()) {
		const { regions } = await loadTexture(assetManager, texturePath.atlas)
		for (let region of regions) {
			let { texture, name, rotate, x, y, originalWidth, originalHeight } = region
			if (!texture) {
				continue
			}
			
			const textureImage = sharp(texture.getImage().src)
			let result = textureImage.extract({
				left: x,
				top: y,
				width: rotate ? originalHeight : originalWidth,
				height: rotate ? originalWidth : originalHeight
			})

			// 反预乘alpha
			if (!preMultipliedAlpha) {
				let { data, info } = await textureImage.raw().toBuffer({ resolveWithObject: true })

				const channels = info.channels; // 图像通道数（一般为3或4，分别代表RGB和RGBA）
				// 一次迭代一个像素
				for (let i = 0; i < data.length; i += channels) {
					const alpha = data[i + channels - 1] / 255; // 提取alpha通道值并将其归一化到[0, 1]
					if (alpha === 0) {
						continue
					}
					// 迭代像素的R, G, B值
					for (let c = 0; c < channels - 1; c++) {
						data[i + c] = Math.floor(Math.min(data[i + c] / alpha, 255)) // 反预乘
					}
				}

				result = sharp(data, { raw: info })
			}
			if (rotate) result.rotate(90)
			
			outputDir = formatString(outputDir, {assetPath: path.dirname(texturePath.texture)})
			await fs.mkdir(outputDir, { recursive: true })
			await result.toFile(`${outputDir}${name}.png`)
		}
	}
}