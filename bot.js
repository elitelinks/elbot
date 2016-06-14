"use strict";
//Requires
process.setMaxListeners(0);
var startTime = new Date();
const Discord = require("discord.js");
const Timer = require("timer.js");
const EventEmitter = require("events").EventEmitter;
const http = require('http');
const request = require("request");
const fs = require('fs-extra');
const google = require("google");
const Poker = require("./modules/poker");
const slot = require("./modules/slots");
const bank = require("./modules/bank")

//settings & data
var settings = require("./settings/settings.json"),
    triviaset = settings.trivia,
    devMode = settings.devmode, //set to false or remove in production
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;

var bankSet = fs.readJsonSync("./settings/bank.json");
//invoke bot
const bot = new Discord.Client({autoReconnect:true});

/*
Command Handler
*/

var cmdHandlr = (bot, msg, cmdTxt, suffix) => {
    var id = msg.author.id;
    var name = msg.author.name
    switch (cmdTxt) {
        // searches
        case "goog" :
        case "g" :
        case "google" : commands.google.process(bot, msg, suffix); break;
        case "syl" :
        case "syllables" :
        case "syllable" : commands.syllable.process(bot, msg, suffix); break;
        case "definition" :
        case "def" :
        case "define" : commands.define.process(bot, msg, suffix); break;
        case "weath" :
        case "weather" : commands.weather.process(bot, msg, suffix); break;

        //bank
        case "bank" : commands.bank.process(bot, msg, suffix); break;
        case "payday" :
        case "payout" :
        case "$" : bank.payday(bot, msg, suffix, id, name); break;

        //games
        case "slot": if(suffix === 'payout' || suffix === 'payouts') {
            bot.sendMessage(msg, '```' +
                '| Result      | Payout |\n' +
                '|-------------|--------|\n' +
                '| 777         | 777:1  |\n' +
                '| 3x Cherries | 4:1    |\n' +
                '| 3x Clovers  | 4:1    |\n' +
                '| 3x Beers    | 3:1    |\n' +
                '| 2x Cherries | 2:1    |\n' +
                '| 2x Any      | 1:1    |' + '```');
        } else slot(bot, msg, suffix); break;
        case "poker": if(suffix === 'payout' || suffix === 'payouts') {
            bot.sendMessage(msg, '```' +
                '| Hand                   | Payout |\n' +
                '|------------------------|--------|\n' +
                '| Natural Royal Flush    | 800:1  |\n' +
                '| Five of a Kind         | 200:1  |\n' +
                '| Wild Royal Flush       | 100:1  |\n' +
                '| Straight Flush         | 50:1   |\n' +
                '| Four of a Kind         | 20:1   |\n' +
                '| Full House             | 7:1    |\n' +
                '| Flush                  | 5:1    |\n' +
                '| Straight               | 3:1    |\n' +
                '| Three of a Kind        | 2:1    |\n' +
                '| Two Pair               | 1:1    |\n' +
                '| Pair (Jacks or Better) | 1:1    |' + '```');
        }
        else (() => {
            var id = msg.author.id;
            var poker = new Poker(bot, msg, suffix, id);
            poker.init();
            //poker.setMaxListeners(0);
            poker = null;
        })(); break;

        //fun stuff
        case "eight" :
        case "8" : commands.eight.process(bot, msg); break;
        case "tsa" : commands.tsa.process(bot, msg); break;
        case "orly" : commands.orly.process(bot, msg, suffix); break;
        case "ping" : bot.sendMessage(msg, "pong"); break;
        case "oodle": commands.oodle.process(bot, msg, suffix); break;

        //trivia
        case "trivia" : if (suffix === 'stop' && triviaSesh.gameon === true) {triviaSesh.end(bot, msg);}
            else trivia.start(bot, msg, suffix); break;

        case "help" :(Object.keys(commands).indexOf(suffix) > -1) ? bot.sendMessage(msg,
                `${commands[suffix].description} \n*Usage:* ${commands[suffix].usage} \n*Alias${commands[suffix].alias.length > 1 ? "es" : ""}:* \`${commands[suffix].alias.join(', ')}\``) :
            commands.help.process(bot, msg, suffix);
            break; 

        //admin controls
        case "eval" : commands.eval.process(bot, msg, cmdTxt, suffix); break;
        case "cache" :
        case "emptycache" : commands.emptycache.process(); break;
        case "logout" : commands.logout.process(bot, msg); break;
        default: break;
    }
};

/*
Commands
 */

