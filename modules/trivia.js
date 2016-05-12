const http = require('http');
const fs = require('fs-extra');
const bank = require("./bank");
const Timer = require('timer.js');
var startTime = new Date();

var settings = require("../settings/settings.json"),
    triviaset = settings.trivia,
    devMode = settings.devmode,
    prefixes = devMode ? settings.dev_prefixes : settings.prefixes;

var bankSet = fs.readJsonSync("./settings/bank.json");


function Trivia() {
    this.gameon = false;
    this.scorelist = {};
    this.currentList = [];
    this.currentQuestion = {};
    this.used = [];
    this.timer = new Timer();
    this.topscore= 0;
    this.count = 0;
    this.countdown = new Timer();

    this.categories = fs.readdirSync(triviaset.path);

    var t = this;

    this.list = (bot, msg) => {
        var catTxt = this.categories.map((x) => {return x.slice(0, -5)}).join(' ');
        bot.sendMessage(msg, `Trivia categories available are:\n\`\`\`${catTxt}\`\`\``);
    };

    this.start = (bot ,msg, suffix) => {
        if (suffix === 'skip') {
            if (this.gameon === false) {return;}
            else {this.loop(bot, msg);}
        }
        else if (this.gameon === true) {bot.sendMessage(msg,"There is already a trivia session in place!"); }
        else if (!suffix || suffix === 'help') {return;}
        else if (!suffix || suffix === 'list') {t.list(bot, msg);}
        else if (t.categories.indexOf(suffix+".json") > -1) {this.begin(bot, msg, suffix);}
        else {bot.sendMessage(msg, `No list with the name ${suffix}`); }
    }

    this.loadlist = (bot, msg, suffix) => {
        t.currentList = fs.readJsonSync(`${triviaset.path}/${suffix}.json`);
        console.log(`${suffix}.json loaded!`);
    };

    this.loadQuestion = () => {
        if (t.currentList === []) {console.log('List not loaded!'); return;}
        var questionCheck = Math.floor(Math.random() * t.currentList.length);
        if (t.used.indexOf(questionCheck) <= -1) {
            t.currentQuestion = t.currentList[questionCheck];
            t.used.push(questionCheck);
            console.log('Used Question #s ' + t.used);
        } else t.loadQuestion();
    };

};

var triviaSesh = {


//TODO YOU ARE HERE

    addPoint : (bot, msg) => {
        var t = triviaSesh;
        var winner = msg.author.name;
        if (t.scorelist[winner] > t.topscore) {t.topscore = t.scorelist[winner]}
        if (!t.scorelist[winner]) {t.scorelist[winner] = 1;}
        else t.scorelist[winner] ++;
        if (t.scorelist[winner] > t.topscore){t.topscore = t.scorelist[winner]}
        triviaSesh.countdown.start(triviaset.timeout).on('end', function() {
            t.end(bot, msg);
        })
    },

    round : (bot, msg) => {
        try {
            var t = triviaSesh;
            var trivTimer = t.timer;
            t.loadQuestion();
            var answers = t.currentQuestion.answers.map((x)=>x.toLowerCase());

            var botAnswers = (bot, msg) => {
                bot.sendMessage(msg, `The answer is **${t.currentQuestion.answers[0]}**!`);
                trivTimer.stop();
                trivTimer.start(1).on('end', function(){t.loop(bot,msg);});
            };

            bot.sendMessage(msg, `**Question #${t.count}**\n${t.currentQuestion["question"]}`);
            bot.on("message", (msg) => {
                var guess = msg.content.toLowerCase();
                var num = answers.indexOf(guess);
                if (num > -1) {
                    bot.sendMessage(msg, `Right answer ${msg.author.name}! ${t.currentQuestion.answers[num]}!`);
                    t.addPoint(bot, msg);
                    trivTimer.stop();
                    trivTimer.start(1).on('end', function(){t.loop(bot,msg);});
                }
            });
            trivTimer.stop();
            trivTimer.start(triviaset.delay).on('end', () => {botAnswers(bot, msg)});

        } catch(err) {console.log(err)}
    },

    loop : (bot, msg) => {
        var t = triviaSesh;
        t.currentQuestion = {};
        if (t.topscore >= triviaset.maxScore) {t.end(bot, msg); }
        else {
            t.count++;
            t.round(bot, msg);
        }
    },

    begin : (bot, msg, suffix) => {
        var t = triviaSesh;
        t.loadlist(bot, msg, suffix);
        t.loop(bot ,msg);
        t.gameon = true;
        triviaSesh.countdown.start(triviaset.timeout).on('end', function(){
            t.end(bot, msg);
        })
    },

    end : (bot, msg) => {
        var t = triviaSesh;
        t.timer.stop();
        var sortable = [];
        for (var score in t.scorelist) {
            sortable.push([score, t.scorelist[score]])
        }
        sortable.sort((a,b) => b[1] - a[1]);
        var str = sortable.join('\n').replace(/,/g, ": ");
        bot.sendMessage(msg, `Trivia Ended!\n\__**Scores:**__\n\`\`\`${str ? str : 'No one had points!'}\`\`\``);
        t.gameon = false;
        t.scorelist = {};
        t.currentList = [];
        t.currentQuestion = {};
        t.used = [];
        t.count = 0;
        triviaSesh.countdown.stop();
    }
};