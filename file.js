'use strict';

var _ = require('lodash');
var format = require('util').format;
var fs = require('fs');
var path = require('path');
var Promise = require('./promise.js');
var sha1 = require('sha1');
var VError = require('verror');
var pp = require('util').inspect;

/*
 * Database of file ids. Used to make sure you can only delete files that
 * were also created using this interface.
 */
var db = {};

/*
 * Create a file.
 */
exports.create = function(id, contents) {
  // Open file for writing and fail if it already exists.
  return Promise.fromNode(function(cb) {
    fs.open(id, 'wx+', cb);
  })
  // Write contents to file.
  .then(function(fd) {
    return Promise.fromNode(function(cb) {
      fs.write(fd, contents, 0, 'utf8', cb);
    })
    // Make sure to close the file descriptor.
    .finally(function() {
      fs.close(fd);
    });
  })
  // Add to file db.
  .then(function() {
    db[id] = true;
  })
  // Wrap errors.
  .catch(function(err) {
    throw new VError(err, 'Error creating file: "%s"', id);
  });
};

/*
 * Get file stats.
 */
exports.getStats = function(id) {
  // Read contents of file.
  // @todo @bcauldwell - See if we can do this in a buffered way.
  return Promise.fromNode(function(cb) {
    fs.readFile(id, {encoding: 'utf8'}, cb);  
  })
  .then(function(contents) {
    return contents || '';
  })
  .catch(function(err) {
    if (err.code === 'ENOENT') {
      console.log('aaaaaaa -> ' + err);
      return null;
    }
    throw err;
  })
  // Build stats object.
  .then(function(contents) {
    //console.log('contents -> ' + pp(contents));
    if (contents) {
      return {
        exists: true,
        id: id,
        hash: sha1(contents)
      };
    } else {
      return {
        exists: false
      };
    }
  })
  // Wrap errors.
  .catch(function(err) {
    throw new VError(err, 'Error getting stats: "%s"', id);
  });
};

/*
 * Remove a file.
 */
exports.remove = function(id) {
  // Make sure file being removed was also created using this interface.
  return Promise.try(function() {
    if (!db[id]) {
      var msg = format('Cannot remove "%s" because it was created using' +
        ' this interface.', id);
      throw new Error(msg);
    }
  })
  // Remove the file.
  .then(function() {
    return Promise.fromNode(function(cb) {
      fs.unlink(id, cb);
    });
  })
  // Wrap errors.
  .catch(function(err) {
    throw new VError(err, 'Error removing file: "%s"', id);
  });
};