var commands = {
    'google' : {
        'description'   : 'Search Google and get the first result.',
        'alias'         : ["goog", "g"],
        'usage'         : `\`${prefixes[0]}google [search term]\``,
        'process'       : (bot, msg, suffix) => {
            let search = "google";
            if(suffix){search = suffix;}
            google(search, (err, response) => {
                if(err || !response || !response.links || response.links.length < 1){bot.sendMessage(msg, `**Your search resulted in an error. Please forgive me ** ${msg.author.username}`, (error, sentMessage) => {bot.deleteMessage(sentMessage, {"wait": 5000})});}
                else {
                    if(response.links[0].link === null){
                        for(var i = 1; i < response.links.length; i++){
                            if (response.links[i].link !== null) {
                                bot.sendMessage(msg, `I searched for **\"${search}\"** and found this, **${msg.author.username}**\n${response.links[i].link}`);
                                return;
                            }
                        }
                    }
                    else {
                        bot.sendMessage(msg, `I searched for **\"${search}\"** and found this, **${msg.author.username}**\n${response.links[0].link}`);
                    }
                }
            })
        },
        'admin'         : false
    },

    'weather' : {
        'description'   : 'Search Google and get the first result.',
        'alias'         : ["weath"],
        'usage'         : `\`${prefixes[0]}weather [location]\``,
        'process'       : (bot, msg, suffix) => {
            if (!suffix) suffix = "Los Angeles, CA";
            if (suffix === "shit") suffix = "San Diego"; //kekeke
            suffix = suffix.replace(" ", "");
            var rURL = (/\d/.test(suffix) == false) ? `http://api.openweathermap.org/data/2.5/weather?q=${suffix}&APPID=${settings.weather_api_key}` : `http://api.openweathermap.org/data/2.5/weather?zip=${suffix}&APPID=${settings.weather_api_key}`;
            request(rURL, (error, response, weath) => {
                if (!error && response.statusCode == 200) {
                    weath = JSON.parse(weath);
                    if (!weath.hasOwnProperty("weather")) {
                        return;
                    }
                    var weatherC = ":sunny:";
                    if ((weath.weather[0].description.indexOf("rain") > -1) || (weath.weather[0].description.indexOf("drizzle") > -1)) {
                        weatherC = ":cloud_rain:";
                    }
                    else if (weath.weather[0].description.indexOf("snow") > -1) {
                        weatherC = ":snowflake:";
                    }
                    else if (weath.weather[0].description.indexOf("clouds") > -1) {
                        weatherC = ":cloud:";
                    }
                    else if (weath.weather[0].description.indexOf("storm") > -1) {
                        weatherC = ":cloud_lightning:";
                    }
                    var direction = Math.floor((weath.wind.deg / 22.5) + 0.5);
                    var compass = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
                    var msgArray = [];
                    var sunrise = new Date(weath.sys.sunrise * 1000);
                    var formattedSunrise = (sunrise.getHours()) + ':' + ("0" + sunrise.getMinutes()).substr(-2);
                    var sunset = new Date(weath.sys.sunset * 1000);
                    var formattedSunset = (sunset.getHours()) + ':' + ("0" + sunset.getMinutes()).substr(-2);
                    msgArray.push(`:earth_americas: __**Weather for ${weath.name}, ${weath.sys.country}:**__ • (*${weath.coord.lon}, ${weath.coord.lat}*)`);
                    msgArray.push(`**${weatherC}Current Weather Conditions:** ${weath.weather[0].description}`);
                    msgArray.push(`**:sweat: Humidity:** ${weath.main.humidity}% - **:cityscape:  Current Temperature:** ${Math.round(weath.main.temp - 273.15)}°C / ${Math.round(((weath.main.temp - 273.15) * 1.8) + 32)}°F`);
                    msgArray.push(`**:cloud: Cloudiness:** ${weath.clouds.all}% - **:wind_blowing_face:  Wind Speed:** ${weath.wind.speed} m/s [*${compass[(direction % 16)]}*]`);
                    msgArray.push(`**:sunrise_over_mountains:  Sunrise:** ${formattedSunrise} UTC / **:city_dusk: Sunset:** ${formattedSunset} UTC`);
                    bot.sendMessage(msg, msgArray);
                }
                else {
                    console.log(error);
                    bot.sendMessage(msg, "There was an error getting the weather, please try again later.",  (error, sentMessage) => {
                        bot.deleteMessage(sentMessage, {"wait": 5000})
                    });
                }
            });
        },
        'admin'         : false
    },

    'syllable' : {
        'description'   : 'Counts how many syllables are in a word.',
        'alias'         : ["syl, syllables"],
        'usage'         : `\`${prefixes[0]}syllable [word]\``,
        'process'       : (bot, msg, suffix) => {
            var endpoint = 'https://wordsapiv1.p.mashape.com/words/{{word}}/syllables';
            endpoint = endpoint.replace('{{word}}', encodeURIComponent(suffix));

            var options = {
                'url': endpoint,
                'headers': {
                    "X-Mashape-Key": `${settings.mashape_api_key}`,
                    "Accept": "application/json"
                }
            };

            request(options, (error, response, data) => {
                if (!error && response.statusCode == 200) {
                    data = JSON.parse(data);
                    if (!data.hasOwnProperty('syllables')) {
                        return;
                    }

                    var syllables = data.syllables.count;
                    bot.sendMessage(msg, `Syllables of ${suffix}: ${syllables}`);
                }
            });
        },
        'admin'         : false
    },

    'define' : {
        'description'   : 'Find definition(s) for a word.',
        'alias'         : ["def, definition"],
        'usage'         : `\`${prefixes[0]}define [word]\``,
        'process'       : (bot, msg, suffix) => {
            var endpoint = 'https://wordsapiv1.p.mashape.com/words/{{word}}/definitions';
            endpoint = endpoint.replace('{{word}}', encodeURIComponent(suffix.trim()));

            var options = {
                'url': endpoint,
                'headers': {
                    "X-Mashape-Key": `${settings.mashape_api_key}`,
                    "Accept": "application/json"
                }
            };
            try {
                request(options, (error, response, data) => {
                    if (!error && response.statusCode == 200) {
                        data = JSON.parse(data);
                        if (!data.hasOwnProperty('definitions')) {
                            return;
                        }

                        var definitions = data.definitions;

                        var msgArray = [`I found the following definitions for ${suffix}:`, "\n"];

                        var len = definitions.length;
                        for (i = 0; i < len; i++) {
                            var partOfSpeech = definitions[i].partOfSpeech;
                            var def = definitions[i].definition;
                            msgArray.push(`*${partOfSpeech}* | ${def}`);
                        }

                        bot.sendMessage(msg, msgArray);
                    }
                });
            } catch(err) {console.log(err); bot.sendMessage(msg, err)}
        },
        'admin'         : false
    },

    'eight' : {
        'description'   : 'Ask a question, receive an answer from the 8 ball.',
        'alias'         : ["eight"],
        'usage'         : `\`${prefixes[0]}8 [question]\``,
        'process'       : (bot, msg) => {
            var ball = [
                "Signs point to yes.",
                "Yes.",
                "Reply hazy, try again.",
                "Without a doubt.",
                "My sources say no.",
                "As I see it, yes.",
                "You may rely on it.",
                "Concentrate and ask again.",
                "Outlook not so good.",
                "It is decidedly so.",
                "Better not tell you now.",
                "Very doubtful.",
                "Yes - definitely.",
                "It is certain.",
                "Cannot predict now.",
                "Most likely.",
                "Ask again later.",
                "My reply is no.",
                "Outlook good.",
                "Don't count on it. "
            ];
            bot.reply(msg, ball[Math.floor(Math.random() * ball.length)]);
        },
        'admin'         : false
    },

    'oodle' : {
        'description': 'Oodle-fy your sentences.',
        'alias': ["none"],
        'usage': `\`${prefixes[0]}oodle [sentence]\``,
        'process': (bot, msg, suffix) => {
            let reply = suffix.replace(new RegExp(/[aeiou]/gi), 'oodle').toString();
            bot.reply(msg, reply);
        },
        'admin': false
    },

    'tsa' : {
        'description'   : 'The $100,000 command.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}8 [question]\``,
        'process'       : (bot, msg) => {
            var arrow = Math.round(Math.random());
            bot.reply(msg, (arrow === 1) ? ":arrow_left:" : ":arrow_right:")
        },
        'admin'         : false
    },

    'orly' : {
        'description'   : 'Generate a parody O\'Reilly book.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}orly [title, author, top text, middle text]\``,
        'process'       : (bot, msg, suffix) => { //TODO add choose color & animal option
            fs.ensureDir('./cache', function (err) {
                console.log(err || 'Cache folder created!'); // => null
                // dir has now been created, including the directory it is to be placed in
            });
            var randomstring = require('randomstring');
            var filename = (startTime.getMonth()+1).toString() + startTime.getDate().toString() + startTime.getFullYear().toString() + randomstring.generate(5);

            try {
                var orlyOpts = suffix.split(',');
                var title = encodeURIComponent(orlyOpts[0].trim());
                var author = orlyOpts[1] ? encodeURIComponent(orlyOpts[1].trim()) : "%20";
                var topTxt = orlyOpts[2] ? encodeURIComponent(orlyOpts[2].trim()) : "%20";
                var guideTxt = orlyOpts[3] ? encodeURIComponent(orlyOpts[3].trim()) : "The%20Definitive%20Guide";
                var imgCode = Math.floor(Math.random() * 40) + 1;
                var colorCode = Math.floor(Math.random() * 16);
                request.get(`https://orly-appstore.herokuapp.com/generate?title=${title}&top_text=${topTxt}&author=${author}&image_code=${imgCode}&theme=${colorCode}&guide_text=${guideTxt}&guide_text_placement=bottom_right`)
                    .pipe(fs.createWriteStream(`./cache/${filename}.png`))
                    .on('close', () => {bot.sendFile(msg, `./cache/${filename}.png`)});
            } catch(err) {
                console.log(err);
            }
        },
        'admin'         : false
    },

    'trivia': {
        'description'   : 'Start a trivia session. (still in alpha, needs testing)',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}trivia [listname] or [list] to get a list of categories\``,
        'process'       : (bot, msg, suffix) => {trivia.start(bot, msg, suffix);},
        'admin'         : false
    },

    'bank' : {
        'description' : `Bank functions. \`${prefixes[0]}bank register\` to start an account`,
        'alias' : ['none'],
        'usage' : `\`${prefixes[0]}bank [command] or [list] to get a list of commands\``,
        'process' : (bot, msg, suffix) => {bank.init(bot, msg, suffix)},
        'admin' : false
    },

    'help' : {
        'description'   : 'Get help for a command.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}help [command]\``,
        'process'       : (bot, msg) => {
            var cmds = Object.keys(commands);
            bot.sendMessage(msg, `__**Available commands**__\n\`${cmds.join(', ')}\`\n\n*For more specific help*, type \`${prefixes[0]}help [command]\``);
        },
        'admin'         : false
    },
