module.exports = {
    parseId: (input) => {
        if (!input) return null;
        const match = input.match(/\d{17,20}/);
        return match ? match[0] : null;
    },

    user: (id) => `<@${id}>`,

    role: (id) => `<@&${id}>`,

    channel: (id) => `<#${id}>`,

    format: (id, type = 'user') => {
        if (type === 'role') return `<@&${id}>`;
        if (type === 'channel') return `<#${id}>`;
        return `<@${id}>`;
    },

    global: (text, values = {}) => {
        if (!text) return text || "";
        let result = text;

        result = result.replace(/\{(member|user|target):(\d{17,20})\}/g, '<@$2>');
        result = result.replace(/\{role:(\d{17,20})\}/g, '<@&$1>');
        result = result.replace(/\{channel:(\d{17,20})\}/g, '<#$1>');

        for (const [key, value] of Object.entries(values)) {
            const regex = new RegExp(`{${key}}`, 'gi');
            result = result.replace(regex, value);
        }

        return result;
    }
};

