"use strict";
const fs = require('fs-extra');
const fn = require('./functions');
var settings = require("../settings/settings.json"),
    devMode = settings.devmode, 
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;
var path = require('path');
var appDir = path.dirname(require.main.filename);
var file = appDir+"/settings/bank.json";
var bankSet = fs.readJsonSync(file);

function Bank() {
    this.accounts = bankSet.accounts;
    var commands = ['balance', 'register', 'payday', 'transfer', 'list'];
    var adminCmd = ['reload'];
    var settings = bankSet.settings;
    var b = this;

    this.check = (bot, msg) => {
        fn.getOpt(msg, b);
        if (!this.accounts[this.id]) {
            bot.reply(msg, `No account! Use \`${prefixes[0]}bank register\` to get a new account!`);
            return false;
        } else return true;
    };
    
    //TODO add leaderboard
    this.init = (bot, msg) => {
        fn.getOpt(msg, b);
        if (fn.commandAvailable(this.subCmd, commands) || fn.commandAvailable(this.subCmd, adminCmd)) {
            this[this.subCmd](bot, msg);
        } else {
            bot.sendMessage(msg, `Unrecognized bank command. \`${prefixes[0]}bank list\` for a list of commands.`)
        }
    };
    
    this.list = (bot, msg) => {
        bot.sendMessage(msg, `__**Available bank commands**__\n\`${commands.join(', ')}\``)
    };

    this.reload = () => {
        try {
            fs.writeJsonSync(file, bankSet);
            bankSet = fs.readJsonSync(file);
        } catch(err) {
            console.log(err);
        }
        this.accounts = bankSet.accounts;
    };

    this.add = (id, amount) => {
        try {
            let a = parseInt(amount, 10);
            if (isNaN(a)) {throw new Error("Amount added is NaN"); return;}
            this.accounts[id].balance = parseInt(this.accounts[id].balance, 10) + parseInt(a, 10);
        } catch(err) {console.log(err);}
    };

    this.subtract = (id, amount) => {
        try {
            let s = parseInt(amount, 10);
            if (isNaN(s)) {throw new Error("Amount subtracted is NaN"); return;}
            this.accounts[id].balance = parseInt(this.accounts[id].balance, 10) - parseInt(s, 10);
        } catch(err) {console.log(err);}
    };

    this.register = (bot, msg) => {
        if (!this.accounts[this.id]) {
            try {
                this.accounts[this.id] = {};
                this.accounts[this.id].name = name;
                this.accounts[this.id].balance = bankSet.settings.payout;
                this.accounts[this.id].wait = Math.round(new Date() / 1000);
                this.accounts[this.id].playingpoker = false;
                bot.sendMessage(msg, `Account created for ${name} with balance ${this.accounts[this.id].balance} credits.`);
                this.reload();
            } catch(err) {console.log(err);}
        } else if (this.accounts[this.id]) {
            bot.reply(msg, `You already have an account!`)
        }
    };

    this.numParser = (num) => {
        if (typeof num === 'string') {
            num = parseInt(num.replace(/[\D]g/, ''), 10);
        }
        return Math.floor(parseInt(num, 10));
    }

    this.numberChecker = (bot, msg, num) => {
        if (isNaN(parseInt(num, 10))) {
            bot.reply(msg, "That is not a valid amount!");
            return false;
        } else return true;
    };

    this.enoughCredits = (bot, msg, amount) => {
        let x = {};
        fn.getOpt(msg, x);
        let balance = this.accounts[x.id].balance;
        if (amount > balance) {
            bot.reply(msg, `Not enough credits!`);
            return false;
        } else return true;
    };

    this.balance = (bot, msg) => {
        var person = this.sufArr[1];
        if (this.check(bot, msg) === false) {return}
        if (!person) {bot.reply(msg, `Your balance is **[${this.accounts[this.id].balance}]** credits.`); return}
        else {
            var search = fn.getUser(msg, person);
            bot.reply(msg, `**${person}**'s balance is **[${this.accounts[search.id].balance}]** credits.`)
        }
    };

    this.transfer = (bot, msg) => {
        //sufArr should = [0]transfer [1]getting [2]amount
        let giving = this.id;
        let getting = fn.getUser(msg, this.sufArr[1]);
        let amount = this.numParser(this.sufArr[2]);
        if(this.numberChecker(bot, msg, amount) === false) {return}
        if(this.enoughCredits(bot, msg, amount) === false) {return}
        this.subtract(giving, amount);
        this.add(getting.id, amount);
        bot.reply(msg, `**+${amount}** deposited into **${getting.name}'s** account!`)
        this.reload();
    };

    this.payday = (bot, msg) => {
        try {
            if(this.check(bot, msg) === false) return;
            var current = Math.round(new Date() / 1000);
            var check = current - this.accounts[this.id].wait;
            if (check >= settings.payoutTime) {
                this.accounts[this.id].balance += bankSet.settings.payout;
                this.accounts[this.id].wait = Math.round(new Date() / 1000);
                bot.reply(msg, `**+${bankSet.settings.payout}** credits! Your new balance is **[${this.accounts[this.id].balance} credits]**`);
                this.reload();
            } else {
                bot.reply(msg, `Too soon! Please wait another ${settings.payoutTime - check} seconds!`)
            }
        } catch(err) {
            console.log(err);
        }
    };
    
    this.attributes = {
        'description' : `Bank functions. \`${prefixes[0]}bank register\` to start an account`,
        'alias' : ['none'],
        'usage' : `\`${prefixes[0]}bank [command] or [list] to get a list of commands\``,
        'admin' : false
    };
}

module.exports = exports = new Bank;

