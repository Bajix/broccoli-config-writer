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
        'a',
        'b',
        'e[1]',
        'd.x.y',
        'e[0]'
      ]
    });

    this.builder = new broccoli.Builder(tree);

    return this.builder.build().then(function( stat ) {
      var pathname = path.resolve(stat.directory, 'config.json'),
        config = require(pathname);

      assert.deepEqual(config, {
        a: 1,
        b: 2,
        d: {
          x: {
            y: 25
          }
        },
        e: [
          0,
          1
        ]
      });
    });
  });

  it('excludes blacklist', function() {
    var tree = writeConfig('config.json', {
      blacklist: [
        'e[3]',
        'a',
        'd.z',
        'e[1]',
        'e[0]'
      ]
    });

    this.builder = new broccoli.Builder(tree);

    return this.builder.build().then(function( stat ) {
      var pathname = path.resolve(stat.directory, 'config.json'),
        config = require(pathname);

      assert.deepEqual(config, {
        b : 2,
        c : 3,
        d : {
          x : {
            y : 25
          }
        },
        e : [
          2
        ]
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