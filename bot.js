//Requires
process.setMaxListeners(0);
var Discord = require("discord.js");
var startTime = new Date;
var Timer = require("timer.js");
const google = require("google");
const syllable = require("syllable");
const request = require("request");
const jsonfile = require("jsonfile");
const http = require('http');
const fs = require('fs-extra');


//settings & data
var settings = require("./settings/settings.json"),
    prefixes = settings.prefixes,
    triviaset = settings.trivia;
var bank = require("./settings/bank.json");

//invoke bot
const bot = new Discord.Client({autoReconnect:true});

/*
Command Handler
*/

const cmdHandlr = (bot, msg, cmdTxt, suffix) => {
    switch (cmdTxt) {
        // searches
        case "goog" :
        case "google" : commands.goog(bot, msg, suffix); break;
        case "syl" :
        case "syllables" :
        case "syllable" : commands.syllable(bot, msg, suffix); break
        case "weather" : commands.weather(bot, msg, suffix); break;
        case "8" : commands.eight(bot, msg); break;
        case "tsa" : commands.tsa(bot, msg); break;
        case "orly" : commands.orly(bot, msg, suffix); break;
        
        //trivia
        case "trivia" : if (suffix === 'stop' && triviaSesh.gameon === true) {triviaSesh.end(bot, msg)}
            else trivia.start(bot, msg, suffix); break;

        //admin controls
        case "eval" : commands.eval(bot, msg, cmdTxt, suffix); break;
        case "cleanup" : commands.cleanup(); break;
        case "logout" : commands.logout(bot, msg); break;
        default: return;
    }
};

/*
Commands
 */

function Command (bot, msg, cmdTxt, suffix) { // TODO change commands to class
    this.msg = msg;
    this.cmdTxt = cmdTxt;
    this.suffix = suffix;
}

