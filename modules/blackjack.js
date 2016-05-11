"use strict"
var fs = require('fs-extra');
var Deck = require("../modules/deck");
var bank = require("../modules/bank");
var Timer = require("timer.js");
var settings = require("../settings/settings.json"),
    devMode = settings.devmode,
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;
var bankSet = fs.readJsonSync("./settings/bank.json");

function Player(bot, id) {
    if (bank.check(bot, msg) === false || !suffix  || bank.accounts[this.id].playingpoker === true) {return};
    this.id = id;
    this.balance = bank.accounts[this.id].balance;
};

function Blackjack(bot, msg, suffix) {
    this.bot = bot;
    bot.setMaxListeners(0);
    this.id = msg.author.id;
    let bid = Math.floor(parseInt(suffix.toString().replace(/[\D]g/, ''), 10));
    this.playerHand = [];
    this.dealerHand = [];
    this.timer = new Timer();
    this.deck = new Deck({'decks': 3});

    this.init = () => {
        if (msg.channel.id !== settings.gamesroom) {return;}
        if (this.id !== msg.author.id) {return};
        if (bank.check(bot, msg) === false || !suffix  || bank.accounts[this.id].playingpoker === true) {return};
        if (!bid || bid < bankSet.settings.minBet || bid > bankSet.settings.maxBet || isNaN(bid)) {
            bot.reply(msg, `You must place a bid between ${bankSet.settings.minBet} and ${bankSet.settings.maxBet}`); return;
        }
        deck.filldeck();
        deck.shuffle();
        bank.subtract(this.id, bid);
    }

}