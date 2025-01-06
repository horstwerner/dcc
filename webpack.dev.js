const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, './build'),
    },
    proxy: {
      '/api': 'http://localhost:3001',
      '/images': 'http://localhost:3001'
    },
    open: ['http://localhost:8080'],
    hot: true,
  }
})
