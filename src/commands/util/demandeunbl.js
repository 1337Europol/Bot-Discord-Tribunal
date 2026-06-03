const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demandeunbl')
        .setDescription('demande de unblacklist'),
    permissions: ['everyone'],
    async execute(interaction, client) {
        const isBlacklisted = db.prepare("SELECT * FROM blacklist WHERE user_id = ?").get(interaction.user.id);
        if (!isBlacklisted) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} pas blacklist`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const lastRequest = db.prepare("SELECT last_request_time FROM unbl_requests WHERE user_id = ?").get(interaction.user.id);
        const cooldown = 3 * 60 * 60 * 1000;
        if (lastRequest && (Date.now() - lastRequest.last_request_time) < cooldown) {
            const timeLeft = Math.round((cooldown - (Date.now() - lastRequest.last_request_time)) / 1000 / 60);
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} attend encore ${timeLeft} min`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const mainConfig = db.prepare("SELECT unbl_submission_channel_id FROM config_logs WHERE unbl_submission_channel_id IS NOT NULL LIMIT 1").get();
        if (!mainConfig) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} la partie est pas encore config`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const subChannel = client.channels.cache.get(mainConfig.unbl_submission_channel_id);
        if (!subChannel) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} salon de submit unbl introuvable`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const container = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`# Demande Unblacklist`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Membre visé\n<@${interaction.user.id}> \`\`${interaction.user.tag}\`\`\nid \`\`${interaction.user.id}\`\`\n\nRaison initiale \`\`${isBlacklisted.reason}\`\`\nServeur d'origine \`\`${isBlacklisted.guild_name}\`\``))
            .addSeparatorComponents((s) => s);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`acceptunbl_${interaction.user.id}`).setLabel('Accepter').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`refuseunbl_${interaction.user.id}`).setLabel('Refuser').setStyle(ButtonStyle.Secondary)
        );

        await subChannel.send({ components: [container, row], flags: MessageFlags.IsComponentsV2 });

        db.prepare("INSERT OR REPLACE INTO unbl_requests (user_id, last_request_time) VALUES (?, ?)").run(interaction.user.id, Date.now());

        const successContainer = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} demande envoyé`));
        interaction.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2, ephemeral: true });
    }
};
