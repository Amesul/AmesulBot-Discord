const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu
} = require("discord.js");

module.exports = {
  permissions: "SEND_MESSAGES",
  enable: true,
  cooldown: 300,
  data: new SlashCommandBuilder()
    .setName("verified")
    .setDescription("Pour obtenir les droits"),
  async execute(bot, interaction, database) {
    const verifiedRole = interaction.guild.roles.cache.get(
      "669585205404893214"
    );
    //EMBEDS
    const confirmation = new MessageEmbed()
      .setColor("#1B65BF")
      .setTitle(`Ta demande de droits`)
      .setDescription(
        "La modération va traiter ta demande d'accès. Ne t'inquiète pas si ça prend un peu de temps, on fait ça au cas par cas !"
      );
    const demande = new MessageEmbed()
      .setColor("#1B65BF")
      .setTitle("Demande d'accès")
      .setFields(
        {
          name: "Membre",
          value: `<@${interaction.user.id}>`
        },
        {
          name: "Discord Tag",
          value: interaction.user.tag
        },
        {
          name: "Statut de la demande",
          value: "En attente..."
        }
      )
      .setImage(interaction.user.displayAvatarURL())
      .setTimestamp();

    //BUTTONS
    const buttons = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId("accept")
          .setLabel("Accepter")
          .setStyle("SUCCESS")
      )
      .addComponents(
        new MessageButton()
          .setCustomId("deny")
          .setLabel("Refuser")
          .setStyle("DANGER")
      );
    const reasonSelector = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("reasonSelector")
        .setPlaceholder("Quelle est la raison du refus ?")
        .addOptions([
          { label: "Pseudo non conforme", value: "Pseudo non conforme" },
          {
            label: "Photo de profil offensante",
            value: "Photo de profil offensante"
          },
          {
            label: "Compte banni sur Twitch/un autre serveur",
            value: "Compte banni sur Twitch/un autre serveur"
          },
          { label: "Une autre raison", value: "Une autre raison" }
        ])
    );

    //REPLY
    if (interaction.channelId === "912095667663540294") {
      interaction.reply({ embeds: [confirmation], ephemeral: true });

      //Interface modos
      bot.channels.cache
        .get(`864795268519952404`)
        .send({ embeds: [demande], components: [buttons] })
        .then(m => {
          // Create a message component interaction collector
          const decisionCollector = m.createMessageComponentCollector({
            componentType: "BUTTON",
            max: 1,
            time: 24 * 3600 * 1000
          });
          decisionCollector.on("collect", i => {
            if (i.customId === "deny") {
              AddReasonSelector(m).then(reasonSelected => {
                EditEmbed(m, i, interaction.user, i.user, reasonSelected);
                SendDeniedMessage(interaction.user, reasonSelected);
              });
              return;
            }
            interaction.member.roles.add(verifiedRole);
            EditEmbed(m, i, interaction.user, i.user);
          });
        });
    } else
      interaction.reply({
        content:
          "La commande n'est utilisable que dans le salon <#912095667663540294>",
        ephemeral: true
      });

    //EN CAS DE REFUS
    function AddReasonSelector(message) {
      return new Promise(resolve => {
        setTimeout(() => {
          message.edit({ components: [buttons, reasonSelector] });
        }, 3000);
        const decisionCollector = message.createMessageComponentCollector({
          componentType: "SELECT_MENU",
          max: 1,
          time: 300 * 1000
        });
        decisionCollector.on("collect", selection => {
          resolve(selection.values[0]);
        });
      });
    }

    function SendDeniedMessage(user, reason) {
      const deniedMessage = new MessageEmbed()
        .setColor("#FF6666")
        .setTitle("Un modérateur a rejeté ta demande de droits")
        .setDescription(reason);
      const rules = new MessageActionRow().addComponents(
        new MessageButton()
          .setURL(
            "https://discord.com/channels/669573393645043712/733060523024842834/864810018720055296"
          )
          .setLabel("Les règles du serveur")
          .setStyle("LINK")
      );
      user.send({ embeds: [deniedMessage], components: [rules] });
    }

    //GESTION DU MESSAGE
    function EditEmbed(message, button, user, moderator, reason) {
      let color;
      let description;
      if (button.customId == "accept") {
        color = "#31ea69";
        description = `Demande acceptée par ${moderator}`;
      } else {
        color = "#FF6666";
        description = `Demande refusée par ${moderator}, pour la raison suivante :\n__*${reason}*__`;
      }
      demande.setColor(color).setFields(
        {
          name: "Membre",
          value: `<@${user.id}>`
        },
        {
          name: "Discord Tag",
          value: user.tag
        },
        {
          name: "Statut de la demande",
          value: description
        }
      );
      buttons.components.forEach(element => element.setDisabled(true));
      message.edit({ embeds: [demande], components: [buttons] });
    }
  }
};