var commands = {
    goog : (bot, msg, suffix) => {
        'use strict';
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

    weather : (bot, msg, suffix) => {
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
                var direction = Math.floor((weath.wind.deg / 22.5) + 0.5)
                var compass = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
                var msgArray = [];
                var sunrise = new Date(weath.sys.sunrise * 1000)
                var formattedSunrise = (sunrise.getHours()) + ':' + ("0" + sunrise.getMinutes()).substr(-2)
                var sunset = new Date(weath.sys.sunset * 1000)
                var formattedSunset = (sunset.getHours()) + ':' + ("0" + sunset.getMinutes()).substr(-2)
                msgArray.push(":earth_americas: __**Weather for " + weath.name + ", " + weath.sys.country + ":**__ • (*" + weath.coord.lon + ", " + weath.coord.lat + "*)")
                msgArray.push("**" + weatherC + "Current Weather Conditions:** " + weath.weather[0].description)
                msgArray.push("**:sweat: Humidity:** " + weath.main.humidity + "% - **:cityscape:  Current Temperature:** " + Math.round(weath.main.temp - 273.15) + "°C / " + Math.round(((weath.main.temp - 273.15) * 1.8) + 32) + "°F")
                msgArray.push("**:cloud: Cloudiness:** " + weath.clouds.all + "% - **:wind_blowing_face:  Wind Speed:** " + weath.wind.speed + " m/s [*" + compass[(direction % 16)] + "*]")
                msgArray.push("**:sunrise_over_mountains:  Sunrise:** " + formattedSunrise + " UTC / **:city_dusk: Sunset:** " + formattedSunset + " UTC")
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

    syllable: (bot, msg, suffix) => {
        bot.sendMessage(msg, `Syllables of ${suffix}: ${syllable(suffix)}`);
    },

    eight: (bot, msg) => {
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

    tsa: (bot, msg) => {
        var arrow = Math.round(Math.random())
        bot.reply(msg, (arrow === 1) ? ":arrow_left:" : ":arrow_right:")
    },
    
    orly: (bot, msg, suffix) => {
        fs.ensureDir('./cache', function (err) {
            console.log(err) // => null 
            // dir has now been created, including the directory it is to be placed in 
        })
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
                .on('close', function() {bot.sendFile(msg, `./cache/${filename}.png`)});
        } catch(err) {
            console.log(err);
        }
    },
//admin
    eval: (bot, msg, cmdTxt, suffix) => {
        if (msg.author.id === settings.owner) {
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

    cleanup : ()=> {
        fs.emptyDir('./cache', function (err) {
            if (!err) console.log(err)
        });
    },

    logout: (bot, msg) => {
        if (msg.author.id === settings.owner) {
            bot.sendMessage(msg, "Logging Out").then(bot.logout());
        } else {
            return;
        }
    }
};

/*
Todo Functions
 */

//TODO general help command


//economy / slots
var economy = {
    register : (msg) => {
        // TODO
    }
};


/*
Done Functions
 */

var haiku = (bot, msg) => {
    'use strict';
    let haiArr = msg.content.split(' ');
    if (syllable(haiArr) !== 17) {return};
    let lineOne = [];
    let lineTwo = [];
    let lineThree = [];
    while (syllable(lineOne) < 5) {
        lineOne.push(haiArr.shift());
    }
    while (syllable(lineTwo) < 7) {
        lineTwo.push(haiArr.shift());
    }
    while (syllable(lineThree) < 5) {
        lineThree.push(haiArr.shift());
    }
    if (syllable(lineOne) !== 5 || syllable(lineTwo) !== 7 || syllable(lineThree) !== 5) {
        return;
    }
    else {
        bot.sendMessage(msg, `Accidental Haiku Detected! Written by ***${msg.author.username}***!\n\`\`\`${lineOne.join(' ')}\n${lineTwo.join(' ')}\n${lineThree.join(' ')}\`\`\``)
    }
};

//msg checker
bot.on("message", (msg) => {
    if(msg.author === bot.user || msg.channel.isPrivate) {return;}
    else if (msg.content === "ping") {bot.reply(msg, "pong");}
    else if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
        var cmdTxt = msg.content.split(' ')[0].substr(1);
        var sufArr = msg.content.split(' '); sufArr.splice(0, 1);
        var suffix = sufArr.join(' ');
        cmdHandlr(bot, msg, cmdTxt, suffix);
    } else if (/^(http|https):/.test(msg.content)) {
        return;
    } // else if (msg.content.length > 70) {haiku(bot, msg);} // need to figure out why haiku freezes bot
    else return;
});

/*
 Trivia
 */

//trivia commands
var trivia = {
    help : (bot, msg) => bot.sendMessage(msg, 'Trivia Help'), //help cmd TODO

    categories : fs.readdirSync(triviaset.path),

    list : (bot, msg) => {
        catTxt = trivia.categories.map((x) => {return x.slice(0, -5)}).join(' ');
        bot.sendMessage(msg, `Trivia categories available are:\n\`\`\`${catTxt}\`\`\``);
    },

    start : (bot ,msg, suffix) => {
        var t = trivia;
        if (suffix === 'skip') {
            if (triviaSesh.gameon === false) {return;}
            else {triviaSesh.loop(bot, msg);}
        }
        else if (triviaSesh.gameon === true) {bot.sendMessage(msg,"There is already a trivia session in place!"); return;}
        else if (!suffix || suffix === 'help') {t.help(bot, msg); return;}
        else if (suffix === 'list') {t.list(bot, msg);}
        else if (t.categories.indexOf(suffix+".json") > -1) {triviaSesh.begin(bot, msg, suffix);}
        else {bot.sendMessage(msg, `No list with the name ${suffix}`); return;}
    }
}

//trivia session
var triviaSesh = {
    gameon : false,
    scorelist : {},
    currentList : [],
    currentQuestion : {},
    used : [],
    timer : new Timer(),
    topscore: 0,
    count : 0,

    loadlist : (bot, msg, suffix) => {
        var t = triviaSesh;
        var categories = trivia.categories;
        t.currentList = jsonfile.readFileSync(`${triviaset.path}/${suffix}.json`);
        console.log(`${suffix}.json loaded!`); //TODO replace with bot chat
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
                trivTimer.start(1).on('end', function(){t.loop(bot,msg)})
            };

            bot.sendMessage(msg, `**Question #${t.count}**\n\n${t.currentQuestion["question"]}`);
            bot.on("message", (msg) => {
                var guess = msg.content.toLowerCase();
                var num = answers.indexOf(guess);
                if (num > -1) {
                    bot.sendMessage(msg, `Right answer ${msg.author.name}! ${t.currentQuestion.answers[num]}!`)
                    t.addPoint(bot, msg);
                    trivTimer.stop()
                    trivTimer.start(1).on('end', function(){t.loop(bot,msg)})
                }
            });
            trivTimer.stop()
            trivTimer.start(triviaset.delay).on('end', function() {botAnswers(bot, msg)});

        } catch(err) {console.log(err)}
    },

    loop : (bot, msg) => {
        var t = triviaSesh;
        if (t.topscore >= triviaset.maxScore) {t.end(bot, msg); return;}
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
    },

    end : (bot, msg) => {
        var t = triviaSesh;
        t.timer.stop();
        var sortable = [];
        for (var score in t.scorelist) {
            sortable.push([score, t.scorelist[score]])
        }
        sortable.sort((a,b) => b[1] - a[1])
        var str = sortable.join('\n').replace(/,/g, ": ");
        bot.sendMessage(msg, `Trivia Ended!\n\n__**Scores:**__\n\`\`\`${str ? str : 'No one had points!'}\`\`\``);
        t.gameon = false;
        t.scorelist = {};
        t.currentList = [];
        t.currentQuestion = {};
        t.used = [];
        t.count = 0
        return;
    }
}


//ready
bot.on("ready", ()=>{
    bot.setPlayingGame("Three Laws of Robotics");
    console.log("EL bot is ready");
});

bot.on("disconnected", ()=> {process.exit(0);});
//login
if (settings.token) {bot.loginWithToken(settings.token);console.log("Logged in using Token");}
else {bot.login(settings.email, settings.password)}

