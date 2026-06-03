const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ChannelType } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const { parseId } = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setunbl')
        .setDescription('config le salon unbl')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('id/ping salon')
                .setRequired(true)),
    permissions: ['buyer'],
    async execute(interaction, client) {
        const input = interaction.options.getString('channel');
        const channelId = parseId(input);

        if (!channelId) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} ping un salon`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const channel = interaction.guild.channels.cache.get(channelId);
        if (!channel) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} le salon existe pas`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        db.prepare(`
            INSERT OR REPLACE INTO config_logs (guild_id, unbl_submission_channel_id)
            VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET unbl_submission_channel_id=excluded.unbl_submission_channel_id
        `).run(interaction.guild.id, channelId);

        const container = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} salon unbl config <#${channelId}>`));
        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
};
