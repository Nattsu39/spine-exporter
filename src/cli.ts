#!/usr/bin/env node
import { Options as YargsOptions } from "yargs";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Exporters } from "./exporter.js";
import { extractKeysToArray } from "./utils.js";
import { exportSpineAnimation, ExportSpineAssetsOptions } from "./handler.js";

type CamelToKebab<S extends string> = S extends `${infer T}${infer U}`
	? U extends Uncapitalize<U>
		? `${Uncapitalize<T>}${CamelToKebab<U>}`
		: `${Uncapitalize<T>}-${CamelToKebab<U>}`
	: "";

type KeysToSnakeCase<T> = {
	[K in keyof T as CamelToKebab<string & K>]: T[K];
};

type TCliOptions = { [key in keyof Required<KeysToSnakeCase<ExportSpineAssetsOptions>>]: YargsOptions };

interface CliArguments extends ExportSpineAssetsOptions {
	inputDir: string;
}

const parser = yargs(hideBin(process.argv))
	.usage(
		"$0 [options] <inputDir>",
		`Render and export the animation.
		Note that the 'render' mentioned does not mean rendering something to the screen, but is just a step in exporting the animation.`,
	)
	.scriptName("spine-export-cli")
	.positional("inputDir", {
		demandOption: true,
		type: "string",
		desc: "Assets will be imported from this directory and its subdirectories, and .png/.atlas with the same name as .skel must be included in the same directory as .skel.",
	})
	.options<TCliOptions>({
		"output-path": {
			alias: "o",
			type: "string",
			default: "output/{assetName}/{animationName}",
			desc: "The path to output the rendering result, see examples.",
		},
		"export-type": {
			alias: "e",
			type: "string",
			choices: extractKeysToArray(Exporters),
			demandOption: true,
			desc: "Specify how to export rendering results.",
		},
		"canvas-size": {
			alias: "c",
			type: "string",
			default: "1000x1000",
			desc: "Canvas size. Content that exceeds the canvas size will not be rendered. Large sizes will significantly reduce rendering speed.",
		},
		"selected-animation": {
			alias: "s",
			array: true,
			type: "string",
			default: [],
			desc: "If set, only the animations in the parameters will be rendered, by default all will be rendered.",
		},
		"pre-multiplied-alpha": {
			alias: "pma",
			type: "boolean",
			default: false,
			desc: "Whether to premultiply alpha when loading texture, try changing this option if the rendering result is incorrect."
		},
		"scale": {
			type: "number",
			default: 1,
			desc: "Scale the skeleton size, default is 1x."
		},
		fps: {
			alias: "f", 
			type: "number", 
			default: 30, 
			desc: `Rendering frame rate, invalid when --exportType is 'png'.`
		},
		"end-position": {
			type: "number", 
			default: Infinity, 
			desc: "If set, rendering will end at the specified frame."
		},
	})
	.example([
		["$0 --export-type gif assets/", "Render assets in ./assets/ and export to GIF."],
		[
			"$0 -e png -o output/{assetName}_{animationName} assets/ ",
			`Render the assets in ./assets/ and export the first frame. Assume the asset name is 'foo', the animation name is 'bar', and the exported file is 'foo_bar.png'`,
		],
		[
			"$0 -e sequence -o output/{assetName}/{animationName} assets/",
			`Render the first five frames of the assets in ./assets/ and export them as a png sequence. The sequence file name is '{animationName}_%d.png'.`,
		],
	]);

(async () => {
	const argv = (await parser.parse()) as CliArguments;
	await exportSpineAnimation(argv.inputDir, argv);
})();
