const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commandsPath = path.join(__dirname, '../commands');
    if (!fs.existsSync(commandsPath)) return;

    fs.readdirSync(commandsPath).forEach(dir => {
        const dirPath = path.join(commandsPath, dir);
        if (!fs.statSync(dirPath).isDirectory()) return;

        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const command = require(path.join(dirPath, file));
            const name = command.data?.name || command.name;
            if (name) {
                command.category = dir;

                client.commands.set(name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => client.aliases.set(alias, name));
                }
            }
        }
    });
};
