import type { ApplicationCommandData, Message } from "discord.js";
import type { CmdIntr } from "../../typings.js";

import { MessageAttachment, MessageButton } from "discord.js";
import { ApplicationCommandOptionType } from "discord-api-types/v9";
import { ButtonManager } from "../../extensions/";
import { evaluate } from "../../utils/Eval.js";
import Util from "../../utils/";

export const data: ApplicationCommandData = {
	name: "eval",
	description: "Runs code",
	options: [
		{
			name: "code",
			description: "The code to run",
			type: ApplicationCommandOptionType.String as number,
			required: true
		},
		{
			name: "reply",
			description: "Reply to the command. Default is true",
			type: ApplicationCommandOptionType.Boolean as number
		},
		{
			name: "async",
			description: "Asyncronously execute the code. Default is true",
			type: ApplicationCommandOptionType.Boolean as number
		}
	]
};

export async function execute(intr: CmdIntr) {
	const code = intr.options.getString("code", true);
	const reply = intr.options.getBoolean("reply") ?? true;
	const async = intr.options.getBoolean("async") ?? true;

	if (intr.user.id !== intr.client.application.owner?.id) return intr.editReply({ content: "No" });

	const { embeds, files, output } = await evaluate(intr, code, async);

	if (reply) {
		const buttonManager = new ButtonManager();

		const outputButton = new MessageButton() //
			.setCustomId("output")
			.setLabel("Send output")
			.setStyle("PRIMARY");

		const codeButton = new MessageButton() //
			.setCustomId("code")
			.setLabel("Send code")
			.setStyle("PRIMARY");

		const msg = (await intr.editReply({ embeds, files, components: buttonManager.rows })) as Message;

		buttonManager.setRows(outputButton, codeButton).setMessage(msg).setUser(intr.user);
		const collector = buttonManager.createCollector();

		collector.on("collect", (interaction) => {
			if (interaction.customId === "output") {
				const attachment = new MessageAttachment(Buffer.from(output), "output.txt");

				interaction.followUp({ files: [attachment] }).catch(() => {
					interaction.followUp({ content: "I couldn't send the output", ephemeral: true });
				});

				buttonManager.disable(interaction, "output");
				intr.logger.log(`Sent output as an attachment:\n${Util.Indent(output)}`);
			}

			if (interaction.customId === "code") {
				const attachment = new MessageAttachment(Buffer.from(code), "code.txt");

				interaction.followUp({ files: [attachment] }).catch(() => {
					interaction.followUp({ content: "I couldn't send the code", ephemeral: true });
				});

				buttonManager.disable(interaction, "code");
				intr.logger.log(`Sent code as an attachment:\n${Util.Indent(code)}`);
			}
		});

		collector.on("dispose", (intr) => {
			// this doesn't actually seem to work :shrug:
			intr.reply({ content: "You cannot use this button", ephemeral: true });
		});
	}

	intr.logger.log(`Code:\n${Util.Indent(code, 4)}`, `Output:\n${Util.Indent(output, 4)}`);
}