//admin
    'eval' : {
        'description'   : 'Start a trivia session.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}eval js (admin only, use at your own risk!)\``,
        'process'       : (bot, msg, cmdTxt, suffix) => {
            if (settings.owners.indexOf(msg.author.id) > -1) {
                try {
                    var thing = eval(suffix.toString());
                    bot.sendMessage(msg, `\`\`\`javascript\n${thing}\`\`\``);
                } catch(e) {
                    console.log(e);
                    bot.sendMessage(msg, `\`\`\`Error: ${e}\`\`\``);
                }
            } else {
                return;
            }
        },
        'admin'         : true
    },

    'emptycache' : {
        'description'   : 'Empties local cache.',
        'alias'         : ["cache"],
        'usage'         : `\`${prefixes[0]}emptycache (admin only)\``,
        'process'       : ()=> {
            if (settings.owners.indexOf(msg.author.id) > -1) {
                fs.emptyDir('./cache', function (err) {
                    if (!err) console.log(err)
                });
            }
        },
        'admin'         : true
    },

    'logout' : {
        'description'   : 'Logs me out.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}logout (admin only)\``,
        'process'       : (bot, msg) => {
            if (settings.owners.indexOf(msg.author.id) > -1) {
                bot.sendMessage(msg, "Logging Out").then(bot.logout());
            } else {return;}
        },
        'admin'         : true
    }
};

