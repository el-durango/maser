import { type APIEmbed } from "discord-api-types/v9";
import {
	type ChatInputApplicationCommandData,
	type CommandInteraction
} from "discord.js";
import CaseManager from "../../database/CaseManager.js";
import type Logger from "../../loggers/index.js";
import { type Command, type CommandOptions } from "../../typings/index.js";
import { user } from "./noread.sharedCommandOptions.js";

const options: Partial<CommandOptions> = {
	private: true,
	wip: true
};

const data: ChatInputApplicationCommandData = {
	name: "history",
	description: "Show the history of a user",
	options: [user()]
};

async function execute(intr: CommandInteraction<"cached">, logger: Logger) {
	const userOptionIsProvided = Boolean(intr.options.get("user")?.value);

	const member = userOptionIsProvided
		? intr.options.getMember("user")
		: intr.member;

	const user = userOptionIsProvided
		? intr.options.getUser("user", true)
		: intr.user;

	const caseManager = new CaseManager(intr.client, intr.guildId);
	const cases = await caseManager.getHistory(user.id);

	const embedFooter =
		Object.entries(
			cases.reduce((obj: Record<string, number>, case_) => {
				obj[case_.type] = (obj[case_.type] ?? 0) + 1;

				return obj;
			}, {})
		)
			.map(
				([type, n]) => `${n} ${type.toLowerCase()}${n === 1 ? "" : "s"}`
			)
			.join(", ") || "No history";

	const historyEmbed: APIEmbed = {
		author: {
			icon_url: (member ?? user).displayAvatarURL(),
			name: `${user.tag} (${user.id})`
		},
		fields: [
			{
				name: "Cases",
				value: "test"
			},
			{
				name: "Info",
				value: "..."
			}
		],
		footer: { text: embedFooter }
	};

	intr.editReply({ embeds: [historyEmbed] });

	logger.logInteraction(`Sent history of ${user.tag} (${user.id})`);
}

export const getCommand = () =>
	({
		data,
		execute,
		options
	} as Partial<Command>);
