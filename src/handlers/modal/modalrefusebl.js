const { EmbedBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    id: 'modalrefusebl',
    async execute(interaction, client) {
        const [_, targetId, submitterId] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('refuseReason');

        const originalContainerData = interaction.message.components.find(row =>
            row.components?.some(c => c.content?.includes("# Demande Blacklist"))
        ) || interaction.message.components[0];

        if (!originalContainerData || !originalContainerData.components) {
            return interaction.reply({
                content: "probleme container de la demande pas trouvé la vie",
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

        const reasonOrigLine = textComp.split('\n').find(l => l.includes('Raison')) || "";
        const reasonOrig = reasonOrigLine.match(/\`\`(.*?)\`\`/)?.[1] || 'pas de raison';

        const target = await client.users.fetch(targetId).catch(() => null);
        const submitter = await client.users.fetch(submitterId).catch(() => null);

        const newContainer = new ContainerBuilder()
            .setAccentColor(config.embedColor)
            .addTextDisplayComponents((td) => td.setContent(`# Blacklist Refusé`))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Membre visé\n<@${targetId}> \`\`${target?.tag || 'Inconnu'}\`\`\nid \`\`${targetId}\`\``))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Soumis par \n<@${submitterId}> \`\`${submitter?.tag || 'Inconnu'}\`\`\nid \`\`${submitterId}\`\``))
            .addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`Raison \`\`${reasonOrig}\`\`\nPreuve: [Clique ici](${proof})`));

        if (proof) {
            newContainer.addMediaGalleryComponents((gallery) => {
                gallery.addItems((item) => item.setURL(proof));
                return gallery;
            });
        }

        newContainer.addSeparatorComponents((s) => s)
            .addTextDisplayComponents((td) => td.setContent(`- Refusé par <@${interaction.user.id}> \`\`${interaction.user.tag}\`\`\nid \`\`${interaction.user.id}\`\`\n\n- Raison \`\`${reason}\`\``))
            .addSeparatorComponents((s) => s);

        await interaction.update({
            components: [newContainer],
            flags: MessageFlags.IsComponentsV2
        });

        const logConfig = db.prepare("SELECT log_channel_id FROM config_logs WHERE guild_id = ?").get(interaction.guild.id);
        if (logConfig && logConfig.log_channel_id) {
            const logChannel = client.channels.cache.get(logConfig.log_channel_id);
            if (logChannel) {
                logChannel.send({ components: [newContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => { });
            }
        }
    }
};
