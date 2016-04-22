//Requires
var Discord = require("discord.js");
var settings = require("./settings/settings.json"), prefixes = settings.prefixes;
var google = require("google");
//invoke bot
var bot = new Discord.Client();

//////////////////////////////////////// COMMANDS ///////////////////////////////////////////////

var cmdHandlr = function (bot, msg, cmdTxt, suffix) {
    switch (cmdTxt) {
        case "goog" :  case "google" : commands.goog(bot, msg, suffix); break; //TODO FIX GOOGLE CASES
        case "weather" : commands.weather(bot, msg, suffix); break;
        default: return;
    }

};

var commands = {
    goog : function (bot, msg, suffix){
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
    },

    google : this.goog,

    //TODO FIX WEATHER

    weather : function (bot, msg, suffix) {
        if (!suffix) suffix = "Toronto";
        suffix = suffix.replace(" ", "");
        var rURL = (/\d/.test(suffix) == false) ? "http://api.openweathermap.org/data/2.5/weather?q=" + suffix + "&APPID=" + options.weather_api_key : "http://api.openweathermap.org/data/2.5/weather?zip=" + suffix + "&APPID=" + settings.weather_api_key;
        request(rURL, function (error, response, weath) {
            if (!error && response.statusCode == 200) {
                weath = JSON.parse(weath);
                if (!weath.hasOwnProperty("weather")) {
                    return;
                }
                var weatherC = ":sunny:";
                if ((weath.weather[0].description.indexOf("rain") > -1) || (weath.weather[0].description.indexOf("drizzle") > -1)) {
                    weatherC = ":cloud_rain:";
                }
                else if (weath.weather[0].description.indexOf("snow") > -1) {
                    weatherC = ":snowflake:";
                }
                else if (weath.weather[0].description.indexOf("clouds") > -1) {
                    weatherC = ":cloud:";
                }
                else if (weath.weather[0].description.indexOf("storm") > -1) {
                    weatherC = ":cloud_lightning:";
                }
                var direction = Math.floor((weath.wind.deg / 22.5) + 0.5)
                var compass = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
                var msgArray = [];
                var sunrise = new Date(weath.sys.sunrise * 1000)
                var formattedSunrise = (sunrise.getHours()) + ':' + ("0" + sunrise.getMinutes()).substr(-2)
                var sunset = new Date(weath.sys.sunset * 1000)
                var formattedSunset = (sunset.getHours()) + ':' + ("0" + sunset.getMinutes()).substr(-2)
                msgArray.push(":earth_americas: __**Weather for " + weath.name + ", " + weath.sys.country + ":**__ • (*" + weath.coord.lon + ", " + weath.coord.lat + "*)")
                msgArray.push("**" + weatherC + "Current Weather Conditions:** " + weath.weather[0].description)
                msgArray.push("**:sweat: Humidity:** " + weath.main.humidity + "% - **:cityscape:  Current Temperature:** " + Math.round(weath.main.temp - 273.15) + "°C / " + Math.round(((weath.main.temp - 273.15) * 1.8) + 32) + "°F")
                msgArray.push("**:cloud: Cloudiness:** " + weath.clouds.all + "% - **:wind_blowing_face:  Wind Speed:** " + weath.wind.speed + " m/s [*" + compass[(direction % 16)] + "*]")
                msgArray.push("**:sunrise_over_mountains:  Sunrise:** " + formattedSunrise + " UTC / **:city_dusk: Sunset:** " + formattedSunset + " UTC")
                bot.sendMessage(msg, msgArray);
            }
            else {
                console.log(errorC(error));
                bot.sendMessage(msg, "There was an error getting the weather, please try again later.", function (error, sentMessage) {
                    bot.deleteMessage(sentMessage, {"wait": 5000})
                });
            }
        });
    }

};


////////////////////////////////////TO DO FUNCTIONS//////////////////////////////////////////////

//msg checker
bot.on("message", function(msg) {
    if(msg.author === bot.user || msg.channel.isPrivate) return;
    else if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
        var cmdTxt = msg.content.split(' ')[0].substr(1);
        var sufArr = msg.content.split(' '); sufArr.splice(0, 1);
        var suffix = sufArr.join(' ');
        cmdHandlr(bot, msg, cmdTxt, suffix);
    }
});


////////////////////////////////////DONE FUNCTIONS//////////////////////////////////////////////


//msg checker
bot.on("message", function(msg) {
    if(msg.author === bot.user || msg.channel.isPrivate) return;
    else if (prefixes.indexOf((msg.content.substr(0, 1))) > -1 ) {
        var cmdTxt = msg.content.split(' ')[0].substr(1);
        var sufArr = msg.content.split(' '); sufArr.splice(0, 1);
        var suffix = sufArr.join(' ');
        console.log(cmdTxt); console.log(suffix)
        cmdHandlr(bot, msg, cmdTxt, suffix);
    }
});


//ready
bot.on("ready", function (){
  console.log("elbot is ready");
})


//login
bot.loginWithToken(settings.token);console.log("Logged in using Token");