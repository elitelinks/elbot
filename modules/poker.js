"use strict"
var fs = require('fs-extra');
var events = require('events');
var Deck = require("../modules/deck");
var ps = require('pokersolver');
var hand = ps.Hand;
var Game = ps.Game;
var bank = require("../modules/bank");
var Timer = require("timer.js");
var settings = require("../settings/settings.json"),
    devMode = settings.devmode, //set to false or remove in production
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;
var bankSet = fs.readJsonSync("./settings/bank.json");

function Poker(bot, msg, suffix, id) {
    this.bot = bot;
    this.id = id;
    let bid = parseInt(suffix.toString().replace(/[\D]g/, ''), 10);
    this.playerhand = [];
    this.deck = new Deck({'joker' : true});
    this.round = 0;
    this.timer = new Timer();
    //events.EventEmitter.call(this);
    var elRules = {
        'cardsInHand': 5,
        'handValues': [ps.NaturalRoyalFlush, ps.FiveOfAKind, ps.WildRoyalFlush, ps.StraightFlush, ps.FourOfAKind, ps.FullHouse, ps.Flush, ps.Straight, ps.ThreeOfAKind, ps.TwoPair, ps.OnePair, ps.HighCard],
        'wildValue': 'O',
        'wildStatus': 1,
        'wheelStatus': 0,
        'sfQualify': 5,
        'lowestQualified': ['Jc', 'Jd', '4h', '3s', '2c'],
        "noKickers": true
    };
    var elPoker = new Game();
    elPoker.descr = 'eliteliks';
    elPoker.cardsInHand = elRules['cardsInHand'];
    elPoker.handValues = elRules['handValues'];
    elPoker.wildValue = elRules['wildValue'];
    elPoker.wildStatus = elRules['wildStatus'];
    elPoker.wheelStatus = elRules['wheelStatus'];
    elPoker.sfQualify = elRules['sfQualify'];
    elPoker.lowestQualified = elRules['lowestQualified'];
    elPoker.noKickers = elRules['noKickers'];

    this.init = () => {
        if (msg.channel.id !== settings.gamesroom) {return;}
        if (this.id !== msg.author.id) {return};
        if (bank.check(bot, msg) === false || !suffix  || bank.accounts[this.id].playingpoker === true) {return};
        if (bank.accounts[id].balance < bid) {bot.reply(msg, `Not enough credits dummy!`); return;}
        if (!bid || bid < bankSet.settings.minBet || bid > bankSet.settings.maxBet || isNaN(bid)) {
            bot.reply(msg, `You must place a bid between ${bankSet.settings.minBet} and ${bankSet.settings.maxBet}`); return;
        }
        this.deck.filldeck();
        this.deck.shuffle();
        bank.subtract(this.id, bid)
        this.dealHand();
    }

    this.dealHand = () => {
        this.deck.shuffle();
        bank.accounts[this.id].playingpoker = true;
        let cardsNeeded = 5 - this.playerhand.length;
        for (; cardsNeeded > 0; cardsNeeded--) {
            this.playerhand.push(this.deck.cards.pop());
        }
        let replyHand = this.playerhand.map((x)=>{
            if (x === "Or") {return "J:black_joker:"}
            var o = x.split('');
            if (o[1] === "d") {o[1] = ":diamonds:"};
            if (o[1] === "s") {o[1] = ":spades:"};
            if (o[1] === "h") {o[1] = ":hearts:"};
            if (o[1] === "c") {o[1] = ":clubs:"};
/*          if (o[0] === "T") {o[0] = ":ten:"};
            if (o[0] === "9") {o[0] = ":nine:"};
            if (o[0] === "8") {o[0] = ":eight:"};
            if (o[0] === "7") {o[0] = ":seven:"};
            if (o[0] === "6") {o[0] = ":six:"};
            if (o[0] === "5") {o[0] = ":five:"};
            if (o[0] === "4") {o[0] = ":four:"};
            if (o[0] === "3") {o[0] = ":three:"};
            if (o[0] === "2") {o[0] = ":two:"};*/
            return o.join('');
        });
        replyHand = `[**${replyHand.join('**]     [**')}**]\n`
        this.round++;
        bot.reply(msg, `${replyHand}`);
        bot.reply(msg, this.round >= 2 ? `Final Hand!` : `First hand! You have **60 seconds** to reply.\n` +
            `Type \`${prefixes[0]}hhhhh\` to __**h**__old cards.\n` +
            `Type \`${prefixes[0]}fffff\` to __**f**__old cards.\n` +
            `Example: \`${prefixes[0]}hhfff\` would *hold* the first **2 cards.**\n`
        );
        this.timer.stop();
        bot.on("message", (msg) => {
            if (this.id !== msg.author.id || msg.author.bot || msg.channel.isPrivate || this.round >= 2) {return};
            let cmdTxt = msg.content.split(' ')[0].substr(1);
            let prefix = (msg.content.substr(0, 1));
            if (prefixes.indexOf(prefix) > -1 ) {
                var holdOpt = cmdTxt.split('');
                if (holdOpt.length !== 5 || (cmdTxt.toLowerCase() === 'poker' && this.round === 1)) {return;}
                let q = [];
                if (holdOpt[0].toLowerCase() === "h" || holdOpt[0].toLowerCase() === "a") {q.push(this.playerhand[0])};
                if (holdOpt[1].toLowerCase() === "h" || holdOpt[1].toLowerCase() === "a") {q.push(this.playerhand[1])};
                if (holdOpt[2].toLowerCase() === "h" || holdOpt[2].toLowerCase() === "a") {q.push(this.playerhand[2])};
                if (holdOpt[3].toLowerCase() === "h" || holdOpt[3].toLowerCase() === "a") {q.push(this.playerhand[3])};
                if (holdOpt[4].toLowerCase() === "h" || holdOpt[4].toLowerCase() === "a") {q.push(this.playerhand[4])};
                this.playerhand = q;
                this.timer.stop();
                this.timer.start(.5).on('end', () => {this.dealHand();});
            } else {return;}
        });
        this.timer.start(this.round >= 2 ? .5 : 60)
            .on('end', () => this.round >= 2 ? this.finishGame() : this.dealHand());
    };
    this.finishGame = () => {
        bank.accounts[this.id].playingpoker = false;
        var payout = {
            'High Card' : 0,
            'Pair' : 0,
            'Two Pair' : 1,
            'Three of a Kind' : 3,
            'Straight' : 4,
            'Flush' : 6,
            'Full House' : 9,
            'Four of a Kind' : 25,
            'Straight Flush' : 50,
            'Wild Royal Flush' : 100,
            'Five of a Kind' : 200,
            'Natural Royal Flush' : 800,
            'Royal Flush' : 800
        }
        
        let endHand = hand.solve(this.playerhand, elPoker);
        let finalPay = bid * Math.round(payout[endHand.name]);
        switch (endHand.descr) {
            case 'Pair, A\'s' :
            case 'Pair, K\'s' :
            case 'Pair, Q\'s' :
            case 'Pair, J\'s' : finalPay = bid * 1; break;
            case 'Wild Royal Flush' : finalPay = bid * 100; break;
            case 'Natural Royal Flush' : finalPay = bid * 800; break;
            case 'Royal Flush': finalPay = bid * 800; break;
            default : break;
        }
        if (isNaN(finalPay)) {finalPay = 0; console.log('There was an error with poker pay')};
        bank.add(this.id, finalPay);
        this.timer.stop();
        this.timer.start(.5).on('end', () => {bot.reply(msg, `Your hand is : **${endHand.descr}** Payout: **[${finalPay} credits]**\n` +
            `Credits left: **${bank.accounts[id].balance}**`)});
        bank.reload();
    }
}

//Poker.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Poker;

