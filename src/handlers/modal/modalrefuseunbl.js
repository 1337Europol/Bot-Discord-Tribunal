const { EmbedBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    id: 'modalrefuseunbl',
    async execute(interaction, client) {
        const [_, targetId] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('refuseReasonUnBL');

        const containerComp = interaction.message.components.find(c => c.type === 15 || c.data?.type === 15);
        const textComp = containerComp?.components?.map(c => c.content).join('\n') || "";

        const newContainer = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`# UnBlacklist Refusé`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(textComp.split('---')[1].trim()))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`## Refusé par`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`<@${interaction.user.id}> \`\`${interaction.user.tag}\`\`\nid \`\`${interaction.user.id}\`\`\n\n- Raison du refus\n\`\`${reason}\`\``))
            .addSeparatorComponents((s) => s);

        await interaction.update({ components: [newContainer] });

        const target = await client.users.fetch(targetId);
        try {
            await target.send(`ta demande d'unbl a été refusée raison ${reason} revient dans 3 heures`);
        } catch (e) { }

        const logConfig = db.prepare("SELECT log_channel_id FROM config_logs WHERE guild_id = ?").get(interaction.guild.id);
        if (logConfig && logConfig.log_channel_id) {
            const logChannel = client.channels.cache.get(logConfig.log_channel_id);
            if (logChannel) {
                logChannel.send({ components: [newContainer], flags: MessageFlags.IsComponentsV2 });
            }
        }
    }
};
