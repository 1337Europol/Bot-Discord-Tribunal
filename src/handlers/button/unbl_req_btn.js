const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

const v2Ephemeral = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

function errContainer(text) {
    return new ContainerBuilder()
        .setAccentColor(config.embedColor)
        .addTextDisplayComponents((td) => td.setContent(text));
}

module.exports = {
    id: 'unblreq',
    async execute(interaction, client) {
        const replyErr = async (text) => {
            const payload = { components: [errContainer(text)], flags: v2Ephemeral };
            if (interaction.deferred) return interaction.editReply(payload).catch((e) => console.error('unblreq editReply', e));
            return interaction.reply(payload).catch((e) => console.error('unblreq reply', e));
        };

        try {
            const isBlacklisted = db.prepare("SELECT * FROM blacklist WHERE user_id = ?").get(interaction.user.id);

            if (!isBlacklisted) {
                return replyErr(`> ${config.emojis.error} t'es pas dans la blacklist`);
            }

            const lastRequest = db.prepare("SELECT last_request_time FROM unbl_requests WHERE user_id = ?").get(interaction.user.id);
            const cooldown = 3 * 60 * 60 * 1000;

            if (lastRequest && (Date.now() - lastRequest.last_request_time) < cooldown) {
                const timeLeft = Math.round((cooldown - (Date.now() - lastRequest.last_request_time)) / 1000 / 60);
                return replyErr(`> ${config.emojis.error} attends encore ${timeLeft} minutes`);
            }

            const mainConfig = db.prepare("SELECT unbl_submission_channel_id FROM config_logs WHERE unbl_submission_channel_id IS NOT NULL LIMIT 1").get();

            if (!mainConfig) {
                return replyErr(`> ${config.emojis.error} la partie du systeme est pas config`);
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            let subChannel = client.channels.cache.get(mainConfig.unbl_submission_channel_id);
            if (!subChannel) {
                subChannel = await client.channels.fetch(mainConfig.unbl_submission_channel_id).catch(() => null);
            }

            if (!subChannel) {
                return replyErr(`> ${config.emojis.error} jtrouve pas le salon de unbl`);
            }

            const userLabel = interaction.user.globalName || interaction.user.username;
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addSeparatorComponents((s) => s)
                .addTextDisplayComponents((td) => td.setContent(`# Demande Unblacklist`))
                .addSeparatorComponents((s) => s)
                .addTextDisplayComponents((td) => td.setContent(`- Membre visé\n<@${interaction.user.id}> \`\`${userLabel}\`\`\nid \`\`${interaction.user.id}\`\`\n\nRaison initiale \`\`${isBlacklisted.reason}\`\`\nServeur d'origine \`\`${isBlacklisted.guild_name || 'Inconnu'}\`\``))
                .addSeparatorComponents((s) => s);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`acceptunbl_${interaction.user.id}`).setLabel('Accepter').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`refuseunbl_${interaction.user.id}`).setLabel('Refuser').setStyle(ButtonStyle.Secondary)
            );

            await subChannel.send({
                components: [container, row],
                flags: MessageFlags.IsComponentsV2
            });

            db.prepare("INSERT OR REPLACE INTO unbl_requests (user_id, last_request_time) VALUES (?, ?)").run(interaction.user.id, Date.now());

            const successContainer = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addSeparatorComponents((s) => s)
                .addTextDisplayComponents((td) => td.setContent('# Demande envoyée'))
                .addSeparatorComponents((s) => s)
                .addTextDisplayComponents((td) => td.setContent(`${config.emojis.success} Ta demande d'unblacklist a été envoyée avec succès !`));

            return interaction.editReply({
                components: [successContainer],
                flags: v2Ephemeral
            }).catch((e) => console.error('unblreq success editReply', e));

        } catch (error) {
            console.error('problmeme dans le handler unblreq', error);
            return replyErr('> ya un probleme');
        }
    }
};
