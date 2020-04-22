#!/usr/bin/env node
/**
 * @File   : webpack.config.js
 * @Author : dtysky(dtysky@outlook.com)
 * @Date   : 2018-6-8 15:55:42
 * @Description:
 */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const PNGCompressProcessor = require('seinjs-png-compress-processor');

const isDEV = process.env.NODE_ENV !== 'production';

const pngCompressProcessor = new PNGCompressProcessor({
  psize: 255
});

module.exports = {
  mode: isDEV ? 'development' : 'production',
  devtool: 'none',

  entry: {
    main: isDEV
    ? [
      'webpack-dev-server/client?/',
      'webpack/hot/dev-server',
      path.resolve(__dirname, './index.ts')
    ]
    : path.resolve(__dirname, './index.ts')
    
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    publicPath: '/'
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },

  externals: {
    'fs': true,
    'path': true,
  },
  
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        use: [
          {
            loader: "awesome-typescript-loader"
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /\.(gltf|glb)$/,
        use: [
          {
            loader: path.resolve(__dirname, '../lib/index.js'),
            options: {
              compress: {
                enabled: true,
                quantization: {
                  POSITION: 14
                }
              },
              compressTextures: {
                enabled: true,
                quality: 'medium',
                excludes: [
                  /map/g
                ],
                s3tc: {
                  enabled: true
                },
                etc: {
                  enabled: true
                }
              },
              glb: {
                enabled: true,
                excludes: [
                  /map/g,
                  /pack\d\.png/g
                ]
              },
              base64: {
                enabled: false,
                threshold: 100000000,
                includeGlTF: true,
                excludes: [/\.mp3$/g]
              },
              process: {
                enabled: true,
                processors: [pngCompressProcessor]
              },
              publish: {
                enabled: false,
                exclude: [],
                publisher: {
                  async publish(options) {
                    console.log('publish', options);

                    return options.distPath;
                  }
                }
              }
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg|mp4)$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 15000
          }
        }
      }
    ]
  },

  plugins: isDEV
    ? [
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({template: './demo/index.html'})
    ]
    : [
      new CleanWebpackPlugin(
        ['*'],
        {root: path.resolve(__dirname, 'dist')}
      ),
      new HtmlWebpackPlugin({template: './demo/index.html'})
    ]
};
