const path = require('path');

module.exports = {
  entry: ['.\\src\\ab_torrent_sorter.user.js'],
  output: {
    filename: 'ab_torrent_sorter.user.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
        { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },
  mode: 'development',
  devtool: 'source-map'
};