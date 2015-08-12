Broccoli Config Writer

[ ![Codeship Status for Bajix/broccoli-config-writer](https://codeship.com/projects/2d89fe70-2230-0133-7c51-52bb0fef976f/status?branch=master)](https://codeship.com/projects/96064)
------

A broccoli plugin for writing a subset of your [config](https://www.npmjs.com/package/config) settings into an AMD & CommonJS compatible module.

The use case here is to create isomorphic config settings, such that your settings can be maintained a single place, complete with hierarchical overriding to allow for things such as environment specific settings.


## Install
From NPM:

> npm install broccoli-config-writer --save

## Documentation

### `writeConfig(outputFile, options)`

`outputFile` *{String}*

The file path to write your configuration to.

Supported extensions are `.json` and `.js`, which output JSON files or UMD modules, respectfully

`options` *{Object}*

Optional. This defaults to your `config.browserConfig` options, and is extended by the passed options. Hence, this can be entirely maintained solely within your config settings.

- `whitelist` *{Array}*

List of paths of config to include. Resolves deeply-nested object properties via dot or bracket-notation, and populates objects as needed. If omitted, clones config.

- `blacklist` *{Array}*

List of paths of config to exclude. Resolves deeply-nested object properties via dot or bracket-notation, and populates objects as needed

- `filter` *{function}*

Callback function to modify config object directly. Optional.

## Example

```
// .
// ├── config
// │   ├── default.json
// │   └── test.json

// default.json
// {
//   "hosts": { ... }
//   "facebook" { ... },
//   "browserConfig": [
//     "hosts",
//     "facebook.appID",
//     "facebook.key"
//   ]
// }

var writeConfig = require('broccoli-config-writer'),
  mergeTrees = require('broccoli-merge-trees'),
  funnel = require('broccoli-funnel');

var coreAssets = 'assets';

var vendorAssets = 'vendor';

var assets = mergeTrees([
  writeConfig('config.js'),
  vendorAssets,
  coreAssets
], {
  overwrite: true
});

module.exports = funnel(assets, {
  destDir: 'assets'
});
```