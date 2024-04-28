import fs from "fs/promises";
import { AssetPathGroup } from "./renderer.js";
import path from "path";

export const sleep = (waitTimeInMs: number) => new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

export async function traverseDir<T extends typeof AssetPathGroup>(dir: string, pathGroup: T) {
	let paths: Map<string, InstanceType<T>> = new Map();
	const files = await fs.readdir(dir, { withFileTypes: true });
	for (let dirent of files) {
		let file = `${dir}/${dirent.name}`;
		if (dirent.isDirectory()) {
			const dirs = await traverseDir(file, pathGroup);
			dirs.forEach((value, key) => {
				paths.set(key, value);
			});
			continue;
		}
		try {
			let path = pathGroup.fromFilepath(file);
			paths.set(path.noExtFilePath, path);
		} catch (error) {
			continue;
		}
	}

	return paths;
}

interface FormatObject {
	[name: string]: string | number;
}

function format(stringToFormat: string, formatItems: FormatObject): string {
	let str = stringToFormat;

	Object.entries(formatItems).forEach(([prop, value]) => {
		const valueToReplaceWith = typeof value === "number" ? value.toString() : value;
		const lookUp = `{${prop}}`;
		const hasExpression = str.includes(lookUp);
		if (hasExpression) {
			str = str.replace(new RegExp(lookUp, "gi"), valueToReplaceWith);
		}
	});

	return str;
}

export interface OutputPathFormatObject extends FormatObject {
	assetName: string;
	animationName: string;
	fps: number;
	scale: number;
}

export function formatOutputPath(str: string, obj: OutputPathFormatObject) {
	return format(str, obj);
}

// 提取对象的键并返回一个包含这些键的数组
type StringKeyOf<T> = Extract<keyof T, string>;
export function extractKeysToArray<T extends object>(obj: T): StringKeyOf<T>[] {
	return Object.keys(obj) as StringKeyOf<T>[];
}

export function replacePathSpecific(pathString: string) {
	return pathString.replaceAll(path.sep, "/");
}

export function removePathExtension(filePath: string): string {
	let {dir, name} = path.parse(filePath);
	return path.join(dir, name);
}
