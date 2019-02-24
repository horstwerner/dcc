const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = function(webpackEnv) {
  const isEnvDevelopment = webpackEnv.development;
  const isEnvProduction = webpackEnv.production;
  console.log(webpackEnv);
  const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

  return ({
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: path.resolve(__dirname, "src"),
          exclude: /(node_modules)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"]
            }
          }
        },
        {
          test: /\.css$/,
          use: [
              'style-loader',
            {loader: 'css-loader', options: {sourceMap: true, modules:true}}
          ],
        }
      ]
    },
    resolve: {
      alias: {
        '@symb': path.resolve(__dirname, 'src/symb'),
        '@img': path.resolve(__dirname, 'src/img'),
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Setting up webpack 4',
        template: 'index.html',
        inject: true,
        minify: {
          removeComments: true,
          collapseWhitespace: true
        },
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: isEnvDevelopment ? '[name].css' : '[name].[hash].css',
        chunkFilename: isEnvDevelopment ? '[id].css' : '[id].[hash].css',
      })
    ],
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    // Stop compilation early in production
    bail: isEnvProduction,
    devtool: 'inline-source-map',
    devServer: {
      proxy: {
            '/api': 'http://localhost:3001'
      }
    }
  });
};

