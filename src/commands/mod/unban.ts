import { oneLine } from "common-tags";
import {
	PermissionsBitField,
	type ChatInputApplicationCommandData,
	type ChatInputCommandInteraction
} from "discord.js";
import { CaseTypes } from "../../constants/database.js";
import { MAX_AUDIT_REASON_LEN } from "../../constants/index.js";
import CaseManager from "../../database/CaseManager.js";
import { e } from "../../emojis/index.js";
import type Logger from "../../loggers/index.js";
import { ConfirmationButtons } from "../../modules/ButtonManager.js";
import { type Command, type CommandOptions } from "../../typings/index.js";
import { bold } from "../../utils/discordMarkdown.js";
import { appendPrefixAndSuffix, createList } from "../../utils/index.js";
import { reason, user } from "./noread.sharedCommandOptions.js";

const options: Partial<CommandOptions> = { private: true };

const data: ChatInputApplicationCommandData = {
	name: "unban",
	description: "Unbans a user",
	options: [user(true), reason("unban")]
};

async function execute(
	intr: ChatInputCommandInteraction<"cached">,
	logger: Logger
) {
	const target = intr.options.getUser("user", true);
	const reason = intr.options.getString("reason");

	if (
		!intr.guild.members.me?.permissions.has(
			PermissionsBitField.Flags.BanMembers
		)
	) {
		intr.editReply(e`{cross} I don't have permissions to unban users`);

		return;
	}

	const ban = await intr.guild.bans.fetch(target.id).catch(() => null);

	if (!ban) {
		intr.editReply(e`{cross} The user to target is not banned`);

		return;
	}

	const auditLogSuffix = `| By ${intr.user.tag} ${intr.user.id}`;

	const auditLogReason = reason
		? appendPrefixAndSuffix(reason, {
				maxLen: MAX_AUDIT_REASON_LEN,
				suffix: auditLogSuffix
		  })
		: `By ${intr.user.tag} ${intr.user.id}`;

	const info = createList({
		Reason: reason ?? "No reason provided",
		Target: `${target.tag} (${target.id})`
	});

	const query = `${oneLine(e`
			{warning} Are you sure you want to unban
			${bold(target.tag)} (${target.id})?
		`)}\n\n${info}`;

	const collector = new ConfirmationButtons({ authorId: intr.user.id }) //
		.setInteraction(intr)
		.setQuery(query);

	collector
		.start({ noReply: true })
		.then(() => {
			intr.guild.members
				.unban(target.id, auditLogReason)
				.then(async () => {
					const cases = new CaseManager(intr.client, intr.guildId);

					const case_ = await cases.createCase(
						{
							expirationTimestamp: null,
							logMessageURL: null,
							modId: intr.user.id,
							modTag: intr.user.tag,
							reason,
							referencedCaseId: null,
							targetId: target.id,
							targetTag: target.tag,
							type: CaseTypes.Unban
						},
						{ channelLog: true }
					);

					logger.logInteraction(
						`Unbanned ${target.tag} (${target.id}) ${
							reason
								? `with reason: "${reason}"`
								: "with no reason provided"
						}`
					);

					intr.editReply({
						content: `${oneLine(e`
							{check} Successfully ${bold`unbanned ${target.tag}`}
							(${target.id}) in case ${bold`#${case_.id}`}
						`)}\n\n${info}`,
						components: []
					});
				})
				.catch(() => {
					intr.editReply({
						content: e`{cross} Failed to unban ${target.tag} (${target.id})\n\n${info}`,
						components: []
					});
				});
		})
		.catch(() => {
			intr.editReply({
				content: e`{check} Gotcha. Command cancelled`,
				components: []
			});
		});
}

export const getCommand = () =>
	({
		data,
		options,
		execute
	} as Partial<Command>);
