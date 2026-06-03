const { EmbedBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    id: 'acceptunbl',
    async execute(interaction, client) {
        const [_, targetId] = interaction.customId.split('_');

        const isBuyer = db.prepare("SELECT id FROM buyers WHERE guild_id = ? AND id = ?").get(interaction.guild.id, interaction.user.id);
        const judgeRows = db.prepare("SELECT role_id FROM judges WHERE guild_id = ?").all(interaction.guild.id);
        const isJudge = judgeRows.some(row => interaction.member.roles.cache.has(row.role_id));
        const isSuperOwner = interaction.user.id === interaction.guild.ownerId || interaction.user.id === 'ton id';

        if (!isBuyer && !isJudge && !isSuperOwner) {
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} pas pour toi`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
        }

        db.prepare("DELETE FROM blacklist WHERE user_id = ?").run(targetId);

        const containerComp = interaction.message.components.find(c => c.type === 15 || c.data?.type === 15);
        const textComponents = containerComp?.components || [];
        
        const infoText = textComponents.find(c => c.content && c.content.includes("- Membre visé"))?.content || "Informations non trouvées";

        const newContainer = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`# Demande Unblacklist`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(infoText))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`## Accepté par`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`<@${interaction.user.id}> \`\`${interaction.user.tag}\`\`\nid \`\`${interaction.user.id}\`\`\n`))
            .addSeparatorComponents((s) => s);

        await interaction.update({ 
            components: [newContainer],
            flags: MessageFlags.IsComponentsV2
        });

        const target = await client.users.fetch(targetId);
        try {
            await target.send(`ta demande de unbl a été acceptée par <@${interaction.user.id}> rejoint ici ${config.unbl_invite}`);
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
