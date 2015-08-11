var writeConfig = require('../index'),
  broccoli = require('broccoli'),
  config = require('config'),
  path = require('path'),
  util = require('util');

describe('Broccoli config writer', function() {
  it('writes JSON', function() {
    var tree = writeConfig('config.json');
    this.builder = new broccoli.Builder(tree);

    return this.builder.build().then(function( stat ) {
      var pathname = path.resolve(stat.directory, 'config.json'),
        a = util._extend({}, config),
        b = require(pathname);

      assert.deepEqual(a, b);
    });
  });

  it('writes UMD', function() {
    var tree = writeConfig('config.js');
    this.builder = new broccoli.Builder(tree);

    return this.builder.build().then(function( stat ) {
      var pathname = path.resolve(stat.directory, 'config.js'),
        a = util._extend({}, config),
        b = require(pathname);

      assert.deepEqual(a, b);
    });
  });

  it('includes whitelist', function() {
    var tree = writeConfig('config.json', {
      whitelist: [
        'a', 'b'
      ]
    });

    this.builder = new broccoli.Builder(tree);

    return this.builder.build().then(function( stat ) {
      var pathname = path.resolve(stat.directory, 'config.json'),
        config = require(pathname);

      assert.deepEqual(config, {
        a: 1,
        b: 2
      });
    });
  });

  it('excludes blacklist', function() {
    var tree = writeConfig('config.json', {
      blacklist: [
        'a'
      ]
    });

    this.builder = new broccoli.Builder(tree);

    return this.builder.build().then(function( stat ) {
      var pathname = path.resolve(stat.directory, 'config.json'),
        config = require(pathname);

      assert.deepEqual(config, {
        b: 2,
        c: 3
      });
    });
  });

  it('filters config', function() {
    var stub = {
      d: 4,
      e: 5
    };

    var tree = writeConfig('config.json', {
      filter: function() {
        return stub;
      }
    });

    this.builder = new broccoli.Builder(tree);

    return this.builder.build().then(function( stat ) {
      var pathname = path.resolve(stat.directory, 'config.json'),
        config = require(pathname);

      assert.deepEqual(config, stub);
    });
  });

  afterEach(function() {
    if (this.builder) {
      this.builder.cleanup();
    }
  });
});