var express = require('express')
var bodyParser = require('body-parser')
var path = require("path");
var googleTrendsApi = require("google-trends-api")
var randomWords = require('random-words');
var chance = require('chance')

var app = express()
//support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({extended: true}));

app.listen(3000)

app.use(express.static(__dirname))

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client.html');
})


app.post('/fetch', function(req, res) {
  console.log(req.body);
  req.body = req.body == undefined
    ? {
      operation: undefined
    }
    : req.body;
  switch (req.body.operation) {
    case "randomWord":
    res.send(JSON.stringify({word:randomWords()}));
    return
    break;
    case "trending":
    //if(chance.integer({min: 1, max: 4}) == 1) req.body.data.topic = randomWords();
      googleTrendsApi.relatedQueries({keyword: req.body.data.topic}).then(function(e) {
        res.send(e);
      })
      return;
      break;
    case "interestByRegion":
      googleTrendsApi.interestByRegion({keyword: req.body.data.topic}).then(function(e) {
        res.send(e);
      })
      return;
      break;
    default:
      googleTrendsApi.interestByRegion({keyword: "Kim Kardashian"}).then(function(e) {
        res.send(e)
      })

      break;
  }
})
