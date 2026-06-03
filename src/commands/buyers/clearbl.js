const { SlashCommandBuilder, ContainerBuilder, MessageFlags, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const config = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearbl')
        .setDescription('clear la blacklist'),
    permissions: ['buyer'],
    async execute(interaction, client) {
        try {
            const rows = db.prepare("SELECT user_id FROM blacklist WHERE guild_id = ?").all(interaction.guild.id);
            const blacklistIds = new Set(rows.map(r => r.user_id));

            db.prepare("DELETE FROM blacklist WHERE guild_id = ?").run(interaction.guild.id);
            try {
                db.prepare("DELETE FROM unbl_requests").run();
            } catch (e) { }

            const inviteChannel = interaction.guild.channels.cache.find(c =>
                c.isTextBased() &&
                c.permissionsFor(client.user).has('CreateInstantInvite')
            ) || interaction.guild.channels.cache.find(c => c.isTextBased());

            const invite = await inviteChannel?.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null);

            const bans = await interaction.guild.bans.fetch().catch(() => new Map());
            let unbannedCount = 0;

            for (const row of rows) {
                const userId = row.user_id;
                if (bans.has(userId)) {
                    await interaction.guild.bans.remove(userId, `Clear Blacklist par ${interaction.user.tag}`).catch(() => { });
                }
                unbannedCount++;

                if (invite) {
                    const user = await client.users.fetch(userId).catch(() => null);
                    if (user) {
                        user.send(`T'as été unbl de **${interaction.guild.name}**. Voici une invite pour revenir ${invite.url}`).catch(() => { });
                    }
                }
            }


            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.success} blacklist clear et **${unbannedCount}** membres deban`));

            if (invite) {
                container.addSectionComponents((section) => {
                    section.addTextDisplayComponents((td) => td.setContent(`tiens une invite pour revenir`));
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
            console.error('probleme clearbl', err);
            const container = new ContainerBuilder()
                .setAccentColor(config.embedColor)
                .addTextDisplayComponents(td => td.setContent(`> ${config.emojis.error} ya eu un problème pendant le clear`));

            return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
        }
    }
};


