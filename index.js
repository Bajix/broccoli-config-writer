var Writer = require('broccoli-writer'),
  selectn = require('selectn'),
  config = require('config'),
  wrap = require('umd-wrap'),
  RSVP = require('rsvp'),
  path = require('path'),
  util = require('util'),
  fs = require('fs');

function ConfigWriter( outputFile, options ) {
  if (!(this instanceof ConfigWriter)) {
    return new ConfigWriter(outputFile, options);
  }

  this.outputFile = outputFile;
  this.options = options || {};
}

ConfigWriter.prototype = Object.create(Writer.prototype);
ConfigWriter.prototype.constructor = ConfigWriter;

ConfigWriter.prototype.setValue = function( data, path, value ) {
  var parts = path.split('.').map(function( key ) {
    var val = parseInt(key, 10);
    return isNaN(val) ? key : val;
  }), key = parts.shift();

  if (parts.length) {

    if (!data.hasOwnProperty(key)) {
      data[key] = typeof parts[0] === 'number' ? [] : {};
    }

    return this.setValue(data[key], parts.join('.'), value);
  }

  data[key] = value;
};

ConfigWriter.prototype.delKey = function( data, path ) {
  var parts = Array.isArray(path) ? path : path.split('.').map(function( key ) {
    var val = parseInt(key, 10);
    return isNaN(val) ? key : val;
  }), key = parts.shift();

  if (data && data.hasOwnProperty(key)) {
    if (parts.length) {
      return this.delKey(data[key], parts.join('.'));
    }

    if (typeof key === 'number' && data instanceof Array) {
      data.splice(key, 1);
    } else {
      delete data[key];
    }
  }
};

ConfigWriter.prototype.getConfig = function() {
  var whitelist = this.options.whitelist,
    blacklist = this.options.blacklist || [],
    filter = this.options.filter,
    data = {},
    i;

  if (whitelist) {
    whitelist = whitelist.map(function( key ) {
      return key.replace(/\[(\d+)\]/g, '.$1');
    }).sort();

    for (i = 0; i < whitelist.length; i++) {
      var key = whitelist[i];
      this.setValue(data, key, selectn(key, config));
    }
  } else {
    util._extend(data, config);
  }

  if (blacklist) {
    blacklist = blacklist.map(function( key ) {
      return key.replace(/\[(\d+)\]/g, '.$1');
    }).sort().reverse();

    for (i = 0; i < blacklist.length; i++) {
      this.delKey(data, blacklist[i]);
    }
  }

  if (filter) {
    return filter.call(this, data);
  }

  return data;
};

ConfigWriter.prototype.write = function( readTree, destDir ) {
  var pathname = path.resolve(destDir, this.outputFile),
    extname = path.extname(pathname),
    data = this.getConfig();

  var out = JSON.stringify(data, null, 2);

  if (extname === '.json') {
    return fs.writeFileSync(pathname, out);
  }

  return new RSVP.Promise(function( resolve, reject ) {
    wrap({
      code: out,
      exports: 'config'
    }, function( err, out ) {
      if (err) {
        return reject(err);
      }
      resolve(out);
    });
  }).then(function( out ) {
    fs.writeFileSync(pathname, out);
  });
};

module.exports = ConfigWriter;