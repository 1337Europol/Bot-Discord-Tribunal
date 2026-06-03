const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const { parseId } = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setrolejuge')
        .setDescription('ajouter un role de juge')
        .addStringOption(option =>
            option.setName('role')
                .setDescription('id/ping du role')
                .setRequired(true)),
    permissions: ['buyer'],
    async execute(interaction, client) {
        const input = interaction.options.getString('role');
        const roleId = parseId(input);

        if (!roleId) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} ping un role`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const exists = db.prepare('SELECT role_id FROM judges WHERE guild_id = ? AND role_id = ?').get(interaction.guild.id, roleId);
        if (exists) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} le role est déjà juge`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} jtrouve pas le role`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        db.prepare("INSERT INTO judges (guild_id, role_id) VALUES (?, ?)").run(interaction.guild.id, role.id);

        const container = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} role <@&${role.id}> est maintenant juge`));
        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
};
