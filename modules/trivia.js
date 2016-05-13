const http = require('http');
const fs = require('fs-extra');
const bank = require("./bank");
const Timer = require('timer.js');
const util = require('util');
//const EventEmitter = require('events');

var settings = require("../settings/settings.json"),
    triviaset = settings.trivia;

function Trivia() {
    this.gameon = false;
    this.scorelist = {};
    this.currentList = [];
    this.currentQuestion = {};
    this.used = [];
    this.topscore = 0;
    this.count = 0;
    this.canAnswer = false;
    this.answers = [];
    
    this.timer = new Timer();
    this.countdown = new Timer();

    this.categories = fs.readdirSync(triviaset.path);

    var t = this;

    this.list = (bot, msg) => {
        var catTxt = this.categories.map((x) => {return x.slice(0, -5)}).join(' ');
        bot.sendMessage(msg, `Trivia categories available are:\n\`\`\`${catTxt}\`\`\``);
    };

    this.init = (bot ,msg, suffix) => {
        if (suffix === 'stop' && this.gameon === true) {this.end(bot, msg); return;}
        if (suffix === 'skip') {
            if (this.gameon === false) {return;}
            else {
                this.loop(bot, msg);
            }
        }
        else if (this.gameon === true) {bot.sendMessage(msg,"There is already a trivia session in place!"); }
        else if (!suffix || suffix === 'list') {this.list(bot, msg);}
        else if (this.categories.indexOf(suffix+".json") > -1) {this.begin(bot, msg, suffix);}
        else {bot.sendMessage(msg, `No list with the name ${suffix}`); }
    }

    this.loadlist = (bot, msg, suffix) => {
        this.currentList = fs.readJsonSync(`${triviaset.path}/${suffix}.json`);
        console.log(`${suffix} loaded!`);
    };

    this.loadQuestion = () => {
        if (this.currentList === []) {console.log('No List Loaded!'); return;}
        var questionCheck = Math.floor(Math.random() * this.currentList.length);
        if (this.used.indexOf(questionCheck) <= -1) {
            this.currentQuestion = this.currentList[questionCheck];
            this.used.push(questionCheck);
        } else this.loadQuestion();
    };

    this.addPoint = (bot, msg) => {
        var winner = msg.author.name;
        if (this.scorelist[winner] > this.topscore) {this.topscore = this.scorelist[winner]}
        if (!this.scorelist[winner]) {this.scorelist[winner] = 1;}
        else this.scorelist[winner] ++;
        if (this.scorelist[winner] > this.topscore){this.topscore = this.scorelist[winner]}
        this.countdown.stop();
        this.countdown.start(triviaset.timeout).on('end', function() {
            this.end(bot, msg);
        })
    };

    this.round = (bot, msg) => {
        try {
            var botAnswers = (bot, msg) => {
                if (this.canAnswer === false) {return;}
                this.canAnswer = false;
                bot.sendMessage(msg, `The answer is **${t.currentQuestion.answers[0]}**!`);
                this.timer.stop();
                t.loop(bot,msg);
            };

            this.timer.stop();
            this.timer.start(triviaset.delay).on('end', () => {botAnswers(bot, msg)});
            this.answers = [];
            this.answers = this.currentQuestion.answers.map((x)=>x.toLowerCase());

            bot.sendMessage(msg, `**Question #${this.count}**\n${this.currentQuestion["question"]}`);
            this.canAnswer = true;
            bot.on("message", (msg) => {
                var guess = msg.content.toLowerCase();
                var num = this.answers.indexOf(guess);
                if (num > -1 && this.canAnswer === true) {
                    if(!this.answers || !this.currentQuestion || this.canAnswer === false || msg.author === bot.user) {return;}
                    bot.sendMessage(msg, `Right answer ${msg.author.name}! ${this.currentQuestion.answers[num]}!`);
                    this.canAnswer = false;
                    this.answers = [];
                    this.addPoint(bot, msg);
                    this.timer.stop();
                    t.loop(bot,msg);
                }
            });
        } catch(err) {console.log(err); t.loop(bot, msg)}
    };

    this.loop = (bot, msg) => {
        this.currentQuestion = {};
        this.loadQuestion();
        this.timer.stop();
        this.timer.start(.5).on('end', () => {
            if (this.topscore >= triviaset.maxScore) {this.end(bot, msg); }
            else {
                this.count++;
                this.round(bot, msg);
            }
        });
    };

    this.begin = (bot, msg, suffix) => {
        this.loadlist(bot, msg, suffix);
        this.loop(bot ,msg);
        this.gameon = true;
        this.countdown.start(triviaset.timeout).on('end', function(){
            this.end(bot, msg);
        })
    };

    var reset = () => {
        this.gameon = false;
        this.scorelist = {};
        this.currentList = [];
        this.currentQuestion = {};
        this.used = [];
        this.topscore = 0;
        this.count = 0;
        this.canAnswer = false;
        this.answers = [];
    };

    this.end = (bot, msg) => {
        this.countdown.stop();
        this.timer.stop();
        let sortable = [];
        for (var score in this.scorelist) {
            sortable.push([score, this.scorelist[score]])
        }
        sortable.sort((a,b) => b[1] - a[1]);
        var str = sortable.join('\n').replace(/,/g, ": ");
        bot.sendMessage(msg, `Trivia Ended!\n\__**Scores:**__\n\`\`\`${str ? str : 'No one had points!'}\`\`\``);
        reset()
    };
};

//util.inherits(Trivia, EventEmitter);

module.exports = exports = new Trivia();