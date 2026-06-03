const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ChannelType } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('config les salons de logs et soumission')
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('choisir la catégorie')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)),
    permissions: ['buyer'],
    async execute(interaction, client) {
        const category = interaction.options.getChannel('category');

        try {
            const logChannel = await interaction.guild.channels.create({
                name: 'logs tribunal',
                type: ChannelType.GuildText,
                parent: category.id
            });

            const submissionChannel = await interaction.guild.channels.create({
                name: 'soumission blacklist',
                type: ChannelType.GuildText,
                parent: category.id
            });

            db.prepare(`
                INSERT OR REPLACE INTO config_logs (guild_id, log_channel_id, bl_submission_channel_id)
                VALUES (?, ?, ?)
            `).run(interaction.guild.id, logChannel.id, submissionChannel.id);

            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} salons crée dans ${category.name}`))
                .addTextDisplayComponents(td => td.setContent(`> logs <#${logChannel.id}>`))
                .addTextDisplayComponents(td => td.setContent(`> soumissions <#${submissionChannel.id}>`));

            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (e) {
            console.error('erreur setlogs', e);
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} probleme creation`));
            interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }
    }
};
