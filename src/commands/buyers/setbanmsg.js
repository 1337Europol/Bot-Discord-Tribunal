const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbanmsg')
        .setDescription('configurer le message de ban met le lien du serveur ban')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('le message avec le lien')
                .setRequired(true)),
    permissions: ['buyer'],
    async execute(interaction, client) {
        const msg = interaction.options.getString('message');

        db.prepare(`
            INSERT OR REPLACE INTO config_logs (guild_id, ban_message)
            VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET ban_message=excluded.ban_message
        `).run(interaction.guild.id, msg);

        const container = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} message de ban config`));
        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
};
