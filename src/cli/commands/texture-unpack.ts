import { CommandModule } from "yargs"
import { textureUnpack, TextureUnpackOptions } from "@/handler.js";
import { CommandOptions, KebabOptions } from "../type-hind";

export interface CommandArguments extends KebabOptions<TextureUnpackOptions> {
	inputDir: string;
}

export default <CommandModule<CommandArguments, CommandArguments>>{
	command: "unpacker [options] <inputDir>",
	describe: "Load the texture atlas and then unpack the texture.",
	builder: (yargs) => {
		return yargs
			.options<CommandOptions<CommandArguments>>({
				"inputDir": {
					demandOption: true,
					type: "string",
					desc: "Texture will be imported from this directory and its subdirectories. The atlas with the same name as the Texture must be contained in the same directory as the Texture.",
				},
				"output-dir": {
					alias: "o",
					type: "string",
					default: "{assetPath}/images/",
					desc: "Textures output path.",
				},
				"pre-multiplied-alpha": {
					alias: "pma",
					type: "boolean",
					default: false,
					desc: "Specifies whether premultiplied alpha is preserved when exporting textures, if not, unpremultiplied alpha is exported (which is lossy)."
				}
			})
	},
	handler: (args) => {
		textureUnpack(args.inputDir, args as TextureUnpackOptions)
	}
}