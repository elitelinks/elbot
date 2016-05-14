"use strict"
var fs = require('fs-extra');
var Timer = require("timer.js");
var settings = require("../settings/settings.json");
var bank = require("../modules/bank");
var bankSet = fs.readJsonSync("./settings/bank.json");

exports.slot= (bot, msg, suffix) => {
    var id = msg.author.id;
    if (bank.check(bot, msg) === false) {return;}
    if (msg.channel.id !== settings.gamesroom) {return;}
    var bid = parseInt(suffix.toString().replace(/[\D]g/, ''), 10);
    if (bank.accounts[id].balance < bid) {bot.reply(msg, `Not enough credits dummy!`); return;}
    if (!bid || bid < bankSet.settings.minBet || bid > bankSet.settings.maxBet || isNaN(bid)) {
        bot.reply(msg, `You must place a bid between ${bankSet.settings.minBet} and ${bankSet.settings.maxBet}`); return;
    }
    bank.subtract(id, bid);
    var slotTime = new Timer();
    var reel_pattern = [":cherries:", ":cookie:", ":two:", ":seven:", ":four_leaf_clover:" ,":cyclone:", ":sunflower:", ":six:", ":beer:", ":mushroom:", ":heart:", ":snowflake:"];
    var padding_before = [":mushroom:", ":heart:", ":snowflake:"];
    var padding_after = [":cherries:", ":cookie:", ":two:"];
    var reel = padding_before.concat(reel_pattern, padding_after);
    var reels = [];

    try {
        for (var x = 0; x < 3; x++) {
            var n = Math.floor(Math.random() * reel_pattern.length) + 3;
            reels.push([reel[n - 1], reel[n], reel[n + 1]])
        }
    } catch (err) {console.log(err);}

    var line;
    try {
        line = [reels[0][1], reels[1][1], reels[2][1]];
    } catch(err) {console.log(err);}

    var display_reels;
    try {
        display_reels = "  " + reels[0][0] + " " + reels[1][0] + " " + reels[2][0] + "\n";
        display_reels += ">" + reels[0][1] + " " + reels[1][1] + " " + reels[2][1] + "\n";
        display_reels += "  " + reels[0][2] + " " + reels[1][2] + " " + reels[2][2] + "\n"
    } catch (err) {console.log(err)}

    try {
        if (line[0] == ":seven:" && line[1] == ":seven:" && line[2] == ":seven:") {
            bid *= 777;
            bot.sendMessage(msg, `${display_reels}${msg.author.mention()} `+ 
                `JACKPOT MOTHERFUCKER! +800! Your bet is multiplied * 777! ${bid}!`);
        }
        else if (line[0] == ":four_leaf_clover:" && line[1] == ":four_leaf_clover:" && line[2] == ":four_leaf_clover:") {
            bid *= 4;
            bank.add(id, bid);
            bot.sendMessage(msg, `${display_reels}${msg.author.mention()}3 Clovers! Your bet is multiplied * 4! ${bid}!`);
        }
        else if (line[0] == ":cherries:" && line[1] == ":cherries:" && line[2] == ":cherries:") {
            bid *= 4;
            bank.add(id, bid);
            bot.sendMessage(msg, `${display_reels}${msg.author.mention()} Three cherries! Your bet is multiplied * 4! ${bid}!`);
        }
        else if (line[0] == ":beer:" && line[1] == ":beer:" && line[2] == ":beer:") {
            bid *= 3;
            bank.add(id, bid);
            bot.sendMessage(msg, `${display_reels}${msg.author.mention()} Three beers! Your bet is multiplied * 3! ${bid}!`);
        }
        else if (line[0] == ":cherries:" && line[1] == ":cherries:" || line[1] == ":cherries:" && line[2] == ":cherries:") {
            bid *= 2;
            bank.add(id, bid);
            bot.sendMessage(msg, `${display_reels}${msg.author.mention()} Two cherries! Your bet is multiplied * 2! ${bid}!`);
        }
        else if (line[0] == line[1] == line[2]) {
            bank.add(id, bid);
            bot.sendMessage(msg, `${display_reels}${msg.author.mention()} Two symbols! Credits Back! `);
        }
        else {
            bot.sendMessage(msg, `${display_reels}${msg.author.mention()} Nothing! Lost bet.`)
        }
    } catch(err) {console.log(err);}
    try {
        slotTime.start(.1).on('end', () => {bot.reply(msg, `Credits left: **${bank.accounts[id].balance}**`)})
    } catch (err) {
        console.log(err);
    }
    bank.reload();
};
