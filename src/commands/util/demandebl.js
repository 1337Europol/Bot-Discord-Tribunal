const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const { parseId } = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demandebl')
        .setDescription('demande de blacklist')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('id/ping membre')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('raison de la demande')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('preuve')
                .setDescription('proof')
                .setRequired(true)),
    permissions: ['everyone'],
    async execute(interaction, client) {
        const userInput = interaction.options.getString('user');
        const userId = parseId(userInput);
        const reason = interaction.options.getString('raison');
        const proof = interaction.options.getAttachment('preuve');

        if (!userId) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} membre incorrect`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        const logConfig = db.prepare("SELECT bl_submission_channel_id FROM config_logs WHERE guild_id = ? AND bl_submission_channel_id IS NOT NULL").get(interaction.guild.id);
        if (!logConfig) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} bot non config`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        const subChannel = client.channels.cache.get(logConfig.bl_submission_channel_id);
        if (!subChannel) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} salon donné incorrect`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        const target = await client.users.fetch(userId).catch(() => null);
        if (!target) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} membre incorrect`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        const container = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents((td) => td.setContent(`# Demande Blacklist`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Membre visé\n<@${target.id}> \`\`${target.tag}\`\`\nid \`\`${target.id}\`\``))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Soumis par \n<@${interaction.user.id}> \`\`${interaction.user.tag}\`\`\nid \`\`${interaction.user.id}\`\``))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`Raison \`\`${reason}\`\`\nServeur \`\`${interaction.guild.name}\`\`\nPreuve: [Clique ici](${proof.url})`))
            .addMediaGalleryComponents((gallery) => {
                gallery.addItems((item) => item.setURL(proof.url));
                return gallery;
            })
            .addSeparatorComponents((s) => s);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`acceptbl_${target.id}_${interaction.user.id}`).setLabel('Accepter').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`refusebl_${target.id}_${interaction.user.id}`).setLabel('Refuser').setStyle(ButtonStyle.Secondary)
        );

        await subChannel.send({
            components: [container, row],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] }
        });

        const successContainer = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} demande envoyé`));
        interaction.reply({ components: [successContainer], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
    }
};
