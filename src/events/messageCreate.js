const { ContainerBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.author || message.author.bot || !message.guild) return;

        const prefix = client.config.prefix || '.';
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        if (!commandName) return;

        const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
        if (!command) return;

        const isBuyer = client.db.prepare("SELECT * FROM buyers WHERE guild_id = ? AND id = ?").get(message.guild.id, message.author.id);
        const isOwner = client.db.prepare("SELECT * FROM owners WHERE guild_id = ? AND id = ?").get(message.guild.id, message.author.id);
        const isSuperOwner = message.author.id === message.guild.ownerId || message.author.id === 'ton id';

        let canExecute = false;
        if (!command.permissions || command.permissions.includes('everyone')) {
            canExecute = true;
        } else {
            if (command.permissions.includes('buyer') && (isBuyer || isOwner || isSuperOwner)) canExecute = true;
            if (command.permissions.includes('owner') && (isOwner || isSuperOwner)) canExecute = true;
        }

        if (!canExecute) return;

        try {
            await command.execute(message, client, args);
        } catch (err) {
            console.error('probleme commande', err);
        }
    }
};
