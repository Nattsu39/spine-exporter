#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { commands } from "./commands/index.js";

yargs(hideBin(process.argv))
	.scriptName('spine-export-cli')
	.command(commands)
	.parse();