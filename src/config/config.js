

// Ici tu mets tes emojis custom de ton bot, biensûr tu peux faire un système meilleur et + opti que celui la

 // exemple : const emoji_succes = '<a:Check:1488945651533353020>'; 


const emoji_succes = ''; 
const emoji_erreur = '';
const emoji_warn = '';
const emoji_create = '';
const emoji_gauche = ''; // bouton
const emoji_droite = ''; // bouton
const emoji_loading = '';

const EMBED_COLOR = 'FFFFFF'; // ici met une couleur pour les embeds si tu veux changer
const devBuyers = ['ton id']; // l'id qui permettra de tout faire pour les devs biensur ya owners et buyers / très different d'eux

module.exports = {
    token: 'ton token du bot', // biensur ici tu déclares en haut les emojis et tu les definis dans "emojis: {"
    devBuyers: devBuyers,
    embedColor: parseInt(EMBED_COLOR, 16),
    emojis: {
        success: emoji_succes,
        error: emoji_erreur,
        warning: emoji_warn,
        create: emoji_create,
        left: emoji_gauche,
        right: emoji_droite,
        loading: emoji_loading,
    },
    unbl_invite: 'ton serveur discord' // lien d'invite exemple https://discord.gg/tonserveur

    // partout ou ya "const isSuperOwner" ainsi que "ton id" tu mets toujours ton id.
};

