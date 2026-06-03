const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    id: 'refusebl',
    async execute(interaction, client) {
        const [_, targetId, submitterId] = interaction.customId.split('_');

        const isBuyer = db.prepare("SELECT id FROM buyers WHERE guild_id = ? AND id = ?").get(interaction.guild.id, interaction.user.id);
        const judgeRows = db.prepare("SELECT role_id FROM judges WHERE guild_id = ?").all(interaction.guild.id);
        const isJudge = judgeRows.some(row => interaction.member.roles.cache.has(row.role_id));
        const isSuperOwner = interaction.user.id === interaction.guild.ownerId || interaction.user.id === 'ton id';

        if (!isBuyer && !isJudge && !isSuperOwner) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} pas pour toi`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder().setCustomId(`modalrefusebl_${targetId}_${submitterId}`).setTitle('refus unbl');
        const reasonInput = new TextInputBuilder().setCustomId('refuseReason').setLabel('raison du refus').setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

        await interaction.showModal(modal);
    }
};
