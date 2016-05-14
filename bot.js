"use strict";
//Requires
process.setMaxListeners(0);
var startTime = new Date();
const Discord = require("discord.js");
const Timer = require("timer.js");
const EventEmitter = require("events");
const http = require('http');
const request = require("request");
const fs = require('fs-extra');
const google = require("google");
var Poker = require("./modules/poker");
const slot = require("./modules/slots");
const bank = require('./modules/bank');
const fn = require('./modules/functions');
const commands = require("./modules/commands");
const trivia = require("./modules/trivia");

var commandList = Object.keys(commands);
var userCmds = Object.keys(commands).filter(x=> {
    if (commands[x]['admin'] === false) return x;
});
var adminCmds = Object.keys(commands).filter(x=> {
    if (commands[x]['admin'] === true) return x;
});

//settings & data
var settings = require("./settings/settings.json"),
    triviaset = settings.trivia,
    devMode = settings.devmode, //set to false or remove in production
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;

var bankSet = fs.readJsonSync("./settings/bank.json");
//invoke bot
const bot = new Discord.Client({autoReconnect:true});


// var cmdHandlr = (bot, msg, suffix, id, cmdTxt, sufArr) => {
//     var id = msg.author.id;
//     var name = msg.author.name
//     switch (cmdTxt) {
//         // searches
//         case "goog" :
//         case "g" :
//         case "google" : commands.google.process(bot, msg, suffix); break;
//         case "syl" :
//         case "syllables" :
//         case "syllable" : commands.syllable.process(bot, msg, suffix); break;
//         case "definition" :
//         case "def" :
//         case "define" : commands.define.process(bot, msg, suffix); break;
//         case "weath" :
//         case "weather" : commands.weather.process(bot, msg, suffix); break;
//
//         //bank
//         case "bank" : commands.bank.process(bot, msg, suffix); break;
//         case "payday" :
//         case "payout" :
//         case "$" : bank.payday(bot, msg, suffix, id, name); break;
//
//         //games
//         case "slot": if(suffix === 'payout' || suffix === 'payouts') {
//             bot.sendMessage(msg, '```' +
//                 '| Result      | Payout |\n' +
//                 '|-------------|--------|\n' +
//                 '| 777         | 777:1  |\n' +
//                 '| 3x Cherries | 4:1    |\n' +
//                 '| 3x Clovers  | 4:1    |\n' +
//                 '| 3x Beers    | 3:1    |\n' +
//                 '| 2x Cherries | 2:1    |\n' +
//                 '| 2x Any      | 1:1    |' + '```');
//         } else slot(bot, msg, suffix); break;
//         case "poker": if(suffix === 'payout' || suffix === 'payouts') {
//             bot.sendMessage(msg, '```' +
//                 '| Hand                   | Payout |\n' +
//                 '|------------------------|--------|\n' +
//                 '| Natural Royal Flush    | 800:1  |\n' +
//                 '| Five of a Kind         | 200:1  |\n' +
//                 '| Wild Royal Flush       | 100:1  |\n' +
//                 '| Straight Flush         | 50:1   |\n' +
//                 '| Four of a Kind         | 20:1   |\n' +
//                 '| Full House             | 7:1    |\n' +
//                 '| Flush                  | 5:1    |\n' +
//                 '| Straight               | 3:1    |\n' +
//                 '| Three of a Kind        | 2:1    |\n' +
//                 '| Two Pair               | 1:1    |\n' +
//                 '| Pair (Jacks or Better) | 1:1    |' + '```');
//         }
//         else (() => {
//             var id = msg.author.id;
//             var poker = new Poker(bot, msg, suffix, id);
//             poker.init();
//             poker = null;
//         })(); break;
//
//         //fun stuff
//         case "eight" :
//         case "8" : commands.eight.process(bot, msg); break;
//         case "tsa" : commands.tsa.process(bot, msg); break;
//         case "orly" : commands.orly.process(bot, msg, suffix); break;
//         case "ping" : bot.sendMessage(msg, "pong"); break;
//
//         //trivia
//         case "trivia" : if (suffix === 'stop' && triviaSesh.gameon === true) {triviaSesh.end(bot, msg);}
//             else trivia.start(bot, msg, suffix); break;
//
//         case "help" :(Object.keys(commands).indexOf(suffix) > -1) ? bot.sendMessage(msg,
//                 `${commands[suffix].description} \n*Usage:* ${commands[suffix].usage} \n*Alias${commands[suffix].alias.length > 1 ? "es" : ""}:* \`${commands[suffix].alias.join(', ')}\``) :
//             commands.help.process(bot, msg, suffix);
//             break;
//
//         //admin controls
//         case "eval" : commands.eval.process(bot, msg, cmdTxt, suffix); break;
//         case "cache" :
//         case "emptycache" : commands.emptycache.process(msg); break;
//         case "logout" : commands.logout.process(bot, msg); break;
//         default: break;
//     }
// };


//Message Event Checker
bot.on("message", (msg) => {
    if(msg.author === bot.user || msg.channel.isPrivate) {return;}
    else if (prefixes.indexOf((msg.content[0])) > -1 ) {
        let cmdOpt = {};
        fn.getOpt(msg, cmdOpt)
        let cmdTxt = cmdOpt.cmdTxt;
        if (!fn.commandAvailable(cmdTxt, commandList)) return;
        commands[cmdTxt].process(bot, msg);
    }
    else return;
}).on('error', (err) => {
    console.log('whoops! there was an error', err);
});

//Ready
bot.on("ready", ()=>{
    bot.setPlayingGame(`${devMode ? 'in development' : 'v0.0.6'}`);
    console.log(`EL bot${devMode ? '(DEV)' : ''} is ready`);
});

//On Disconnected
bot.on("disconnected", ()=> {process.exit(0);});

//Login
if (settings.token || settings.dev_token) {bot.loginWithToken(devMode ? settings.dev_token : settings.token);console.log("Logged in using Token");}
else {bot.login(settings.email, settings.password);console.log("Logged in using Email")}


