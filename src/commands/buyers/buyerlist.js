const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const parser = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buyerlist')
        .setDescription('liste des buyers'),
    permissions: ['buyer'],
    async execute(interaction, client) {
        try {
            const guildId = interaction.guild.id;
            const rows = db.prepare('SELECT id FROM buyers WHERE guild_id = ?').all(guildId);

            if (rows.length === 0) {
                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addTextDisplayComponents((td) => td.setContent(`> ${config.emojis.error} personne est buyer`));

                return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            }

            const total = rows.length;
            const pagesNum = Math.ceil(total / 10);
            let currentPage = 0;

            const generateComponents = (page) => {
                const start = page * 10;
                const end = Math.min(start + 10, total);
                const chunk = rows.slice(start, end);
                const membersList = chunk.map(r => `- ${parser.user(r.id)} \`\`${r.id}\`\``).join('\n');


                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addSeparatorComponents((s) => s)
                    .addTextDisplayComponents((td) => td.setContent(`## Liste Buyer`))
                    .addTextDisplayComponents((td) => td.setContent(`> Vous pouvez maintenant consulter la liste des buyers\n> Nombre de membre étant buyer : ${total}`))
                    .addSeparatorComponents((s) => s)
                    .addTextDisplayComponents((td) => td.setContent(membersList))
                    .addSeparatorComponents((s) => s);

                container.addSectionComponents((section) => {
                    section.addTextDisplayComponents((td) => td.setContent(`Page **${page + 1}**/**${pagesNum}**`));
                    section.setButtonAccessory((btn) =>
                        btn.setCustomId('next_page_buyer')
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
                    if (i.customId === 'next_page_buyer') {
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
            console.error('probleme dans buyerlist', err);
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents((td) => td.setContent(`> ${config.emojis.error} ya un probleme`));

            interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true })
        }
    }
};
