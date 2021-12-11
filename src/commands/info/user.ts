import {
	MessageEmbed,
	type CommandInteraction,
	type ChatInputApplicationCommandData,
	type GuildMember
} from "discord.js";
import { type Command } from "../../typings/index.js";

import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { defaultEmbedOptions, USER_FLAGS } from "../../constants.js";
import Util from "../../utils/index.js";

const data: ChatInputApplicationCommandData = {
	name: "user",
	description: "Sends information about a user",
	options: [
		{
			name: "user",
			description: "The user to target",
			type: ApplicationCommandOptionTypes.USER
		}
	]
};

async function execute(intr: CommandInteraction<"cached">) {
	const userOptionIsProvided = !!intr.options.getUser("user");
	const user = userOptionIsProvided ? intr.options.getUser("user", true) : intr.user;
	const member = userOptionIsProvided ? intr.options.getMember("user") : intr.member;

	const getRoles = (member: GuildMember | null) => {
		if (!member) return null;

		const roles = member.roles.cache;
		if (roles.size === 1) return null;

		const sortedRoles = roles.sort((a, b) => b.position - a.position);
		const parsedRoles = sortedRoles.map((role) => role.toString()).slice(0, -1); // removes @everyone

		const fourRoles = parsedRoles.slice(0, 4).join(", ");
		const excess = parsedRoles.length - 4;
		const excessStr = excess > 0 ? `, and ${excess} more` : "";

		return fourRoles + excessStr;
	};

	const parseFlags = (flagArray: string[]) => {
		const flags = flagArray.join(", ");
		return flags.charAt(0).toUpperCase() + flags.slice(1);
	};

	const getColor = (hex: `#${string}` | undefined) => {
		const green = intr.client.colors.green;
		if (!hex) return green;
		const empty = hex === "#000000" || hex.toLowerCase() === "#ffffff";
		return empty ? green : hex;
	};

	const rawFlags = (await user.fetchFlags()).toArray();
	const created = Util.date(user.createdTimestamp);
	const avatar = (member ?? user).displayAvatarURL({ size: 2048, dynamic: true });
	const flags = rawFlags.map((flag) => USER_FLAGS[flag] ?? flag);
	const bot = user.bot;
	const tag = user.tag;
	const id = user.id;

	const premium = !!member?.premiumSince;
	const joined = member?.joinedTimestamp ? Util.date(member.joinedTimestamp) : null;
	const color = getColor(member?.displayHexColor);
	const owner = !!member && member.id === member?.guild.ownerId;
	const roles = getRoles(member);
	const name = member?.displayName ?? user.tag;

	const userEmbed = new MessageEmbed(defaultEmbedOptions(intr)).setColor(color).setThumbnail(avatar).setTitle(name);

	if (member) userEmbed.addField("Tag", tag);
	userEmbed.addField("ID", id);

	if (member) {
		userEmbed
			.addField("Roles", roles ?? "No roles")
			.addField("Bot", bot ? "Yes" : "No", true)
			.addField("Boosting", premium ? "Yes" : "No", true)
			.addField("Avatar", `[Link](${avatar})`)
			.addField("Color", member.displayHexColor);
	}

	userEmbed.addField("Badges", flags.length ? parseFlags(flags) : "No badges");
	if (created) userEmbed.addField("Created", created, true);
	if (joined) userEmbed.addField("Joined", joined, true);
	if (owner) userEmbed.setDescription("👑 Server owner");

	intr.editReply({ embeds: [userEmbed] });

	intr.logger.log(`Sent info of ${user.tag} (${user.id})`);
}

export const getCommand = () => ({ data, execute } as Partial<Command>);
