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
const bank = require("./modules/bank");
const commands = require("./modules/commands")
console.log(commands.alias);

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

var cmdHandlr = (bot, msg, suffix, id, cmdTxt, sufArr) => {
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
            poker = null;
        })(); break;

        //fun stuff
        case "eight" :
        case "8" : commands.eight.process(bot, msg); break;
        case "tsa" : commands.tsa.process(bot, msg); break;
        case "orly" : commands.orly.process(bot, msg, suffix); break;
        case "ping" : bot.sendMessage(msg, "pong"); break;

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
        case "emptycache" : commands.emptycache.process(msg); break;
        case "logout" : commands.logout.process(bot, msg); break;
        default: break;
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

const cmdInit = (msg) => {
    var sufArr = msg.content.split(' ');
    var cmdTxt = sufArr[0].substr(1);
    sufArr.splice(0, 1);
    var suffix = sufArr.join(' ');
    var id = msg.author.id;
    var name = msg.author.name;
    return [msg, suffix, id, cmdTxt, sufArr];
};


//msg checker
bot.on("message", (msg) => {
    if(msg.author === bot.user || msg.channel.isPrivate) {return;}
    else if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
        let args = cmdInit(msg);
        let cmdTxt = args[3];
        //if (settings.alias.hasOwnProperty(cmdTxt)) cmdTxt = settings.alias[cmdTxt];
        if (!commands[cmdTxt]]) {return;}
        commands[args[3]].process(bot, ...args);
    }
    else return;
});
//Ready
bot.on("ready", ()=>{
    bot.setPlayingGame(`${devMode ? 'in development' : 'v0.0.6'}`);
    console.log(`EL bot${devMode ? '(DEV)' : ''} is ready`);
});

bot.on("disconnected", ()=> {process.exit(0);});

//Login
if (settings.token || settings.dev_token) {bot.loginWithToken(devMode ? settings.dev_token : settings.token);console.log("Logged in using Token");}
else {bot.login(settings.email, settings.password);console.log("Logged in using Email")}


