const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const { parseId } = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ununowner')
        .setDescription('retirer un owner')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('id/ping membre')
                .setRequired(true)),
    permissions: ['owner'],
    async execute(interaction, client) {
        const input = interaction.options.getString('user');
        const userId = parseId(input);

        if (!userId) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} ping un membre`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const exists = db.prepare('SELECT id FROM owners WHERE guild_id = ? AND id = ?').get(interaction.guild.id, userId);

        if (!exists) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} <@${userId}> est pas owner`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        db.prepare('DELETE FROM owners WHERE guild_id = ? AND id = ?').run(interaction.guild.id, userId);

        const container = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} <@${userId}> plus owner`));
        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
};
