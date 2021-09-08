import type { Clint } from "../extensions/Clint.js";
import type { Message } from "discord.js";

import { CODEBLOCK_REGEX, CODE_REGEX, ID_REGEX, USER_REGEX } from "../Constants.js";
import { MessageAttachment, MessageButton } from "discord.js";
import { evaluate } from "../utils/Eval.js";
import ButtonManager from "../extensions/ButtonManager.js";

export async function execute(client: Clint, msg: Message) {
	if (msg.author.id !== client.application?.owner?.id || !client.user) return;
	if (msg.channel.type === "DM" || !msg.guild) return;

	const split = msg.content.split(/\s+/g);
	const [mention, command] = split.splice(0, 2);
	if (!mention || !command) return;

	const argument = split[0];

	const isId = ID_REGEX.test(mention);
	const isMention = USER_REGEX.test(mention);
	const cleanId = mention.replaceAll(/\D/g, "");

	if (!(isId || isMention) && cleanId === client.user.id) return;

	// TODO: real system for build/clear
	if (command === "build") {
		if (!argument || !["client", "guild"].includes(argument.toLowerCase()))
			return msg.reply(`Unknown type: ${argument ?? "No type provided"}\nMust be one of "client", "guild"`);

		msg.delete().catch(() => null);
		const res = await client.commands.put(client.user.id, argument === "guild" ? msg.guild.id : undefined);
		if (!res) msg.reply("Something went wrong with setting the commands.");
		return;
	}

	// TODO: real system for build/clear
	if (command === "clear") {
		if (!argument || !["client", "guild"].includes(argument.toLowerCase()))
			return msg.reply(`Unknown type: ${argument ?? "No type provided"}\nMust be one of "client", "guild"`);

		msg.delete().catch(() => null);
		const res = await client.commands.clear(client.user.id, argument === "guild" ? msg.guild.id : undefined);
		if (!res) msg.reply("Something went wrong with clearing the commands.");
		return;
	}

	// Temporary eval until multi-line slashies
	if (command === "eval") {
		const captured = (msg.content.match(CODEBLOCK_REGEX) ?? msg.content.match(CODE_REGEX))?.groups;
		const code = captured?.code ?? split.join(" ");

		const { embeds, files, output } = await evaluate(msg, code);

		const buttonManager = new ButtonManager();

		const outputButton = new MessageButton() //
			.setCustomId("output")
			.setLabel("Send output")
			.setStyle("PRIMARY");

		const codeButton = new MessageButton() //
			.setCustomId("code")
			.setLabel("Send code")
			.setStyle("PRIMARY");

		buttonManager.setRows(outputButton, codeButton);
		const reply = await msg.reply({ embeds, files, components: buttonManager.rows });

		const collector = buttonManager.setMessage(reply).setUser(msg.author).createCollector();

		collector.on("collect", (interaction) => {
			if (interaction.customId === "output") {
				const attachment = new MessageAttachment(Buffer.from(output), "output.txt");

				interaction.followUp({ files: [attachment] }).catch(() => {
					interaction.followUp({ content: "I couldn't send the output", ephemeral: true });
				});

				buttonManager.disable(interaction, "output");
			}

			if (interaction.customId === "code") {
				const attachment = new MessageAttachment(Buffer.from(code), "code.txt");

				interaction.followUp({ files: [attachment] }).catch(() => {
					interaction.followUp({ content: "I couldn't send the code", ephemeral: true });
				});

				buttonManager.disable(interaction, "code");
			}
		});

		collector.on("dispose", (intr) => {
			intr.reply({ content: "You cannot use this button", ephemeral: true });
		});
		return;
	}
}
