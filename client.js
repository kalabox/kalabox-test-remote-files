'use strict';

var _ = require('lodash');
var shared = require('./shared.js');
var Promise = shared.Promise;
var urls = require('url');
var rest = require('restler');
var config = require('./config.json');
var VError = require('verror');
var format = shared.format;
var pp = shared.pp;

function Client(address) {
  this.target = urls.parse(address);
}

Client.prototype.request = function(method, pathname, data) {

  var self = this;

  var opts = {data: data};

  var urlObj = _.extend(self.target, {pathname: pathname});

  var url = urls.format(urlObj);

  return new Promise(function(fulfill, reject) {
    rest[method](url, opts)
    .on('success', fulfill)
    .on('fail', function(data) {
      reject(new Error(shared.pp(data)));
    })
    .on('error', reject);
  })
  .timeout(10 * 1000)
  .catch(function(err) {
    var dataString = shared.pp(data);
    throw new VError(
      err,
      'Error during REST request. url=%s data=%s',
      [method, url].join(':'),
      dataString
    );
  });

};

Client.prototype.create = function(id, contents) {

  var self = this;

  return self.request('postJson', 'file/v1/' + id, contents)
  .catch(function(err) {
    throw new VError(err, 'Error creating file: "%s".', id);
  });

};

Client.prototype.remove = function(id) {

  var self = this;

  return self.request('del', 'file/v1/' + id)
  .catch(function(err) {
     throw new VError(err, 'Error removing file: "%s".', id);
  });

};

Client.prototype.stats = function(id) {
  
  var self = this;

  return self.request('get', 'file/v1/' + id)
  .catch(function(err) {
    throw new VError(err, 'Error getting file stats: "%s".', id);
  });

};

var fileId = 'foobarbazz.txt';

var client = new Client(config.url);
//client.create(fileId, 'this is a file!')
client.create(fileId, null)
//.delay(15 * 1000)
.then(function() {
  return client.stats(fileId)
  .then(function(data) {
    console.log('1 -> ' + pp(data));
  });
})
//.delay(15 * 1000)
.then(function() {
  return client.remove(fileId);
})
.then(function() {
  return client.stats(fileId)
  .then(function(data) {
    console.log('2 -> ' + pp(data));
  });
})
.then(function() {
  console.log('done');
});
