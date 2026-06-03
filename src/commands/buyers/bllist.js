const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const parser = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bllist')
        .setDescription('liste de la blacklist'),
    permissions: ['buyer'],
    async execute(interaction, client) {
        try {
            const rows = db.prepare('SELECT user_id, reason FROM blacklist WHERE guild_id = ?').all(interaction.guild.id);

            if (rows.length === 0) {
                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addTextDisplayComponents((td) => td.setContent(`> ${config.emojis.error} personne est blacklist`));

                return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            }

            const total = rows.length;
            const pagesNum = Math.ceil(total / 10);
            let currentPage = 0;

            const generateComponents = (page) => {
                const start = page * 10;
                const end = Math.min(start + 10, total);
                const chunk = rows.slice(start, end);
                const membersList = chunk.map(r => `- ${parser.user(r.user_id)} \`\`${r.user_id}\`\`\n  > Raison: \`\`${r.reason}\`\``).join('\n');

                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addSeparatorComponents((s) => s)
                    .addTextDisplayComponents((td) => td.setContent(`## Liste Blacklist`))
                    .addTextDisplayComponents((td) => td.setContent(`> Nombre total de blacklisté : ${total}`))
                    .addSeparatorComponents((s) => s)
                    .addTextDisplayComponents((td) => td.setContent(membersList))
                    .addSeparatorComponents((s) => s);

                container.addSectionComponents((section) => {
                    section.addTextDisplayComponents((td) => td.setContent(`Page **${page + 1}**/**${pagesNum}**`));
                    section.setButtonAccessory((btn) =>
                        btn.setCustomId('next_page_bl')
                            .setLabel('Suivant')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(pagesNum <= 1)
                    );
                    return section;
                });

                return [container];
            };

            await interaction.reply({
                components: generateComponents(currentPage),
                flags: MessageFlags.IsComponentsV2
            });

            if (pagesNum > 1) {
                const collector = interaction.channel.createMessageComponentCollector({
                    filter: i => i.user.id === interaction.user.id,
                    time: 60000
                });

                collector.on('collect', async i => {
                    if (i.customId === 'next_page_bl') {
                        if (currentPage < pagesNum - 1) {
                            currentPage++;
                        } else {
                            currentPage = 0;
                        }
                        await i.update({ components: generateComponents(currentPage), flags: MessageFlags.IsComponentsV2 });
                    }
                });
            }

        } catch (err) {
            console.error('probleme dans bllist', err);
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents((td) => td.setContent(`> ${config.emojis.error} ya un probleme`));

            interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true })
        }
    }
};
