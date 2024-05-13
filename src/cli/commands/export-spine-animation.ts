import { CommandModule } from "yargs"
import { extractKeysToArray } from "@/utils.js";
import { Exporters } from "@/exporter.js";
import { SpineAnimationExportOptions, exportSpineAnimation } from "@/handler.js";
import { KebabOptions, CommandOptions } from "../type-hind.js";

export interface CommandArguments extends KebabOptions<SpineAnimationExportOptions> {
	inputDir: string;
}

export default <CommandModule<CommandArguments, CommandArguments>>{
	command: "export [options] <inputDir>",
	aliases: ['$0'],
	describe: `Render and export the animation.
	Note that the 'render' mentioned does not mean rendering something to the screen, but is just a step in exporting the animation.`,
	builder: (yargs) => {
		return yargs
			.options<CommandOptions<CommandArguments>>({
				"inputDir": {
					demandOption: true,
					type: "string",
					desc: "Assets will be imported from this directory and its subdirectories, and .png/.atlas with the same name as .skel must be included in the same directory as .skel.",
				},
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
					default: null,
					desc: "If set, old-style cropping is used, i.e. content that exceeds the canvas size will not be rendered. By default, AABB's min-max vertex positioning rendering range is used.",
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
					desc: "Whether to premultiply alpha when loading texture, try changing this option if the rendering result is incorrect.",
				},
				scale: {
					type: "number",
					default: 1,
					desc: "Scale the skeleton size, default is 1x.",
				},
				fps: {
					alias: "f",
					type: "number",
					default: 30,
					desc: `Rendering frame rate, invalid when --exportType is 'png'.`,
				},
				"end-position": {
					type: "number",
					default: Infinity,
					desc: "If set, rendering will end at the specified frame.",
				},
				"exporter-max-concurrent": {
					type: "number",
					default: 2,
					desc: "Maximum number of concurrencies for export functions"
				}
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
			])
	},
	handler: async (args) => {
		await exportSpineAnimation(args.inputDir, args as SpineAnimationExportOptions)
	},
}
