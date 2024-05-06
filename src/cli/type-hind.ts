import { Options } from "yargs";

export type CamelToKebab<S extends string> = 
	S extends `${infer T}${infer U}`
	? U extends Uncapitalize<U>
		? `${Uncapitalize<T>}${CamelToKebab<U>}`
		: `${Uncapitalize<T>}-${CamelToKebab<U>}`
	: "";

export type KeysToKebabCase<T> = {
	[K in keyof T as CamelToKebab<string & K>]: T[K];
};

export type KebabOptions<T> = {
	[key in keyof Required<KeysToKebabCase<T>>]: T[key];
};

export type CommandOptions<T> = {[key in keyof T]: Options}