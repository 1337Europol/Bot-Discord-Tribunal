const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const handlersPath = path.join(__dirname, '../handlers');
    if (!fs.existsSync(handlersPath)) return;

    ['button', 'modal'].forEach(type => {
        const dirPath = path.join(handlersPath, type);
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
        for (const file of files) {
            const handler = require(path.join(dirPath, file));
            if (handler.id) {
                if (type === 'button') client.buttons.set(handler.id, handler);
                else if (type === 'modal') client.modals.set(handler.id, handler);
            }
        }
    });

    // console.log(`load de ${client.buttons.size} button et handlers  et  ${client.modals.size} modal et handlers`);
};
