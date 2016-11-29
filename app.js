'use strict';

var express = require('express');
var path = require('path');

// Constants
var PORT = process.env.PORT || 2327;

// App
var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(PORT);

console.log('Magic happens on port:' + PORT);