
import { CommandModule } from "yargs";
import exportSpineAnimation from "./export-spine-animation.js";
import textureUnpack from "./texture-unpack.js";

export const commands: CommandModule<any, any>[] = [exportSpineAnimation, textureUnpack];