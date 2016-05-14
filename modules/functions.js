const settings = require('../settings/settings.json')

//Breaks up a message and stores it's options in an object
exports.getOpt = (msg, obj) => {
    obj.sufArr = msg.content.split(' ');
    obj.cmdTxt = obj.sufArr[0].substr(1);
    if (settings.alias.hasOwnProperty(obj.cmdTxt)) obj.cmdTxt = settings.alias[obj.cmdTxt];
    obj.sufArr.splice(0, 1);
    obj.subCmd = obj.sufArr[0];
    obj.suffix = obj.sufArr.join(' ');
    obj.id = msg.author.id;
    obj.name = msg.author.name;
    obj.opt = [msg, obj.suffix, obj.id, obj.name, obj.cmdTxt, obj.subCmd, obj.sufArr];
};

exports.adminCheck = (bot, msg) => {
    if (settings.owners.indexOf(msg.author.id) <= -1) {
        bot.reply(msg, "You don't have permission to do that!");
        return false;
    } else {
        return true;
    }
};

exports.commandAvailable = (cmd, arr) => {
    if (!cmd || !arr) {console.log()}
    if (arr.indexOf(cmd) > -1) return true;
    else return false;
};

exports.getUserName = (msg, searchTerm) => {
    var toSearch = new RegExp(searchTerm, "i");
    return msg.channel.server.members.get('name', toSearch);
};

exports.getUserID = (msg, srch) => {
    var toSearch = new RegExp(srch, "i");
    return msg.channel.server.members.get('id', toSearch);
};

exports.getUserAvatar = (msg, srch) => {
    var toSearch = new RegExp(srch, "i");
    return msg.channel.server.members.get('avatar', toSearch);
};

