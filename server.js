'use strict';

var VError = require('verror');
var _ = require('lodash');
var bodyParser = require('body-parser');
var config = require('./config.json');
var express = require('express');
var fs = require('fs');
var path = require('path');
var uuid = require('uuid');
var shared = require('./shared.js');
var winston = require('winston');
var Promise = shared.Promise;
var url = require('url');

var app = express();

app.use(bodyParser.json());

/*
 * Create file.
 */
app.post('/file/v1/:id', function(req, res, next) {

  var id = req.params.id;

  var contents = req.body.data;

  shared.file.create(id, JSON.stringify(contents))
  .respond(res)
  .nodeify(next);

});

/*
 * Return file info.
 */
app.get('/file/v1/:id', function(req, res, next) {

  var id = req.params.id;

  shared.file.getStats(id)
  .then(function(stats) {
    return stats || {status: 404};
  })
  .respond(res)
  .nodeify(next);

});

/*
 * Update file.
 */
app.put('/file/v1/:id', function(req, res, next) {
  
  Promise.reject('Not implemented!')
  .respond(res)
  .nodeify(next);

});

/*
 * Delete file.
 */
app.delete('/file/v1/:id', function(req, res, next) {

  var id = req.params.id;

  shared.file.remove(id)
  .respond(res)
  .nodeify(next);
  
});

var port = url.parse(config.url).port;
Promise.fromNode(function(cb) {
  app.listen(port, cb);
})
.then(function() {
  winston.info('Listening on port: ' + port);
});
