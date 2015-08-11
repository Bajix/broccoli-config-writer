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
  var i = path.indexOf('.');
  if (~i) {
    var key = path.slice(0, i);
    path = path.slice(i);
    data = data[key] = data[key] || {};
    this.setValue(data, path, value);
  } else {
    data[path] = value;
  }
};

ConfigWriter.prototype.delKey = function( data, path ) {
  var i = path.indexOf('.');
  if (~i) {
    var key = path.slice(0, i);
    path = path.slice(i);
    data = data[key];
    if (typeof data === 'object') {
      this.delKey(data, path);
    }
  } else {
    delete data[path];
  }
};

ConfigWriter.prototype.getConfig = function() {
  var whitelist = this.options.whitelist,
    blacklist = this.options.blacklist || [],
    filter = this.options.filter,
    data = {},
    i;

  if (whitelist) {
    for (i = 0; i < whitelist.length; i++) {
      var key = whitelist[i];
      this.setValue(data, key, selectn(key, config));
    }
  } else {
    util._extend(data, config);
  }

  if (blacklist) {
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