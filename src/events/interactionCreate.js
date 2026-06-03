const { ContainerBuilder, MessageFlags } = require('discord.js');
const db = require('../database/db');
const config = require('../config/config');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            const isBuyer = interaction.guild ? db.prepare("SELECT id FROM buyers WHERE guild_id = ? AND id = ?").get(interaction.guild.id, interaction.user.id) : false;
            const isOwner = interaction.guild ? db.prepare("SELECT id FROM owners WHERE guild_id = ? AND id = ?").get(interaction.guild.id, interaction.user.id) : false;
            const isSuperOwner = (interaction.guild && interaction.user.id === interaction.guild.ownerId) || interaction.user.id === 'ton id';

            let canExecute = false;
            if (!command.permissions || command.permissions.includes('everyone')) {
                canExecute = true;
            } else if (interaction.guild) {
                if (command.permissions.includes('buyer')) {
                    if (isBuyer || isSuperOwner) canExecute = true;
                } else if (command.permissions.includes('owner')) {
                    if (isOwner || isBuyer || isSuperOwner) canExecute = true;
                }
            }

            if (!canExecute) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isButton() || interaction.isModalSubmit()) {
            console.log(`Interaction reçue : ${interaction.customId} de ${interaction.user.tag}`);
            const [action] = interaction.customId.split('_');
            const handler = interaction.isButton() ? client.buttons.get(action) : client.modals.get(action);
            
            if (handler) {
                try {
                    await handler.execute(interaction, client);
                } catch (error) {
                    console.error(error);
                }
            } else {
                console.log(`ya pas dehandler trouvé pour l'action ${action}`);
            }
        }
    }
};
