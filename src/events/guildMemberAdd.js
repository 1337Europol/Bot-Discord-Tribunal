const db = require('../database/db');
const parser = require('../utils/parser');

module.exports = {
    name: 'guildMemberAdd',
    async execute(client, member) {
        const blacklist = db.prepare("SELECT * FROM blacklist WHERE guild_id = ? AND user_id = ?").get(member.guild.id, member.id);

        if (blacklist) {
            const configLogs = db.prepare("SELECT ban_message FROM config_logs WHERE guild_id = ?").get(member.guild.id);
            let banMsg = configLogs?.ban_message || `blacklist du serveur {reason}`;
            
            banMsg = parser.global(banMsg, {
                user: member.id,
                reason: blacklist.reason,
                guild: member.guild.name
            });


            try {
                await member.send(banMsg).catch(() => { });
                await member.ban({ reason: `Blacklist ${blacklist.reason}` });
            } catch (error) {
                console.error('probleme ban auto', error);
            }
        }
    }
};
