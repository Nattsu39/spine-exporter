import fs from "fs/promises";
import { AssetPathGroup } from "./renderer.js";
import path from "path";
import { Vector2 } from "@node-spine-runtimes/webgl-3.8.99";

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

export function formatString(stringToFormat: string, formatItems: FormatObject): string {
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
	assetPath: string
}


export function formatOutputPath(str: string, obj: OutputPathFormatObject) {
	return formatString(str, obj);
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

export interface Deferred<T> {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason: unknown) => void;
    promise: Promise<T>;
}

export function defer<T = void>(): Deferred<T> {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    })
    return { resolve, reject, promise };
}

export interface ViewSize {
	width: number;
	height: number;
}

export interface ViewPosition {
	x: number;
	y: number;
}

export type Viewport = ViewSize & ViewPosition

export function parseVector2(arg: string): Vector2 {
	arg = arg.replaceAll(`'`, '')
	arg = arg.replaceAll(`"`, '')
	const twoArgs = arg.split("x");
	if (twoArgs.length !== 2) {
		throw new Error("Arg format error! \n" + "Correct format: [arg1]x[arg2]");
	}
	return new Vector2(parseInt(twoArgs[0]), parseInt(twoArgs[1]))
}
