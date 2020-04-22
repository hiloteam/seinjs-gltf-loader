#!/usr/bin/env node
/**
 * @File   : server.dev.js
 * @Author : dtysky(dtysky@outlook.com)
 * @Date   : 2018-6-8 15:57:09
 * @Description:
 */
const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config');
const port = 8888;

const devServer = () => {
  const server = new WebpackDevServer(webpack(config), {
    compress: false,
    progress: true,
    hot: true,
    open: true,
    publicPath: config.output.publicPath,
    contentBase: path.resolve(__dirname),
    watchContentBase: false,
    watchOptions: {
      ignored: /node_modules/
    },
    https: false,
    overlay: true,
    historyApiFallback: true
  });

  server.listen(port, '0.0.0.0', (error) => {
    if (error) {
      console.log('webpack dev server failed', error);
    }
    console.info('==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.', port, port);
  });
}
devServer();