//Trivia
//Trivia commands TODO combine trivia & triviasesh
var trivia = {
    categories : fs.readdirSync(triviaset.path),

    list : (bot, msg) => {
        var catTxt = trivia.categories.map((x) => {return x.slice(0, -5)}).join(' ');
        bot.sendMessage(msg, `Trivia categories available are:\n\`\`\`${catTxt}\`\`\``);
    },

    start : (bot ,msg, suffix) => {
        var t = trivia;
        if (suffix === 'skip') {
            if (triviaSesh.gameon === false) {return;}
            else {triviaSesh.loop(bot, msg);}
        }
        else if (triviaSesh.gameon === true) {bot.sendMessage(msg,"There is already a trivia session in place!"); }
        else if (!suffix || suffix === 'help') {return;} //TODO help function
        else if (!suffix || suffix === 'list') {t.list(bot, msg);}
        else if (t.categories.indexOf(suffix+".json") > -1) {triviaSesh.begin(bot, msg, suffix);}
        else {bot.sendMessage(msg, `No list with the name ${suffix}`); }
    }
};

//Trivia Session
var triviaSesh = {
    gameon : false,
    scorelist : {},
    currentList : [],
    currentQuestion : {},
    used : [],
    timer : new Timer(),
    topscore: 0,
    count : 0,
    countdown : new Timer(),

    loadlist : (bot, msg, suffix) => {
        var t = triviaSesh;
        t.currentList = fs.readJsonSync(`${triviaset.path}/${suffix}.json`);
        console.log(`${suffix}.json loaded!`); 
    },

    loadQuestion : () => {
        var t = triviaSesh;
        if (t.currentList === []) {console.log('List not loaded!'); return;}
        var questionCheck = Math.floor(Math.random() * t.currentList.length);
        if (t.used.indexOf(questionCheck) <= -1) {
            t.currentQuestion = t.currentList[questionCheck];
            t.used.push(questionCheck);
            console.log('Used Question #s ' + t.used);
        } else t.loadQuestion();
    },

    addPoint : (bot, msg) => {
        var t = triviaSesh;
        var winner = msg.author.name;
        if (t.scorelist[winner] > t.topscore) {t.topscore = t.scorelist[winner]}
        if (!t.scorelist[winner]) {t.scorelist[winner] = 1;}
        else t.scorelist[winner] ++;
        if (t.scorelist[winner] > t.topscore){t.topscore = t.scorelist[winner]}
        triviaSesh.countdown.start(triviaset.timeout).on('end', function() {
            t.end(bot, msg);
        })
    },

    round : (bot, msg) => {
        try {
            var t = triviaSesh;
            var trivTimer = t.timer;
            t.loadQuestion();
            var answers = t.currentQuestion.answers.map((x)=>x.toLowerCase());

            var botAnswers = (bot, msg) => {
                bot.sendMessage(msg, `The answer is **${t.currentQuestion.answers[0]}**!`);
                trivTimer.stop();
                trivTimer.start(1).on('end', function(){t.loop(bot,msg);});
            };

            bot.sendMessage(msg, `**Question #${t.count}**\n${t.currentQuestion["question"]}`);
            bot.on("message", (msg) => {
                var guess = msg.content.toLowerCase();
                var num = answers.indexOf(guess);
                if (num > -1) {
                    bot.sendMessage(msg, `Right answer ${msg.author.name}! ${t.currentQuestion.answers[num]}!`);
                    t.addPoint(bot, msg);
                    trivTimer.stop();
                    trivTimer.start(1).on('end', function(){t.loop(bot,msg);});
                }
            });
            trivTimer.stop();
            trivTimer.start(triviaset.delay).on('end', () => {botAnswers(bot, msg)});

        } catch(err) {console.log(err)}
    },

    loop : (bot, msg) => {
        var t = triviaSesh;
        t.currentQuestion = {};
        if (t.topscore >= triviaset.maxScore) {t.end(bot, msg); }
        else {
            t.count++;
            t.round(bot, msg);
        }
    },

    begin : (bot, msg, suffix) => {
        var t = triviaSesh;
        t.loadlist(bot, msg, suffix);
        t.loop(bot ,msg);
        t.gameon = true;
        triviaSesh.countdown.start(triviaset.timeout).on('end', function(){
            t.end(bot, msg);
        })
    },

    end : (bot, msg) => {
        var t = triviaSesh;
        t.timer.stop();
        var sortable = [];
        for (var score in t.scorelist) {
            sortable.push([score, t.scorelist[score]])
        }
        sortable.sort((a,b) => b[1] - a[1]);
        var str = sortable.join('\n').replace(/,/g, ": ");
        bot.sendMessage(msg, `Trivia Ended!\n\__**Scores:**__\n\`\`\`${str ? str : 'No one had points!'}\`\`\``);
        t.gameon = false;
        t.scorelist = {};
        t.currentList = [];
        t.currentQuestion = {};
        t.used = [];
        t.count = 0;
        triviaSesh.countdown.stop();
    }
};

//Useful Functions
var getUser = (bot, msg, suffix) => {};

//msg checker
bot.on("message", (msg) => {
    if(msg.author === bot.user || msg.channel.isPrivate) {return;}
    else if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
        var cmdTxt = msg.content.split(' ')[0].substr(1);
        var sufArr = msg.content.split(' '); sufArr.splice(0, 1);
        var suffix = sufArr.join(' ');
        cmdHandlr(bot, msg, cmdTxt, suffix);
    }
    else return;
});
//Ready
bot.on("ready", ()=>{
    bot.setPlayingGame(`${devMode ? 'in development' : 'v0.0.5'}`);
    console.log(`EL bot${devMode ? '(DEV)' : ''} is ready`);
});

bot.on("disconnected", ()=> {process.exit(0);});

//Login
if (settings.token || settings.dev_token) {bot.loginWithToken(devMode ? settings.dev_token : settings.token);console.log("Logged in using Token");}
else {bot.login(settings.email, settings.password);console.log("Logged in using Email")}


