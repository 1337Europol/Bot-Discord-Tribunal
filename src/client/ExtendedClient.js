const { Client, GatewayIntentBits, Collection, DefaultWebSocketManagerOptions, REST, Routes } = require('discord.js');
const db = require('../database/db');
const config = require('../config/config.js');

class ExtendedClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences
            ],
            allowedMentions: { parse: [] }
        });

        this.commands = new Collection();
        this.aliases = new Collection();
        this.buttons = new Collection();
        this.modals = new Collection();
        this.config = config;
        this.db = db;
    }

    async start() {
        require('../utils/anticrash')(this);
        require('../interactions/loadCommands')(this);
        require('../interactions/loadEvents')(this);
        require('../interactions/loadHandlers')(this);

        this.login(this.config.token).catch(err => {
            console.error('probleme de co', err);
        });
    }

    async registerSlashCommands() {
        const commands = this.commands.filter(cmd => cmd.data).map(cmd => cmd.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(this.config.token);

        try {
            console.log('jsend les slash');
            await rest.put(
                Routes.applicationCommands(this.user.id),
                { body: commands }
            );
            console.log('slash send');
        } catch (error) {
            console.error('probleme enregistrer', error);
        }
    }
}

DefaultWebSocketManagerOptions.identifyProperties.browser = 'Discord iOS';

module.exports = { ExtendedClient };
