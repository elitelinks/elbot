"use strict";


function Bank() {
    const fs = require('fs-extra');
    const fn = require('./functions');
    var prefixes = require("../settings/settings.json").prefixes;
    var path = require('path');
    var appDir = path.dirname(require.main.filename);
    var file = appDir+"/settings/bank.json";
    var bankSet = fs.readJsonSync(file);
    this.accounts = bankSet.accounts;
    var commands = ['balance', 'register', 'payday', 'transfer'];
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

    //TODO add list commands funct.
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
        
    }

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
            this.accounts[id].balance += amount;
        } catch(err) {console.log(err);}
    };

    this.subtract = (id, amount) => {
        try {
            this.accounts[id].balance -= amount;
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

    this.numberChecker = (bot, msg, num) => {
        if (typeof num === 'string') num.toString().replace(/[\D]g/, '');
        if (isNaN(Math.floor(parseInt(num, 10)))) {
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
        var search = bot.users.get('name', person);
        if (!this.check(bot, msg)) return;
        else if (search) {bot.reply(msg, `**${person}**'s balance is **[${this.accounts[search.id].balance}]** credits.`)}
        else {bot.reply(msg, `Your balance is **[${this.accounts[this.id].balance}]** credits.`)}
    };

    this.transfer = (bot, msg) => {
        //sufArr should = [0]transfer [1]getting [2]amount
        let giving = this.id;
        let getting = fn.getUserID(msg, this.sufArr[1]);
        let amount = this.sufArr[2];
        console.log(giving, getting, amount);
        if(!this.numberChecker(bot, amount)) return;
        if(!this.enoughCredits(bot, msg, amount)) return;
        this.subtract(giving, amount);
        this.add(getting, amount);
        let getName = fn.getUserName(msg, getting);
        bot.reply(msg, `+${amount} deposited into ${getName}'s account!`)
    }; //TODO fix transfer

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
                bot.reply(msg, `Too soon! Please wait another ${check - settings.payoutTime} seconds!`)
            }
        } catch(err) {
            console.log(err);
        }
    };
    
    this.attributes = {
        'description' : `Bank functions. \`${prefixes[0]}bank register\` to start an account`,
        'alias' : ['none'],
        'usage' : `\`${prefixes[0]}bank [command] or [list] to get a list of commands\``,
        'admin' : false,
        process : (bot, msg) => bank.init(bot, msg)
    };
    
}

module.exports = exports = new Bank;

