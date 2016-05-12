'use strict'
const http = require('http');
const request = require("request");
const fs = require('fs-extra');
const google = require("google");
const Poker = require("./poker");
const slot = require("./slots");
const bank = require("./bank");
const trivia = require("./trivia");
var startTime = new Date();

var settings = require("../settings/settings.json"),
    triviaset = settings.trivia,
    devMode = settings.devmode,
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;

var bankSet = fs.readJsonSync("./settings/bank.json");

function Commands() {

    this.google = {
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
    };

    this.weather = {
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
    };

    this.syllable = {
        'description'   : 'Counts how many syllables are in a word.',
        'alias'         : ["syl, syllables"],
        'usage'         : `\`${prefixes[0]}syllable [word]\``,
        process(bot, msg, suffix) {
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
                    if (!syllables) {bot.sendMessage(msg `Something went wrong with the syllable request!`); return;}
                    bot.sendMessage(msg, `Syllables of ${suffix}: ${syllables}`);
                }
            });
        },
        'admin'         : false
    };

    this.define = {
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
    };

    this.eight =  {
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
    };

    this.tsa =  {
        'description'   : 'The $100,000 command.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}8 [question]\``,
        'process'       : (bot, msg) => {
            var arrow = Math.round(Math.random());
            bot.reply(msg, (arrow === 1) ? ":arrow_left:" : ":arrow_right:")
        },
        'admin'         : false
    };

    this.orly =  {
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
    };

    this.trivia =  {
        'description'   : 'Start a trivia session. (still in alpha, needs testing)',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}trivia [listname] or [list] to get a list of categories\``,
        'process'       : (bot, msg, suffix) => {trivia.start(bot, msg, suffix);},
        'admin'         : false
    };

    this.bank = {
        'description' : `Bank functions. \`${prefixes[0]}bank register\` to start an account`,
        'alias' : ['none'],
        'usage' : `\`${prefixes[0]}bank [command] or [list] to get a list of commands\``,
        'process' : (bot, msg, suffix) => {bank.init(bot, msg, suffix)},
        'admin' : false
    };

    this.help =  {
        'description'   : 'Get help for a command.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}help [command]\``,
        'admin' : false,
        process : (bot, msg, suffix) => {
            if (!suffix || suffix === 'list') {
                var cmds = Object.keys(this).filter(x=> {
                    if (this[x]['admin'] === false) return x;
                });
                bot.sendMessage(msg, `__**Available commands**__\n\`${cmds.join(', ')}\`\n\n*For more specific help*, type \`${prefixes[0]}help [command]\``);
            } else {
                bot.sendMessage(msg,
                    `${this[suffix].description} \n*Usage:* ${this[suffix].usage} \n*Alias${this[suffix].alias.length > 1 ? "es" : ""}:* \`${this[suffix].alias.join(', ')}\``)
            }
        }
    };
    
    /* ADMIN COMMANDS */
    
    this.ev =  {
        'description'   : 'Evaluates a message',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}eval js (admin only, use at your own risk!)\``,
        'process'       : (bot, msg, suffix) => {
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
    };

    this.emptycache = {
        'description'   : 'Empties local cache.',
        'alias'         : ["cache"],
        'usage'         : `\`${prefixes[0]}emptycache (admin only)\``,
        'process'       : (bot, msg)=> {
            if (settings.owners.indexOf(msg.author.id) > -1) {
                fs.emptyDir('./cache', function (err) {
                    if (err) console.log(err)
                });
            }
        },
        'admin'         : true
    };

    this.logout = {
        'description'   : 'Logs me out.',
        'alias'         : ["none"],
        'usage'         : `\`${prefixes[0]}logout (admin only)\``,
        'process'       : (bot, msg) => {
            if (settings.owners.indexOf(msg.author.id) > -1) {
                bot.sendMessage(msg, "Logging Out").then(bot.logout());
            } else {return;}
        },
        'admin'         : true
    };
};

module.exports = exports = Commands;