const { SlashCommandBuilder, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('affiche le help des commandes')
        .addStringOption(option => 
            option.setName('commande')
                .setDescription('voir les détails d\'une commande spécifiques')
                .setRequired(false)),
    permissions: ['everyone'],
    async execute(interaction, client) {
        try {
            const guildId = interaction.guild.id;
            const isBuyer = db.prepare("SELECT id FROM buyers WHERE guild_id = ? AND id = ?").get(guildId, interaction.user.id);
            const isOwner = db.prepare("SELECT id FROM owners WHERE guild_id = ? AND id = ?").get(guildId, interaction.user.id);
            const isSuperOwner = interaction.user.id === interaction.guild.ownerId || interaction.user.id === 'ton id';

            const checkPerm = (cmd) => {
                if (!cmd.permissions || cmd.permissions.includes('everyone')) return true;
                if (isSuperOwner) return true;
                if (isBuyer) return true;
                if (isOwner && cmd.permissions.includes('owner')) return true;
                return false;
            };

            const globalCmds = await client.application.commands.fetch();
            const getCmdId = (name) => {
                const found = globalCmds.find(c => c.name === name);
                return found ? found.id : '0';
            };

            const cmdName = interaction.options.getString('commande');
            if (cmdName) {
                const cmd = client.commands.get(cmdName.toLowerCase()) || client.commands.get(client.aliases.get(cmdName.toLowerCase()));
                if (!cmd || !checkPerm(cmd)) {
                    const container = new ContainerBuilder()
                        .setAccentColor(config.embedColor)
                        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`> ${config.emojis.error} Commande introuvable`));
                    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
                }

                const name = cmd.data?.name || cmd.name;
                const cmdId = getCmdId(name);
                const desc = cmd.data?.description || cmd.description || 'Aucune description';

                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`${config.emojis.create} **Commande: </${name}:${cmdId}>**`))
                    .addSeparatorComponents((separator) => separator)
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**Description:** ${desc}`))
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**Usage:** </${name}:${cmdId}>`))
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**Aliases:** ${cmd.aliases && cmd.aliases.length ? cmd.aliases.map(a => '\`' + a + '\`').join(', ') : 'Aucun'}`))
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`**Permissions:** ${cmd.permissions && cmd.permissions.length ? cmd.permissions.map(p => '\`' + p + '\`').join(', ') : 'Aucune'}`))
                    .addSeparatorComponents((separator) => separator);
                return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            }

            const categoriesMap = {};
            client.commands.forEach(cmd => {
                if (!checkPerm(cmd)) return;
                const category = cmd.category || 'util';
                if (!categoriesMap[category]) categoriesMap[category] = [];
                categoriesMap[category].push(cmd);
            });

            const categoryNames = Object.keys(categoriesMap);
            if (categoryNames.length === 0) {
                 const container = new ContainerBuilder()
                        .setAccentColor(config.embedColor)
                        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`> ${config.emojis.error} Aucune commande accessible`));
                return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2, ephemeral: true });
            }

            const categoryLabels = {
                'buyers': 'buyers',
                'owners': 'owners',
                'util': 'utils'
            };

            const pages = categoryNames.map(cat => {
                const label = categoryLabels[cat] || cat;
                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`${config.emojis.create} **Help ${label.toUpperCase()}**`))
                    .addSeparatorComponents((separator) => separator);

                categoriesMap[cat].forEach(c => {
                    const name = c.data?.name || c.name;
                    const cmdId = getCmdId(name);
                    const desc = c.data?.description || c.description || 'pas de description';
                    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent(`> </${name}:${cmdId}> - ${desc}`));
                });

                return container;
            });

            let currentPage = 0;
            const navigationRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_help').setEmoji(config.emojis.left).setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('next_help').setEmoji(config.emojis.right).setStyle(ButtonStyle.Secondary).setDisabled(pages.length <= 1)
            );

            await interaction.reply({ components: [pages[currentPage], navigationRow], flags: MessageFlags.IsComponentsV2 });

            const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) return i.reply({ content: "c'est pas pour toi", flags: MessageFlags.Ephemeral });

                if (i.customId === 'prev_help') currentPage--;
                if (i.customId === 'next_help') currentPage++;

                if (currentPage < 0) currentPage = pages.length - 1;
                if (currentPage >= pages.length) currentPage = 0;

                navigationRow.components[0].setDisabled(currentPage === 0);
                navigationRow.components[1].setDisabled(currentPage === pages.length - 1);

                await i.update({ components: [pages[currentPage], navigationRow], flags: MessageFlags.IsComponentsV2 });
            });

            collector.on('end', () => {
                navigationRow.components.forEach(btn => btn.setDisabled(true));
                interaction.editReply({ components: [pages[currentPage], navigationRow] }).catch(() => { });
            });

        } catch (err) {
            console.error(err);
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`> ${config.emojis.error} ya un probleme`));
            interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
    }
};
