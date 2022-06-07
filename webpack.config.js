const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


module.exports = function(webpackEnv) {
  const isEnvDevelopment = webpackEnv.development;
  const isEnvProduction = webpackEnv.production;
  console.log(webpackEnv);

  return ({
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "bundle.js",
      devtoolLineToLine: true,
      sourceMapFilename: "./bundle.js.map",
      pathinfo: true,
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
            {loader: 'css-loader', options: {sourceMap: true, modules:true, url: false}}
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
    devtool: isEnvProduction ? 'source-map' : 'inline-source-map',
    devServer: {
      proxy: {
            '/api': 'http://localhost:3001',
            '/images': 'http://localhost:3001'

      }
    }
  });
};

