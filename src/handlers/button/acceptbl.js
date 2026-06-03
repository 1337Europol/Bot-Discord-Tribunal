const { ContainerBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const parser = require('../../utils/parser');

module.exports = {
    id: 'acceptbl',
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

        const originalContainerData = interaction.message.components.find(row =>
            row.components?.some(c => c.content?.includes("# Demande Blacklist"))
        ) || interaction.message.components[0];

        if (!originalContainerData || !originalContainerData.components) {
            return interaction.reply({
                content: "probleme container pstrouvé",
                flags: MessageFlags.Ephemeral
            });
        }

        const rawComponents = originalContainerData.components;

        const textComp = rawComponents.map(c => c.content || "").join('\n');

        let proof = null;
        for (const comp of rawComponents) {
            const items = comp.items || comp.data?.items;
            if (items && items[0]?.url) {
                proof = items[0].url;
                break;
            }
        }

        if (!proof) {
            const proofMatch = textComp.match(/https?:\/\/\S+/g);
            if (proofMatch) proof = proofMatch[proofMatch.length - 1].replace(/\)$/, '');
        }

        const reasonLine = textComp.split('\n').find(l => l.includes('Raison')) || "";
        const reason = reasonLine.match(/\`\`(.*?)\`\`/)?.[1] || 'pas de raison';
        const guildLine = textComp.split('\n').find(l => l.includes('Serveur')) || "";
        const guildName = guildLine.match(/\`\`(.*?)\`\`/)?.[1] || interaction.guild.name;

        const target = await client.users.fetch(targetId).catch(() => null);
        const submitter = await client.users.fetch(submitterId).catch(() => null);

        db.prepare(`
            INSERT OR REPLACE INTO blacklist (user_id, reason, proof, author_id, guild_name)
            VALUES (?, ?, ?, ?, ?)
        `).run(targetId, reason, proof, submitterId, guildName);

        db.prepare('DELETE FROM unbl_requests WHERE user_id = ?').run(targetId);

        const newContainer = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents((td) => td.setContent(`# Blacklist Accepté`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Membre visé\n${parser.user(targetId)} \`\`${target?.tag || 'Inconnu'}\`\`\nid \`\`${targetId}\`\``))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Soumis par \n${parser.user(submitterId)} \`\`${submitter?.tag || 'Inconnu'}\`\`\nid \`\`${submitterId}\`\``))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`Raison \`\`${reason}\`\`\nServeur \`\`${guildName}\`\`\nPreuve: [Clique ici](${proof})`));

        if (proof) {
            newContainer.addMediaGalleryComponents((gallery) => {
                gallery.addItems((item) => item.setURL(proof));
                return gallery;
            });
        }

        newContainer.addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Accepté par ${parser.user(interaction.user.id)} \`\`${interaction.user.tag}\`\`\nid \`\`${interaction.user.id}\`\``))
            .addSeparatorComponents((s) => s);

        await interaction.update({
            components: [newContainer],
            flags: MessageFlags.IsComponentsV2
        });

        const member = await interaction.guild.members.fetch(targetId).catch(() => null);
        const configLogs = db.prepare("SELECT ban_message FROM config_logs WHERE guild_id = ?").get(interaction.guild.id);
        const banMsg = configLogs?.ban_message || `Ban de ${interaction.guild.name} raison ${reason}`;

        const dmContainer = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents((td) => td.setContent(`# Blacklist\n\n> ${banMsg}\n\n*Si tu penses que c'est une erreur tu peux faire une demande d'unblacklist avec le bouton en dessous*`))
            .addSeparatorComponents((s) => s);

        const dmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("unblreq")
                .setLabel("Faire une demande d'unblacklist")
                .setStyle(ButtonStyle.Secondary)
        );

        if (target) {
            await target.send({
                components: [dmContainer, dmRow],
                flags: MessageFlags.IsComponentsV2
            }).catch(() => { });
        }

        if (member) {
            await member.ban({ reason: `Blacklist ${reason}` }).catch(() => { });
        }

        const logConfig = db.prepare("SELECT log_channel_id FROM config_logs WHERE guild_id = ?").get(interaction.guild.id);
        if (logConfig && logConfig.log_channel_id) {
            const logChannel = client.channels.cache.get(logConfig.log_channel_id);
            if (logChannel) {
                logChannel.send({ components: [newContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => { });
            }
        }
    }
};
