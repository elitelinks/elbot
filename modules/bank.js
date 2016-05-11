'use strict';
const fs = require('fs-extra');
var bankSet = fs.readJsonSync("./settings/bank.json");
var settings = require("../settings/settings.json"),
    devMode = settings.devmode, //set to false or remove in production
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;

var bank = {
    file : './settings/bank.json',
    accounts : bankSet.accounts,
    commands : ['balance', 'register', 'payday'],
    settings : bankSet.settings,

    check : (bot, msg) => {
        var id = msg.author.id;
        if (!bank.accounts[id]) {
            bot.reply(msg, `No account! Use \`${prefixes[0]}bank register\` to get a new account!`);
            return false;
        };
    },

    //TODO add list commands funct.
    init : (bot, msg, suffix) => {
        var id = msg.author.id;
        var name = msg.author.name;
        var sufSpl = suffix.split(' ');
        if (bank.commands.indexOf(sufSpl[0]) > -1) {
            bank[sufSpl[0]](bot, msg, suffix, id, name, sufSpl);
        } else {
            bot.sendMessage(msg, `Unrecognized bank command. \`${prefixes[0]}bank list\` for a list of commands.`)
        }
    },

    reload : () => {
        try {
            fs.writeJsonSync(bank.file, bankSet);
            bankSet = fs.readJsonSync(bank.file);
        } catch(err) {
            console.log(err);
        }
        bank.accounts = bankSet.accounts;
    },

    add : (id, amount) => {
        try {
            bank.accounts[id].balance += amount;
        } catch(err) {console.log(err);}
    },

    subtract : (id, amount) => {
        try {
            bank.accounts[id].balance -= amount;
        } catch(err) {console.log(err);}
    },

    register : (bot, msg, suffix, id, name, sufSpl) => {
        if (!bank.accounts[id]) {
            try {
                bank.accounts[id] = {};
                bank.accounts[id].name = name;
                bank.accounts[id].balance = bankSet.settings.payout;
                bank.accounts[id].wait = Math.round(new Date() / 1000);
                bank.accounts[id].playingpoker = false;
                console.log("New Bank Account Created!")
                bot.sendMessage(msg, `Account created for ${name} with balance ${bank.accounts[id].balance} credits.`);
                bank.reload();
            } catch(err) {console.log(err);}
        } else {
            bot.reply(msg, `You already have an account!`)
        }
    },

    balance : (bot, msg, suffix, id, name, sufSpl) => {
        var person = sufSpl[1];
        var search = bot.users.get('name', person);
        if (!bank.accounts[id]) {bot.reply(msg, `No account! Use \`${prefixes[0]}bank register\` to get a new account!`)}
        else if (search) {bot.reply(msg, `The balance of **${person}** is ${bank.accounts[search.id].balance} credits.`)}
        else {bot.reply(msg, `Your balance is ${bank.accounts[id].balance} credits.`)}
    },

    transfer: (bot, msg, suffix, id, name, sufSpl) => {},

    payday : (bot, msg, suffix, id, name) => {
        try {
            if (!bank.accounts[id]) {
                bot.reply(msg, `No account! Use \`${prefixes[0]}bank register\` to get a new account!`);
            }
            var current = Math.round(new Date() / 1000);
            var check = current - bank.accounts[id].wait;
            if (check >= bank.settings.payoutTime) {
                bank.accounts[id].balance += bankSet.settings.payout;
                bank.accounts[id].wait = Math.round(new Date() / 1000);
                bot.reply(msg, `+${bankSet.settings.payout} credits! Your new balance is ${bank.accounts[id].balance} credits.`);
                bank.reload();
            } else {
                bot.reply(msg, `Too soon! Please wait another ${check} seconds!`)
            }
        } catch(err) {
            console.log(err);
        }
    }
};

module.exports = exports = bank;

//TODO add transfer
//TODO fix add/sub command by getting user