const QuickChart = require('quickchart-js');
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    Collection
} = require('discord.js')
const {
    SlashCommandBuilder
} = require('@discordjs/builders');
module.exports = {
    permissions: "ADMINISTRATOR",
    enable: true,
    cooldown: 0,
    data: new SlashCommandBuilder()
        .setName('sondage')
        .setDescription('Créer un sondage dans le serveur')
        .addStringOption(option =>
            option.setName('titre')
            .setDescription('Le titre du sondage')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('choix')
            .setDescription('Les choix du sondage, séparés par un "/", sans espace')
            .setRequired(true))
        .addBooleanOption(option =>
            option.setName('multiple_answers')
            .setDescription('Pour autoriser ou non plusieurs réponses possibles')
            .setRequired(false))
        .addNumberOption(option =>
            option.setName('time')
            .setDescription('Durée du sondage en heure(s)')
            .setRequired(false)),
    async execute(bot, interaction, database) {
        //Declare ChartJS
        const currentChart = new QuickChart();
        const resultsChart = new QuickChart();

        //Store answers
        const sondageAnswers = new Object();
        sondageAnswers.users = new Collection();
        sondageAnswers.votes = new Collection();
        sondageAnswers.votesSize = 0;

        //Store user input
        const sondageInfos = new Object();
        sondageInfos.title = interaction.options.get('titre');
        sondageInfos.choices = interaction.options.get('choix').value.split('/');
        sondageInfos.time = interaction.options.get('time') || 48;
        sondageInfos.multipleAnswers = interaction.options.get('multiple_answers') || true;

        //Embed
        const embedText = new MessageEmbed()
            .setColor('AQUA')
            .setTitle(sondageInfos.title.value)
            .setDescription(`Un sondage a été lancé par ${interaction.user}\nVous avez ${sondageInfos.time.value} heure(s) pour y répondre et ${(sondageInfos.multipleAnswers.value) ? 'plusieurs réponses sont possibles' : 'une seule réponse est acceptée'}  !`)
            .setTimestamp();

        //Buttons
        const buttonsRow = new MessageActionRow();
        for (let index = 0; index < parseInt(sondageInfos.choices.length); index++) {
            buttonsRow.addComponents(
                new MessageButton()
                .setCustomId('button_' + index)
                .setLabel(sondageInfos.choices[index])
                .setStyle('PRIMARY'),
            );
            eval(`sondageAnswers.button_${index} = new Collection();`)
            sondageAnswers.votes.set(sondageInfos.choices[index], 0)
        }

        //Reply
        interaction.reply({
            content: `Le sondage est bien lancé ${interaction.user}`,
            ephemeral: true
        })
        interaction.channel.send({
            content: '@everyone',
            embeds: [embedText],
            components: [buttonsRow]
        }).then(m => {
            const answersCollector = m.createMessageComponentCollector({
                componentType: "BUTTON",
                time: sondageInfos.time.value * 3600 * 1000
            });
            answersCollector.on("collect", i => {
                let voteReply;
                if (!sondageInfos.multipleAnswers.value && sondageAnswers.users.has(i.user)) voteReply = 'Tu ne peux voter qu\'une seule fois !';
                else if (eval(`sondageAnswers.${i.customId}.has(i.user.username)`)) voteReply = 'Tu ne peux pas voter deux fois pour la même réponse !';
                else {
                    voteReply = `Ton vote (${i.component.label}) a été pris en compte !`;
                    sondageAnswers.users.set(i.user, `Last vote : ${i.customId}`)
                    eval(`sondageAnswers.${i.customId}.set(i.user.username, i.user.id)`)
                    eval(`sondageAnswers.votes.set('${i.component.label}', sondageAnswers.${i.customId}.size);`);
                    sondageAnswers.votesSize++
                }
                i.reply({
                    content: voteReply,
                    ephemeral: true
                })
                let currentSkippedArray = [];
                sondageAnswers.votes.sort((valueA, valueB) => valueB - valueA);
                CreateBorder(sondageAnswers.votes.size, sondageAnswers.votes.filter(value => value == 0).size, currentSkippedArray);
                let currentMainBorderStyle = CreateBorderBis(sondageAnswers.votesSize, sondageAnswers.votes.first());
                const currentSortResults = new Promise((resolve) => {
                    resolve(currentrResults = {
                        keys: Array.from(sondageAnswers.votes.keys()),
                        values: Array.from(sondageAnswers.votes.values()),
                        percent: Array.from(sondageAnswers.votes.values(), x => x / sondageAnswers.votesSize * 100),
                        fill: Array.from(sondageAnswers.votes.values(), x => 100 - x / sondageAnswers.votesSize * 100)
                    })
                });
                currentSortResults.then(r => {
                    currentChart
                        .setConfig({
                            responsive: true,
                            type: 'bar',
                            options: {
                                indexAxis: 'y',
                                elements: {
                                    bar: {
                                        borderRadius: {
                                            topLeft: 10,
                                            topRight: 10,
                                            bottomLeft: 10,
                                            bottomRight: 10
                                        }
                                    },
                                },
                                layout: {
                                    padding: {
                                        top: 5,
                                        left: 5,
                                        right: 5,
                                        bottom: 5
                                    },
                                },
                                scales: {
                                    x: {
                                        ticks: {
                                            backdropPadding: 20
                                        },
                                        min: 0,
                                        max: 100,
                                        display: false,
                                    },
                                    y: {
                                        display: false,
                                    },
                                },
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    title: {
                                        display: false
                                    },
                                    datalabels: {
                                        clip: true,
                                        labels: {
                                            title: {
                                                formatter: function (value, context) {
                                                    return context.chart.data.labels[context.dataIndex];
                                                },
                                                anchor: 'start',
                                                align: 'right',
                                            },
                                            value: {
                                                formatter: function (value, context) {
                                                    if (value == 0) return;
                                                    else return `${Number.parseInt(value)}%`; // (${r.values} votes)
                                                },
                                                anchor: 'end',
                                                align: 'start',
                                            },
                                        },
                                        padding: {
                                            left: 20,
                                            right: 20
                                        },
                                        color: '#fff',
                                        font: {
                                            size: 14
                                        },
                                    },
                                }
                            },
                            data: {
                                labels: r.keys,
                                datasets: [{
                                        borderSkipped: currentMainBorderStyle,
                                        barPercentage: 1,
                                        categoryPercentage: 0.6,
                                        label: 'Votes',
                                        data: r.percent,
                                        backgroundColor: '#7B7B7B',
                                        stack: 'group1'
                                    },
                                    {
                                        datalabels: {
                                            display: false,
                                        },
                                        borderSkipped: currentSkippedArray,
                                        barPercentage: 1,
                                        categoryPercentage: 0.6,
                                        data: r.fill,
                                        backgroundColor: '#202020',
                                        stack: 'group1'
                                    }
                                ]
                            },
                        })
                        .setWidth(500)
                        .setHeight(sondageAnswers.votes.size * 75)
                        .setVersion('3.6.0')
                        .setBackgroundColor('transparent');
                    embedText.setImage(currentChart.getUrl())
                    m.edit({
                        embeds: [embedText]
                    })
                });
            });

            answersCollector.on('end', () => {
                let colorsRGB = [];
                let skippedArray = [];
                sondageAnswers.votes.sort((valueA, valueB) => valueB - valueA);
                CreateColor(sondageAnswers.votes.filter(value => value == sondageAnswers.votes.first()).size, colorsRGB, true);
                CreateColor(sondageAnswers.votes.filter(value => value < sondageAnswers.votes.first()).size, colorsRGB, false);
                CreateBorder(sondageAnswers.votes.size, sondageAnswers.votes.filter(value => value == 0).size, skippedArray);
                let mainBorderStyle = CreateBorderBis(sondageAnswers.votesSize, sondageAnswers.votes.first());
                console.log(mainBorderStyle);
                const sortResults = new Promise((resolve) => {
                    resolve(results = {
                        keys: Array.from(sondageAnswers.votes.keys()),
                        values: Array.from(sondageAnswers.votes.values()),
                        percent: Array.from(sondageAnswers.votes.values(), x => x / sondageAnswers.votesSize * 100),
                        fill: Array.from(sondageAnswers.votes.values(), x => 100 - x / sondageAnswers.votesSize * 100)
                    })
                });
                sortResults.then(r => {
                    resultsChart
                        .setConfig({
                            responsive: true,
                            type: 'bar',
                            options: {
                                indexAxis: 'y',
                                elements: {
                                    bar: {
                                        borderRadius: {
                                            topLeft: 10,
                                            topRight: 10,
                                            bottomLeft: 10,
                                            bottomRight: 10
                                        }
                                    },
                                },
                                layout: {
                                    padding: {
                                        top: 5,
                                        left: 5,
                                        right: 5,
                                        bottom: 5
                                    },
                                },
                                scales: {
                                    x: {
                                        ticks: {
                                            backdropPadding: 20
                                        },
                                        min: 0,
                                        max: 100,
                                        display: false,
                                    },
                                    y: {
                                        display: false,
                                    },
                                },
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                    title: {
                                        display: false,
                                    },
                                    datalabels: {
                                        clip: true,
                                        labels: {
                                            title: {
                                                formatter: function (value, context) {
                                                    return context.chart.data.labels[context.dataIndex];
                                                },
                                                anchor: 'start',
                                                align: 'right',
                                            },
                                            value: {
                                                formatter: function (value, context) {
                                                    if (value == 0) return;
                                                    else return `${Number.parseInt(value)}%`; // (${r.values} votes)
                                                },
                                                anchor: 'end',
                                                align: 'start',
                                            },
                                        },
                                        padding: {
                                            left: 20,
                                            right: 20
                                        },
                                        color: '#fff',
                                        font: {
                                            size: 14
                                        },
                                    },
                                }
                            },
                            data: {
                                labels: r.keys,
                                datasets: [{
                                        borderSkipped: mainBorderStyle,
                                        barPercentage: 1,
                                        categoryPercentage: 0.6,
                                        label: 'Votes',
                                        data: r.percent,
                                        backgroundColor: colorsRGB,
                                        stack: 'group1'
                                    },
                                    {
                                        datalabels: {
                                            display: false,
                                        },
                                        borderSkipped: skippedArray,
                                        barPercentage: 1,
                                        categoryPercentage: 0.6,
                                        data: r.fill,
                                        backgroundColor: '#202020',
                                        stack: 'group1'
                                    }
                                ]
                            },
                        })
                        .setWidth(500)
                        .setHeight(sondageAnswers.votes.size * 75)
                        .setVersion('3.6.0')
                        .setBackgroundColor('transparent');
                    embedText.setImage(resultsChart.getUrl())
                    buttonsRow.components.forEach(e => e.setDisabled(true));
                    m.edit({
                        embeds: [embedText],
                        components: [buttonsRow]
                    })
                });
            });
        });
        //Chart functions
        function CreateColor(size, array, type) {
            if (type) {
                for (let i = 0; i < size; i++) {
                    array.push('#28CD87')
                }
            } else {
                for (let i = 0; i < size; i++) {
                    array.push('#7B7B7B')
                }
            }
        }

        function CreateBorder(total, zero, array) {
            for (let i = 0; i < total - zero; i++) {
                array.push('start')
            }
            for (let i = 0; i < zero; i++) {
                array.push(false)
            }
        };

        function CreateBorderBis(total, hundred) {
            if (hundred == total) return false;
            else return 'end';
        }
    },
};