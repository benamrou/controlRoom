
const webpack = require('webpack');
const path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var ManifestPlugin = require('webpack-manifest-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: {
      'polyfills': './src/polyfills.ts',
      'icr': './src/main.ts'
    },
    output: { 
      filename: '[name].[hash].js',
      path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loaders: [
                    'babel-loader',
                    {
                        loader: 'awesome-typescript-loader',
                        options: {
                            configFileName: helpers.root('tsconfig.json')
                        }
                    },
                    'angular2-template-loader',
                    'angular-router-loader'
                ],
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
            loader: 'style-loader'
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')
                ];
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          }
        ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.css', '.scss', '.html'],
        alias: {
            '@': path.resolve(__dirname, 'src/app/'),
        }
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        title: 'ICR',
        filename: 'index.html',
        template: 'src/index.html',
        chunks: ['polyfills', 'ICR']
      }),
      new ManifestPlugin(),
      new CopyWebpackPlugin([
        { from: './src/assets', to: 'assets' },
        { from: './src/favicon.ico', to: './' },
      ])
    ], 
    optimization: {
        splitChunks: {
          chunks: 'async',
          minSize: 30000,
          maxSize: 0,
          minChunks: 1,
          maxAsyncRequests: 5,
          maxInitialRequests: 3,
          automaticNameDelimiter: '~',
          name: true,
          cacheGroups: {
            default: false
            /*vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true
            }*/
          }
        }
      },
    devServer: {
        historyApiFallback: true
    }
};