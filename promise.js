'use strict';

var Promise = require('bluebird');
var winston = require('winston');

Promise.prototype.respond = function(res) {

  var self = this;

  return self.then(function(obj) {
    obj = obj || {};
    winston.info(obj);

    if (obj.status) {
      res.status(obj.status);
    } else {
      res.json(obj);
    }
  })
  .catch(function(err) {
    var obj = {
      error: err.message
    };
    winston.info(obj);
    res.status(500).json(obj);
  });

};

module.exports = Promise;
