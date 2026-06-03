const { ActivityType, Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {

    await client.registerSlashCommands();

    client.user.setPresence({
      activities: [{
        name: 'Custom Status',
        type: 4,
        state: `>3`,
      }],
      status: 'idle',
    });

  }
};
