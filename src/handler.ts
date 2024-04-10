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
	canvasSize?: string;
	selectedAnimation?: string[];
	fps?: number;
	endPosition?: number;
}

export async function exportSpineAnimation(inputDir: string, options: ExportSpineAssetsOptions) {
	let {
		outputPath = "output/{assetName}/{animationName}",
		exportType,
		canvasSize = "1000x1000",
		selectedAnimation = [],
		fps = 30,
		endPosition = Infinity,
	} = options;
	if (exportType === "png") endPosition = 1;

	const checkParams = async () => {
		if (!(await fs.stat(inputDir)).isDirectory()) throw new Error("The input path not a directory!");
	};
	await checkParams();

	const size = parseCanvasSize(canvasSize);
	const renderer = new SpineRenderer(createCanvas(size.width, size.height));
	const paths = await traverseDir(inputDir);
	const pathArray = Array(...paths.values());

	for (let assetIndex = 0; assetIndex < pathArray.length; assetIndex++) {
		const assetPath = pathArray[assetIndex];
		const assetProcess = `[${assetIndex + 1}/${pathArray.length}]`;
		try {
			const { skeleton, state } = await renderer.load(assetPath, 1);
			for (let animation of skeleton.data.animations) {
				const aName = animation.name;
				if (selectedAnimation.length && !selectedAnimation.includes(aName)) continue;

				const formatObject = {
					assetName: assetPath.assetName,
					animationName: aName,
					fps: fps,
				};
				const exportFunc = exportFuncFactory(exportType, {
					outputPath: formatOutputPath(outputPath, formatObject),
					fps: fps,
				});

				console.log(`${assetProcess}Start rendering the animation '${aName}' of asset '${assetPath.assetName}'...`);
				const animationFrames = await renderer.render({
					skeleton,
					state,
					animationName: aName,
					fps: fps,
					endPosition: endPosition,
				});

				console.log(`${assetProcess}Start exporting the animation '${aName}' of asset '${assetPath.assetName}'...`);
				await exportFunc(animationFrames);
			}
		} catch (error) {
			console.info(`Asset export error！\nasset: ${assetPath.assetName}\nerror: ${error}`);
		}
	}
}
