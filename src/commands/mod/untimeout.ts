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
import {
	appendPrefixAndSuffix,
	createList,
	fullDate
} from "../../utils/index.js";
import { reason, user } from "./noread.sharedCommandOptions.js";

const options: Partial<CommandOptions> = { wip: true };

const data: ChatInputApplicationCommandData = {
	name: "untimeout",
	description: "Removes the timeout from a user",
	options: [
		user(true), //
		reason("time-out")
	]
};

function execute(intr: ChatInputCommandInteraction<"cached">, logger: Logger) {
	const target = intr.options.getMember("user");
	const reason = intr.options.getString("reason");
	const expiration = target?.communicationDisabledUntilTimestamp;

	if (
		!intr.guild.members.me?.permissions.has(
			PermissionsBitField.Flags.ModerateMembers
		)
	) {
		intr.editReply(e`{cross} I don't have permissions to untimeout users`);

		return;
	}

	if (!target) {
		intr.editReply(
			e`{cross} The user to target was not found in this server`
		);

		return;
	}

	if (!expiration) {
		intr.editReply(e`{cross} The user to target is not in a timeout`);

		return;
	}

	if (target.id === intr.guild.ownerId) {
		intr.editReply(
			e`{cross} The user to target is the owner of this server`
		);

		return;
	}

	const info = createList({
		Expiration: fullDate(expiration),
		Reason: reason ?? "No reason provided",
		Target: `${target.user.tag} (${target} ${target.id})`
	});

	const query = `${oneLine(e`
			{warning} Are you sure you want to untimeout
			${bold(target.user.tag)} (${target.id})?
		`)}\n\n${info}`;

	const collector = new ConfirmationButtons({ authorId: intr.user.id }) //
		.setInteraction(intr)
		.setQuery(query);

	const auditLogSuffix = `| By ${intr.user.tag} ${intr.user.id}`;

	const auditLogReason = reason
		? appendPrefixAndSuffix(reason, {
				maxLen: MAX_AUDIT_REASON_LEN,
				suffix: auditLogSuffix
		  })
		: `By ${intr.user.tag} ${intr.user.id}`;

	collector
		.start({ noReply: true })
		.then(() => {
			target
				.disableCommunicationUntil(null, auditLogReason)
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
							targetTag: target.user.tag,
							type: CaseTypes.Untimeout
						},
						{ channelLog: true }
					);

					intr.editReply({
						content: `${oneLine(
							e`{check} Successfully ${bold("removed timeout")} on
							${bold(target.user.tag)} (${target.id}) in
							case ${bold`#${case_.id}`}`
						)}\n\n${info}`,
						components: []
					});

					logger.logInteraction(
						`Removed timeout of ${target.user.tag} (${target.id}) with reason: ${reason}`
					);
				})
				.catch(() => {
					intr.editReply({
						content: e`{cross} I failed to remove timeout of ${target.user.tag} (${target.id})\n\n${info}`,
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
		options,
		data,
		execute
	} as Partial<Command>);
