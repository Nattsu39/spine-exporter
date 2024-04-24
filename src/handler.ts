import fs from "fs/promises";
import { createCanvas } from "node-canvas-webgl";
import { exportFuncFactory } from "./exporter.js";
import { SpineRenderer } from "./renderer.js";
import { formatOutputPath, traverseDir } from "./utils.js";
import { TExporterType } from "./exporter.js";

export function parseCanvasSize(size: string) {
	const canvasWxH = size.split("x");
	if (canvasWxH.length !== 2) {
		throw new Error("Canvas size format error! \n" + "Correct format: [width]x[height], for example 500x500.");
	}
	return { width: parseInt(canvasWxH[0]), height: parseInt(canvasWxH[1]) };
}

export interface ExportSpineAssetsOptions {
	outputPath?: string;
	exportType: TExporterType;
	canvasSize?: string | null;
	selectedAnimation?: string[];
	preMultipliedAlpha: boolean;
	scale?: number;
	fps?: number;
	endPosition?: number;
}

export async function exportSpineAnimation(inputDir: string, options: ExportSpineAssetsOptions) {
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
	const paths = await traverseDir(inputDir);
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

				const formatObject = { assetName, animationName, fps, scale };
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
