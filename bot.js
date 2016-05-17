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

//Invoke bot
const bot = new Discord.Client({autoReconnect:true});

//Message Event Checker
bot.on("message", (msg) => {
    if(msg.author === bot.user || msg.channel.isPrivate) {return;}
    else if (prefixes.indexOf(msg.content[0]) > -1 ) {
        let cmdOpt = {};
        fn.getOpt(msg, cmdOpt)
        let cmdTxt = cmdOpt.cmdTxt;
        if (!fn.commandAvailable(cmdTxt, commandList)) return;
        commands[cmdTxt].process(bot, msg);
    }
    else return;
}).on('error', (err) => {
    console.log('Whoops! there was an error', err);
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


