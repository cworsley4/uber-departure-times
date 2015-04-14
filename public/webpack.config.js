
var path = require('path');
var webpack = require('webpack');
module.exports = {
  context: __dirname,
  entry: './client.js',
  output: {
    path: __dirname + '/dist',
    filename: 'client.min.js'
  },
  resolve: {
    root: [path.join(__dirname, 'bower_components')]
  },
  plugins: [
    new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    )
  ]
};
