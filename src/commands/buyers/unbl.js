const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');
const parser = require('../../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unbl')
        .setDescription('enlever un membre de la blacklist')
        .addStringOption(option =>
            option.setName('user')
                .setDescription('id/ping membre')
                .setRequired(true)),
    permissions: ['buyer'],
    async execute(interaction, client) {
        try {
            const input = interaction.options.getString('user');
            const userId = parser.parseId(input);

            if (!userId) {
                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} dsl l'id est pas bon`));
                return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            }

            const exists = db.prepare('SELECT user_id FROM blacklist WHERE user_id = ?').get(userId);
            if (!exists) {
                const container = new ContainerBuilder()
                    .setAccentColor(config.embedColor)
                    .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} ce membre n'est pas dans la blacklist`));
                return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            }


            db.prepare('DELETE FROM blacklist WHERE user_id = ?').run(userId);
            try {
                db.prepare('DELETE FROM unbl_requests WHERE user_id = ?').run(userId);
            } catch (e) { }

            await interaction.guild.bans.remove(userId, `Unblacklist par ${interaction.user.tag}`).catch(() => { });

            const inviteChannel = interaction.guild.channels.cache.find(c =>
                c.isTextBased() &&
                c.permissionsFor(client.user).has('CreateInstantInvite')
            ) || interaction.guild.channels.cache.find(c => c.isTextBased());

            const invite = await inviteChannel?.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null);

            const user = await client.users.fetch(userId).catch(() => null);
            if (user && invite) {
                await user.send(`T'as été unbl de **${interaction.guild.name}**. tiens une invite pour revenir ${invite.url}`).catch(() => { });
            }


            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} ${parser.user(userId)} (\`\`${userId}\`\`) a été unbl et deban`));

            if (invite) {
                container.addSectionComponents((section) => {
                    section.addTextDisplayComponents((td) => td.setContent(`tiens une invite pour qu'il puisse revenir`));
                    section.setButtonAccessory((btn) =>
                        btn.setLabel('Rejoindre le serveur')
                            .setStyle(ButtonStyle.Link)
                            .setURL(invite.url)
                    );
                    return section;
                });
            }

            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });


        } catch (err) {
            console.error('probleme unbl', err);
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} ya un probleme`));
            interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
    }
};

