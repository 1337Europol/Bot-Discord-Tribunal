# Tribunal Bot

Bot Discord pour la gestion d'un système de tribunal communautaire avec blacklist/unblacklist

## Description

Ce bot permet de gérer un système de tribunal pour votre serveur Discord. Les membres peuvent demander des blacklists, les juges peuvent accepter ou refuser ces demandes, et un système de permissions avancé gère les différents rôles (buyers owners judges)

## Fonctionnalités

- **Système de Blacklist** : Demande de blacklist avec preuves
- **Système d'Unblacklist** : Demande de levée de blacklist
- **Gestion des Permissions** : Système hiérarchique (Super Owner > Owners > Buyers > Judges > Membres)
- **Base de données SQLite** : Stockage local des données
- **Interface Moderne** : Utilisation des composants Discord (boutons, modals, containers)
- **Logs Configurables** : Salons de logs personnalisables
- **Messages de Ban** : Message de ban personnalisable

## Prérequis

- **Node.js** v18 ou supérieur
- **npm** ou **yarn**
- Un compte Discord bot avec les intents suivants
  - Guilds
  - Guild Messages
  - Message Content
  - Guild Members
  - Guild Presences

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/1337Europol/Bot-Discord-Tribunal
cd tribunal
```

### 2. Installer les dépendances

```bash
npm install
```

Ou avec yarn

```bash
yarn install
```

### 3. Configurer le bot

Ouvrez le fichier `src/config/config.js` et configurez les éléments suivants

```javascript
module.exports = {
    token: 'VOTRE_TOKEN_BOT_ICI', // Token de votre bot Discord
    devBuyers: ['VOTRE_ID_DISCORD'], // Votre ID Discord (pour les permissions super admin)
    embedColor: parseInt('FFFFFF', 16), // Couleur des embeds (en hexadécimal)
    emojis: {
        success: '✅', // Emoji de succès
        error: '❌', // Emoji d'erreur
        warning: '⚠️', // Emoji d'avertissement
        create: '📝', // Emoji de création
        left: '⬅️', // Emoji bouton gauche
        right: '➡️', // Emoji bouton droite
        loading: '⏳', // Emoji de chargement
    },
    unbl_invite: 'https://discord.gg/VOTRE_SERVEUR' // Lien d'invitation pour les unblacklists
};
```

**Important** : Remplacez `'ton id'` par votre ID Discord partout dans le code où vous voyez cette mention.

### 4. Créer l'application Discord

1. Allez sur le [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application
3. Activez le bot et récupérez le token
4. Configurez les intents nécessaires dans le portal
5. Invitez le bot sur votre serveur avec le lien d'invitation

## Configuration Initiale

Une fois le bot démarré, vous devez configurer les salons et rôles :

### Définir le salon de logs

```bash
/setlogs <salon_logs>
```

Cette commande configure le salon où les logs seront envoyés.

### Définir le rôle de juge

```bash
/setrolejuge <rôle_juge>
```

Cette commande définit le rôle qui aura accès aux commandes de jugement.

### Définir le message de ban

```bash
/setbanmsg <message>
```

Cette commande configure le message envoyé aux utilisateurs blacklistés.

## Commandes

### Commandes Utilitaires (Tout le monde)

- `/help` - Affiche l'aide des commandes
- `/help <commande>` - Affiche les détails d'une commande spécifique
- `/demandebl <user> <raison> <preuve>` - Demande une blacklist
- `/demandeunbl <raison>` - Demande une unblacklist

### Commandes Buyers (Gestionnaires)

- `/bllist` - Liste des utilisateurs blacklistés
- `/clearbl` - Vide la blacklist
- `/judgelist` - Liste des juges
- `/setlogs <salon>` - Configure le salon de logs
- `/setrolejuge <rôle>` - Configure le rôle de juge
- `/setunbl <serveur>` - Configure le serveur pour unblacklist
- `/setbanmsg <message>` - Configure le message de ban
- `/unbl <user>` - Unblacklist un utilisateur
- `/unjudge <rôle>` - Retire un rôle de juge

### Commandes Owners (Propriétaires)

- `/owner <user>` - Ajoute un owner
- `/ownerlist` - Liste des owners
- `/unbuyer <user>` - Retire un buyer
- `/ununowner <user>` - Retire un owner

### Commandes Buyers (Gestion)

- `/buyer <user>` - Ajoute un buyer
- `/buyerlist` - Liste des buyers

## Système de Permissions

Le bot utilise un système de permissions hiérarchique :

1. **Super Owner** : Le propriétaire du serveur et l'ID configuré dans `devBuyers`
2. **Owners** : Gèrent les buyers et ont accès aux commandes owners
3. **Buyers** : Gèrent le système de blacklist et les juges
4. **Judges** : Peuvent accepter/refuser les demandes de blacklist
5. **Membres** : Peuvent faire des demandes de blacklist/unblacklist

## Base de Données

Le bot utilise SQLite avec les tables suivantes :

- **buyers** : Liste des buyers par serveur
- **owners** : Liste des owners par serveur
- **judges** : Liste des rôles de juges par serveur
- **config_logs** : Configuration des logs par serveur
- **blacklist** : Liste des utilisateurs blacklistés
- **unbl_requests** : Suivi des demandes d'unblacklist

La base de données est créée automatiquement au premier lancement dans `src/database/database.sqlite`.

## Utilisation

### Démarrer le bot

```bash
node index.js
```

Ou avec nodemon pour le développement

```bash
npm install -g nodemon
nodemon index.js
```

### Faire une demande de blacklist

1. Un membre utilise `/demandebl` avec l'utilisateur, la raison et une preuve
2. La demande est envoyée dans le salon configuré
3. Un juge peut accepter ou refuser via les boutons
4. Si accepté, l'utilisateur est ajouté à la blacklist

### Faire une demande d'unblacklist

1. Un utilisateur blacklisté utilise `/demandeunbl` avec sa raison
2. La demande est envoyée pour review
3. Un buyer peut accepter ou refuser la demande

## Structure du Projet

```
tribunal/
├── index.js                    # Point d'entrée
├── package.json                # Dépendances
├── src/
│   ├── client/
│   │   └── ExtendedClient.js   # Client Discord étendu
│   ├── commands/
│   │   ├── buyers/             # Commandes buyers
│   │   ├── owners/             # Commandes owners
│   │   └── util/               # Commandes utilitaires
│   ├── config/
│   │   └── config.js           # Configuration
│   ├── database/
│   │   └── db.js               # Base de données
│   ├── events/                 # Événements Discord
│   ├── handlers/               # Handlers (boutons, modals)
│   ├── interactions/           # Chargeurs de commandes/événements
│   └── utils/                  # Utilitaires
```

## Dépannage

### Le bot ne se connecte pas

- Vérifiez que le token dans `config.js` est correct
- Vérifiez que les intents sont activés dans le Discord Developer Portal
- Vérifiez que Node.js est installé (v18+)

### Les commandes ne fonctionnent pas

- Vérifiez que le bot a les permissions nécessaires sur le serveur
- Vérifiez que les salons de logs sont configurés
- Vérifiez que vous avez les permissions requises

### Erreur de base de données

- Vérifiez que le dossier `src/database` existe
- Vérifiez que `better-sqlite3` ou `bun:sqlite` est installé
- Supprimez `database.sqlite` pour recréer la base

## Notes Importantes

- Remplacez toutes les occurrences de `'ton id'` par votre ID Discord dans le code
- Configurez les emojis custom dans `config.js` si vous voulez utiliser vos propres emojis
- Le bot utilise le mode WAL pour la base de données pour de meilleures performances
- Les composants Discord (containers) nécessitent Discord.js v14+

---

## Support / Aide

Besoin d'aide, ajoute-moi sur Discord : **httpmethod**

---

## Contribution

Les contributions sont les bienvenues N'hésitez pas à ouvrir une issue ou un pull request

## Licence

Ce projet est fourni tel quel pour une utilisation communautaire

## Liens Utiles

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Développé pour la commu Discord**
