import type { Guild, TextBasedChannels, User } from "discord.js";
import type { CommandInteraction } from "../../typings.js";

import { LOGGER_TYPES } from "../../constants.js";
import { MessageEmbed } from "discord.js";
import ConfigManager from "../../database/src/config/ConfigManager.js";
import BaseLogger from "./BaseLogger.js";
import { gray } from "./LoggerColors.js";
import Util from "../index.js";

export default class CommandLogger extends BaseLogger {
	public interaction: CommandInteraction | null;
	public name: string | null;

	constructor(intr?: CommandInteraction) {
		super();

		this.interaction = intr ?? null;
		this.name = intr?.commandName.toUpperCase() ?? null;

		this.traceValues.setUser(intr?.user ?? null);
		this.traceValues.setGuild(intr?.guild ?? null);

		if (intr?.channel && intr.channel.type !== "DM") {
			this.traceValues.setChannel(intr.channel);
		}
	}

	public log(...messages: string[]) {
		if (!this.name) throw new Error("Name of command must be set to log command");

		const command = this.interaction?.toString();
		const logLevel = this.interaction?.client.command.logLevel ?? 1;
		const toLog = command && logLevel !== 2 ? [gray(`>>> ${command}`), ...messages] : messages;

		this.print(LOGGER_TYPES.Command, this.name, ...toLog);
		this.channelLog(...messages);
	}

	public setUser(user: User | null) {
		this.traceValues.setUser(user);
		return this;
	}

	public setGuild(guild: Guild | null) {
		this.traceValues.setGuild(guild);
		return this;
	}

	public setChannel(channel: TextBasedChannels | null) {
		if (!channel || channel.type !== "DM") {
			this.traceValues.setChannel(channel);
		}

		return this;
	}

	public setName(name: string | null) {
		this.name = name;
		return this;
	}

	public setAll(options: {
		user?: User | null;
		guild?: Guild | null;
		channel?: TextBasedChannels | null;
		name?: string | null;
	}) {
		const { user, guild, channel, name } = options;

		if (name !== undefined) this.setName(name);
		if (user !== undefined) this.setUser(user);
		if (guild !== undefined) this.setGuild(guild);
		if (channel !== undefined) this.setChannel(channel);

		return this;
	}

	private channelLog(...messages: string[]) {
		if (!this.interaction) return;

		const { client, guild } = this.interaction;

		const logLevel = client.command.logLevel;
		if (logLevel === 0) return;

		const createEmbed = (description: string, index = 0, total = 1) => {
			const { user } = this.interaction!;

			const embed = new MessageEmbed()
				.setColor(this.interaction!.client.colors.invisible)
				.setDescription(description)
				.setTimestamp();

			if (index === 0) embed.setAuthor(`${user.tag} (${user.id})`);
			if (total > 1) embed.setFooter(`${index + 1}/${total}`);

			return embed;
		};

		const botLogManager = new ConfigManager(client, guild.id, "botLogChannel");

		botLogManager.getChannel().then((channel) => {
			if (!this.interaction) return; // not really needed - mostly for TS
			if (!channel) return;

			const commandStr = `\`${this.interaction.toString()}\`\n`;

			let embeds: MessageEmbed[] = [];

			if (logLevel === 2) {
				embeds = messages.map((msg, i) => {
					const prefix = i === 0 ? commandStr : "";
					msg = Util.mergeForCodeblock(msg, { prefix });

					return createEmbed(msg, i, messages.length);
				});
			} else {
				embeds.push(createEmbed(commandStr));
			}

			channel.send({ embeds }).catch(() => null);
		});
	}
}
