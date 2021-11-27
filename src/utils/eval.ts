import type { CommandInteraction, EvalOutput } from "../typings.js";
import type { Client } from "../modules";

import Discord from "discord.js";
import { MessageEmbed } from "../modules";
import { performance } from "perf_hooks";
import { REGEX } from "../constants.js";
import Util from "./index.js";
import ms from "ms";

const stringify = (output: any): string => {
	const replacer = (_: string, value: any) => (typeof value === "function" || output == null ? `${value}` : value);
	return JSON.stringify(output, replacer, 2) ?? "Something went wrong with the output";
};

const parse = (string: string, prefix: string, embedStyle?: string | null) => {
	if (!string.length) return null;
	return Util.mergeForCodeblock(string, { prefix, lang: embedStyle === undefined ? "js" : null });
};

export default async function evaluate(code: string, that: CommandInteraction) {
	const client = that.client as Client;
	Discord; // "ReferenceError: Discord is not defined" if not here

	const { emError, emSuccess, emInput } = client.systemEmojis;

	try {
		const start = performance.now();
		const result = await eval(`(async () => {\n${code}\n})()`);
		const end = performance.now();

		const type = typeof result;
		const constructor = result != null ? (result.constructor.name as string) : "Nullish";

		const time = Number((end - start).toFixed(3));
		const timeTaken = ms(time, { long: true }).replace(".", ",");

		const stringedOutput = stringify(result).replaceAll(new RegExp(REGEX.TOKEN, "g"), "[REDACTED]");

		const parsedInput = parse(code, `${emInput} **Input**`);
		const parsedOutput = parse(stringedOutput, `${emSuccess} **Output**`);

		const successInputEmbed = new MessageEmbed(that).setDescription(parsedInput ?? "No input");

		const successOutputEmbed = new MessageEmbed(that)
			.setDescription(parsedOutput ?? "No output")
			.setFooter(`${timeTaken} • ${type} (${constructor})`);

		const output: EvalOutput = {
			embeds: [successInputEmbed, successOutputEmbed],
			output: stringedOutput,
			type: "output"
		};

		return output;
	} catch (err) {
		const error = err as Error;
		const msg = error.stack ?? error.toString();

		const parsedInput = parse(code, `${emInput} **Input**`);
		const parsedError = parse(msg, `${emError} **Error**`, null);

		const errorInputEmbed = new MessageEmbed(that)
			.setColor(client.colors.red)
			.setDescription(parsedInput ?? "No input");

		const errorOutputEmbed = new MessageEmbed(that)
			.setColor(client.colors.red)
			.setDescription(parsedError ?? "No error")
			.setFooter("Evaluation failed");

		const output: EvalOutput = {
			embeds: [errorInputEmbed, errorOutputEmbed],
			output: msg,
			type: "error"
		};

		return output;
	}
}
