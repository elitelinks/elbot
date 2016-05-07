var LineByLineReader = require('line-by-line');
var prompt = require('prompt');
var fs = require('fs');
var jsonfile = require('jsonfile');
var isDirectory = false;
var dirSeparator = '';
jsonfile.spaces = 2;

prompt.start();

function onErr(err) {
    console.log(err);
    return 1;
}

var schema = {
    properties: {
        file : {
            name: 'file',
            description: 'File or Directory',
            type: 'string',
            required: true,
            message: 'Enter a file or directory name'
        },
        separator : {
            name: 'separator',
            description: 'The Character that separates the Questions/Answers',
            type: 'string',
            required: true,
            message: 'Enter a separator character.'
        },
        directory : {
            name: 'directory',
            description: 'Is this a directory? (yes/no)',
            type: 'string',
            pattern: /^\w+$/,
            required: true,
            message: 'Enter yes or no.'
        }
    }
};

prompt.get(schema, (err, result) => {
    if (err) { return onErr(err); }
    console.log('Command-line input received:');
    console.log('  File Name: ' + result.file);
    console.log('  Separator: ' + result.separator);
    console.log('  Directory: ' + result.directory);
    if(result.directory === 'y' || result.directory === 'yes') {
        isDirectory = true;
        dirSeparator = result.separator;
        dirWriter(result);
    } else {writer(result);}
});

function dirWriter(result) {
    fs.readdir(result.file, (err, files) => {
        if (err) {return onErr(err);}
        else files.forEach((file) => {
           var full = result.file + file;
           if (file.substr(-4) === '.txt') {writer(full)};
        });
    });
}

function writer(result) {
    var thingToRead;
    isDirectory ? thingToRead = result : thingToRead = result.file;
    var resultJson = [];
    var lr = new LineByLineReader(thingToRead);

    lr.on('error', function (err) {
        console.log('Error loading trivia list!');
        throw err;
    });

    lr.on('line', function (line) {
        var objTemp = {question: '', answers: []};
        var questionsAnswers = line.split(isDirectory ? dirSeparator : result.separator);
        objTemp.question = questionsAnswers[0];
        objTemp.answers = questionsAnswers.slice(1);
        resultJson.push(objTemp);
    });

    lr.on('end', function () {
        var file = thingToRead.slice(0, -4) + ".json";
        jsonfile.writeFile(file, resultJson, (err) => {
            if (err) { return onErr(err); }
            console.log(`Succesfully wrote ${file}!`);
        })
    });
}
