import type { ApplicationCommandData } from "discord.js";
import type { CmdIntr } from "../../Typings";
import { ApplicationCommandOptionType } from "discord-api-types/v9";

export const data: ApplicationCommandData = {
	name: "test",
	description: "A test",
	options: [
		{
			name: "sub-group",
			description: "A subcommand group",
			type: ApplicationCommandOptionType.SubcommandGroup as number,
			options: [
				{
					name: "sub",
					description: "A subcommand",
					type: ApplicationCommandOptionType.Subcommand as number,
					options: [
						{
							name: "option",
							description: "An option",
							type: ApplicationCommandOptionType.String as number
						}
					]
				}
			]
		},
        {
			name: "another-sub-group",
			description: "Another subcommand group",
			type: ApplicationCommandOptionType.SubcommandGroup as number,
			options: [
				{
					name: "another-sub",
					description: "Another subcommand",
					type: ApplicationCommandOptionType.Subcommand as number,
					options: [
						{
							name: "another-option",
							description: "Another option",
							type: ApplicationCommandOptionType.String as number
						}
					]
				},
                {
					name: "another-another-sub",
					description: "Another another subcommand",
					type: ApplicationCommandOptionType.Subcommand as number,
					options: [
						{
							name: "another-another-option",
							description: "Another another option",
							type: ApplicationCommandOptionType.String as number
						}
					]
				},
                {
					name: "another-another-another-sub",
					description: "Another another another subcommand",
					type: ApplicationCommandOptionType.Subcommand as number,
					options: [
						{
							name: "another-another-another-option",
							description: "Another another another option",
							type: ApplicationCommandOptionType.String as number
						}
					]
				}
			]
		}
	]
};

export async function execute(intr: CmdIntr) {
	intr.editReply("i need help");

	intr.logger.log("i need help");
}
