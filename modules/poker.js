"use strict"
var hand = require('pokersolver').Hand;
var events = require('events');
var Deck = require("../modules/deck.js");
var bank = require("../modules/bank.js");
var Timer = require("timer.js");
var settings = require("../settings/settings.json");

function Poker(bot, msg, suffix, id) {
    //if (msg.channel.id !== settings.gamesroom) {return;}
    var bid = parseInt(suffix.toString().replace(/[\D]g/, ''), 10);
    if (bank.check(bot, msg) === false) {return};
    this.id = id;
    if (id !== msg.author.id) {return};
    this.playerhand = [];
    this.deck = new Deck;
    this.gameon = false;
    this.round = 0;
    this.timer = new Timer();
    events.EventEmitter.call(this);
    var that = this;

    this.deck.filldeck();
    this.deck.shuffle();

    this.dealHand = () => {
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
        bot.sendMessage(msg, `${replyHand}`);
        bot.on("messsage", (msg, id) => {});
        this.round++;
        console.log(this.round);
        this.timer.stop();
        this.timer.start(this.round >= 2 ? 1 : 5)
            .on('end', () => this.round >= 2 ? this.finishGame() : this.dealHand());
    };

    this.finishGame = () => {
        this.timer.stop();
        return "hello";
    }

    this.holdCards = (bot, msg, bid) => {

    };

    this.on('end', () => {return;})
}

Poker.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Poker;
    
/*
var events = require('events');

function Door(colour) {
    this.colour = colour;
    events.EventEmitter.call(this);

    this.open = function()
    {
        this.emit('open');
    }
}

Door.prototype.__proto__ = events.EventEmitter.prototype;

var frontDoor = new Door('brown');

frontDoor.on('open', function() {
    console.log('ring ring ring');
});
frontDoor.open();*/

