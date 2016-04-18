//Requires
var Discord = require("discord.js");
var settings = require("./settings/settings.json"), prefixes = settings.prefixes;
var google = require("google");
//invoke bot
var bot = new Discord.Client();

//////////////////////////////////////// COMMANDS ///////////////////////////////////////////////


var commands = {
    goog : {
        usage: "Prints out the first search result for the mentioned terms\n`google [search terms]`",
        delete: true,
        cooldown: 5,
        process: function (bot, msg, suffix){
            var search = "google";
            if(suffix){search = suffix;}
            google(search, function(err, response){
                if(err || !response || !response.links || response.links.length < 1){bot.sendMessage(msg, "Your search resulted in an error. Please forgive me **"+msg.author.username, function(error, sentMessage){bot.deleteMessage(sentMessage, {"wait": 5000})});}
                else {
                    if(response.links[0].link === null){
                        for(var i = 1; i < response.links.length; i++){
                            if (response.links[i].link !== null) {
                                bot.sendMessage(msg, "I searched for **\""+search+"\"** and found this, **"+msg.author.username+"\n"+response.links[i].link);
                                return;
                            }
                        }
                    }
                    else {
                        bot.sendMessage(msg, "I searched for **\""+search+"\"** and found this, **"+msg.author.username+"\n"+response.links[0].link);
                    }
                }
            })
        }
    }
};


////////////////////////////////////TODO FUNCTIONS//////////////////////////////////////////////

//msg checker
bot.on("message", function(msg) {
    if(msg.author === bot.user || msg.channel.isPrivate) return;
    else if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
        var cmdTxt = msg.content.split(' ')[0].substr(1);
        var sufArr = msg.content.split(' '); sufArr.splice(0, 1);
        var suffix = sufArr.join(' ');
        //command handler here
    }
});


////////////////////////////////////DONE FUNCTIONS//////////////////////////////////////////////

//ready
bot.on("ready", function (){
  console.log("elbot is ready");
})
//login
bot.loginWithToken(settings.token);console.log("Logged in using Token");