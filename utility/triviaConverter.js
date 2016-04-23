var LineByLineReader = require('line-by-line');
var prompt = require('prompt');
var fs = require('fs');
var jsonfile = require('jsonfile');
jsonfile.spaces = 2;

prompt.start();

prompt.get(['filename', 'separator'], function (err, result) {
    var onErr = function(err) {console.log(error); return 1;};
    (error) => onErr(err);
    console.log('Command-line input received:');
    console.log('  File Name: ' + result.filename);
    console.log('  Separator: ' + result.separator);
    writer(result);
});

// var result = {"filename" : "starwars.txt", "separator": "1"}; Uncomment for debug

function writer(result) {
    var resultJson = [];
    var lr = new LineByLineReader(result.filename);

    lr.on('error', function (err) {
        console.log('Error loading trivia list!');
        throw err;
    });

    lr.on('line', function (line) {
        var objTemp = {question: '', answers: []};
        var questionsAnswers = line.split(result.separator);
        objTemp.question = questionsAnswers[0];
        objTemp.answers = questionsAnswers.slice(1);
        resultJson.push(objTemp);
    });

    lr.on('end', function () {
        var file = result.filename.slice(0, -4) + ".json";
        jsonfile.writeFile(file, resultJson, function (err) {
            (err) => console.error(err);
            console.log(`Succesfully wrote ${file}!`);
        })
    });
}
