//const requireg = require('/home/ubuntu/.nvm/versions/node/v16.13.0/lib/node_modules/requireg');
const fs = require("fs");
const {
  Client,
  Collection,
  MessageEmbed,
  Intents
} = require("discord.js");
const {
  token,
  clientId,
  mongoPath
} = require("./config.json");

const MongoClient = require("mongodb").MongoClient;
let database;
const client = new MongoClient(
  mongoPath, {
    useNewUrlParser: true
  }, {
    useUnifiedTopology: true
  }
);
client.connect(() => {
  database = client.db("AmesulBot");
});

const bot = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.DIRECT_MESSAGES
  ],
  presence: {
    status: 'dnd',
    activities: [{
      name: '🔴 MAINTENANCE 🔴',
      type: 'PLAYING'
    }]
  }
});

//Welcome message
const welcome = new MessageEmbed()
  .setColor("#de7624")
  .setTitle("**BIENVENUE SUR LE SERVEUR D'AMESUL !**")
  .setURL("https://discord.gg/CJmCRJX")
  .setDescription(
    "Merci d'avoir rejoint le serveur ! On espère que t'y plairas, il y a plein de gens sympas avec qui discuter et toutes les infos concernant Twitch et Youtube ;)"
  )
  .setThumbnail(
    "https://static-cdn.jtvnw.net/jtv_user_pictures/143cfadd-a48d-4b2c-896b-59d64119e714-profile_image-70x70.png"
  )
  .addFields({
    name: "\u200B",
    value: "\u200B"
  }, {
    name: "*Règles*",
    value: "Tu trouveras toutes les règles dans le salon du même nom. Lis-les avec attention, elles ne sont pas là pour t'embêter, et il y a toutes les infos concernant le fonctionnement du serveur"
  }, {
    name: "*Comment avoir accès à l'intégralité du Discord*",
    value: "Lis d'abord les règles ^^"
  }, {
    name: "*Modérateurs*",
    value: "Si tu as le moindre problème n'hésites pas à envoyer un message privé à un modo, ou pose ta question sur le #général, on te répondra avec plaisir"
  }, {
    name: "*AmesulBot*",
    value: "Je suis le bot qui anime Twitch et Discord. La plupart de mes commandes sont utilisables sur les deux plateformes, et tu peux en trouver la liste en faisant /aide"
  }, {
    name: "\u200B",
    value: "\u200B"
  }, {
    name: "\u200B",
    value: "Réseaux"
  }, {
    name: "***Twitch***",
    value: "https://twitch.tv/amesul",
    inline: true
  }, {
    name: "***Twitter***",
    value: "https://twitter.com/amesul_",
    inline: true
  }, {
    name: "***Insta***",
    value: "https://instagram.com/_amesul",
    inline: true
  }, {
    name: "\u200B",
    value: "\u200B"
  })
  .setImage("")
  .setTimestamp()
  .setFooter(
    "Message généré automatiquement, ne pas répondre",
    "https://cdn.glitch.com/project-avatar/7d3df752-9c90-4bab-a8f0-9378ea157f8d.png?1591110829210"
  );

//COMMAND MAP
bot.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  bot.commands.set(command.data.name, command);
}

bot.commands = new Collection();
bot.commandsadmin = new Collection();
bot.commandsutility = new Collection();
bot.commandsothers = new Collection();

const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    bot.commands.set(command.data.name, command);
    if (folder == "admin") bot.commandsadmin.set(command.data.name, command);
    if (folder == "utility") bot.commandsutility.set(command.data.name, command);
    if (folder == "others") bot.commandsothers.set(command.data.name, command);
  }
}

//BOT LAUNCH
bot.once("ready", () => {
  console.log("Ready !");
});

//bot.user.setPresence()

const cooldowns = new Collection();

//COMMAND HANDLER
bot.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  const command = bot.commands.get(interaction.commandName);
  if (!command) return;

  //Command enable
  if (!command.enable) {
    return interaction.reply({
      content: "Cette commande est temporairement désactivée :/",
      ephemeral: true
    });
  }

  //
  if (command.permissions) {
    const authorPerms = interaction.channel.permissionsFor(interaction.user);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
      return interaction.reply({
        content: "Tu n'as pas la permission de faire ça !",
        ephemeral: true
      });
    }
  }

  //Cooldown
  if (!cooldowns.has(command.commandName)) {
    cooldowns.set(command.commandName, new Collection());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(command.commandName);
  const cooldownAmount = command.cooldown * 1000;
  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = expirationTime - now;

      function DateFormat(duration) {
        let seconds = Number(duration.toFixed(0) / 1000);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor((seconds % (3600 * 24)) / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);
        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
      }
      return interaction.reply({
        content: `Tu dois attendre ${DateFormat(
          timeLeft
        )} avant de pouvoir réutiliser cette commande !`,
        ephemeral: true
      });
    }
  }
  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  //Launch command
  try {
    await command.execute(bot, interaction, database);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true
    });
  }
});

//ACCUEIL NOUVEAUX MEMBRES
bot.on("guildMemberAdd", member => {
  member
    .send(welcome)
    .catch(() => console.log("Impossible d'envoyer le message privé"));
});

//HELLO
bot.on("messageCreate", message => {
  var user = message.author.id;
  var alea = Math.floor(Math.random() * 3);
  var hey_message = message.content.toLocaleLowerCase();

  if (
    message.mentions.users.first() == clientId &&
    (hey_message.includes(`bonjour`) ||
      hey_message.includes(`salut`) ||
      hey_message.includes(`hello`) ||
      hey_message.includes(`coucou`) ||
      hey_message.includes(`hey`))
  ) {
    if (alea == 0) {
      message.channel.send(`Coucou <@${user}> !`);
    }
    if (alea == 1) {
      message.channel.send(`Salut <@${user}> !`);
    }
    if (alea == 2) {
      message.channel.send(`Hello <@${user}> !`);
    }
    if (alea == 3) {
      message.channel.send(`Bien le bonjour <@${user}> !`);
    }
  }
});

//LOGIN
bot.login(token);