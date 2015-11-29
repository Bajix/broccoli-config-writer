var Writer = require('broccoli-writer'),
  selectn = require('selectn'),
  config = require('config'),
  wrap = require('umd-wrap'),
  RSVP = require('rsvp'),
  path = require('path'),
  fs = require('fs');

config.util.setModuleDefaults('browserConfig', {});

function ConfigWriter( outputFile, options ) {
  if (!(this instanceof ConfigWriter)) {
    return new ConfigWriter(outputFile, options);
  }

  this.outputFile = outputFile;
  this.options = config.util.extendDeep({}, config.browserConfig, options);
}

ConfigWriter.prototype = Object.create(Writer.prototype);
ConfigWriter.prototype.constructor = ConfigWriter;

ConfigWriter.prototype.setValue = function( data, path, val ) {
  var parts = path.split('.').map(function( key ) {
    var val = parseInt(key, 10);
    return isNaN(val) ? key : val;
  }), key = parts.shift();

  if (val && typeof val === 'object') {
    val = this.extendDeep(Array.isArray(val) ? [] : {}, val);
  }

  if (parts.length) {

    if (!data.hasOwnProperty(key)) {
      data[key] = typeof parts[0] === 'number' ? [] : {};
    }

    return this.setValue(data[key], parts.join('.'), val);
  }

  data[key] = val;
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

ConfigWriter.prototype.extendDeep = function( origin, add ) {
  if (!add || typeof add !== 'object') {
    return origin;
  }

  var keys = Object.keys(add),
    i = keys.length;

  while (i--) {
    var key = keys[i],
      val = add[key];

    if (val && typeof val === 'object') {
      origin[key] = this.extendDeep(Array.isArray(val) ? [] : {}, val);
    } else {
      origin[key] = val;
    }
  }

  return origin;
};

ConfigWriter.prototype.getConfig = function() {
  var include = this.options.include || [],
    exclude = this.options.exclude || [],
    filter = this.options.filter,
    data = {},
    i;

  if (include.length) {
    include = include.map(function( key ) {
      return key.replace(/\[(\d+)\]/g, '.$1');
    }).sort();

    for (i = 0; i < include.length; i++) {
      var key = include[i];
      this.setValue(data, key, selectn(key, config));
    }
  } else {
    this.extendDeep(data, config);
  }

  exclude.push('browserConfig');
  exclude = exclude.map(function( key ) {
    return key.replace(/\[(\d+)\]/g, '.$1');
  }).sort().reverse();

  for (i = 0; i < exclude.length; i++) {
    this.delKey(data, exclude[i]);
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