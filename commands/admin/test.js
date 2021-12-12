const {
	SlashCommandBuilder
} = require('@discordjs/builders');
module.exports = {
	permissions: "ADMINISTRATOR",
	enable: true,
	cooldown: 0,
	name: 'test',
	description: 'Debug command. Restricted use to Amesul',
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('*Debug command.*\n**Restricted use to Amesul**'),
	async execute(bot, interaction, database) {
		return interaction.reply('*Debug command.*\n**Restricted use to Amesul**');
	},
};