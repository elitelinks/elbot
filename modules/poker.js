"use strict"
var fs = require('fs-extra');
var hand = require('pokersolver').Hand;
var events = require('events');
var Deck = require("../modules/deck");
var bank = require("../modules/bank");
var Timer = require("timer.js");
var settings = require("../settings/settings.json"),
    devMode = settings.devmode, //set to false or remove in production
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;
var bankSet = fs.readJsonSync("./settings/bank.json");

function Poker(bot, msg, suffix, id) {
    this.bot = bot;
    this.id = id;
    var bid = parseInt(suffix.toString().replace(/[\D]g/, ''), 10);
    this.playerhand = [];
    this.deck = new Deck;
    this.gameon = false;
    this.round = 0;
    this.timer = new Timer();
    events.EventEmitter.call(this);

    this.init = () => {
        if (msg.channel.id !== settings.gamesroom) {return;}
        if (bank.check(bot, msg) === false || !suffix) {return};
        if (bank.accounts[id].balance < bid) {bot.reply(msg, `Not enough credits dummy!`); return;}
        if (!bid || bid < bankSet.settings.minBet || bid > bankSet.settings.maxBet || bid === NaN) {
            bot.reply(msg, `You must place a bid between ${bankSet.settings.minBet} and ${bankSet.settings.maxBet}`); return;
        }
        if (id !== msg.author.id) {return};
        this.gameon = true;
        this.deck.filldeck();
        this.deck.shuffle();
        bank.subtract(this.id, bid)
        this.dealHand();
    }

    this.dealHand = () => {
        process.setMaxListeners(0);
        this.gameon = true;
        let cardsNeeded = 5 - this.playerhand.length;
        for (; cardsNeeded > 0; cardsNeeded--) {
            this.playerhand.push(this.deck.cards.pop());
        }
        let replyHand = this.playerhand.map((x)=>{
            var o = x.split('');
            if (o[1] === "d") {o[1] = ":diamonds:"};
            if (o[1] === "s") {o[1] = ":spades:"};
            if (o[1] === "h") {o[1] = ":hearts:"};
            if (o[1] === "c") {o[1] = ":clubs:"};
            return o.join('');
        });
        replyHand = `[**${replyHand.join('**]     [**')}**]\n`
        this.round++;
        bot.reply(msg, `${replyHand}`);
        bot.reply(msg, this.round >= 2 ? `Game Ended!` : `Round 1 You have **60 seconds** to reply.\n` +
            `Type \`${prefixes[0]}aaaaa\` to *hold* cards.\n` +
            `Type \`${prefixes[0]}xxxxx\` to *fold* cards.*\n` +
            `Example: \`${prefixes[0]}aaxxx\` would *hold* the first *2 cards.*\n`
        );
        console.log(this.round);
        this.timer.stop();
        bot.on("message", (msg) => {
            if (this.id !== msg.author.id || msg.author.bot || msg.channel.isPrivate || this.round >= 2) {return};
            let cmdTxt = msg.content.split(' ')[0].substr(1);
            let prefix = (msg.content.substr(0, 1));
            if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
                var holdOpt = cmdTxt.split('');
                console.log(holdOpt);
                let q = [];
                if (holdOpt[0] === "a") {q.push(this.playerhand[0])};
                if (holdOpt[1] === "a") {q.push(this.playerhand[1])};
                if (holdOpt[2] === "a") {q.push(this.playerhand[2])};
                if (holdOpt[3] === "a") {q.push(this.playerhand[3])};
                if (holdOpt[4] === "a") {q.push(this.playerhand[4])};
                this.playerhand = q;
                this.dealHand();
            } else {return;}
        });
        this.timer.start(this.round >= 2 ? 1 : 60)
            .on('end', () => this.round >= 2 ? this.finishGame() : this.dealHand());
    };

    this.finishGame = () => {
        var payout = {
            'High Card' : 0,
            'Pair' : .5,
            'Two Pair' : 2,
            'Three of a Kind' : 3,
            'Straight' : 4,
            'Flush' : 6,
            'Full House' : 9,
            'Four of a Kind' : 25,
            'Straight Flush' : 50,
            'Royal Flush' : 800
        }
        let endHand = hand.solve(this.playerhand);
        let finalPay = bid * Math.round(payout[endHand.name]);
        bot.reply(msg, `${endHand.descr} Payout: ${finalPay}`);
        bank.add(this.id, finalPay);
        this.gameon = false;
        this.timer.stop();
        this.timer.start(1).on('end', () => {bot.reply(msg, `Game Ended! Credits left: **${bank.accounts[id].balance}**`)});
        bank.reload();
    }
}

Poker.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Poker;

