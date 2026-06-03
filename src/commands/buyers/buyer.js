const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const { parseId } = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buyer')
        .setDescription('ajouter un buyer')
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
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} le membre existe pas`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        const exists = db.prepare('SELECT id FROM buyers WHERE guild_id = ? AND id = ?').get(interaction.guild.id, userId);

        if (exists) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} <@${userId}> est déjà buyer`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        db.prepare('INSERT INTO buyers (guild_id, id) VALUES (?, ?)').run(interaction.guild.id, userId);

        const container = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} <@${userId}> ajouté aux buyers`));
        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
};
