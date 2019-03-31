const path = require("path"),
      HtmlWebpackPlugin = require("html-webpack-plugin"),
      {BundleAnalyzerPlugin} = require("webpack-bundle-analyzer"),
      CleanWebpackPlugin = require("clean-webpack-plugin"),
      TerserPlugin = require("terser-webpack-plugin"),
      webpack = require("webpack");

module.exports = (env, argv) => {  // eslint-disable-line max-lines-per-function
  const DEBUG = argv.mode !== "production";
  return {
    "devServer": {
      "compress": true,
      "host": "0.0.0.0",
      "open": true,
      "useLocalIp": true
    },
    "devtool": false,
    "entry": {
      "index": path.resolve(__dirname, "index.jsx")
    },
    "module": {
      "rules": [
        {
          "enforce": "pre",
          "exclude": /node_modules/u,
          "loader": "eslint-loader",
          "options": {
            "configFile": path.resolve(__dirname, ".eslintrc.js"),
            "fix": true
          },
          "test": /\.jsx?$/u
        },
        {
          "exclude": /node_modules/u,
          "test": /\.jsx?$/u,
          "use": [
            {
              "loader": "babel-loader",
              "options": {
                "plugins": ["@babel/plugin-syntax-dynamic-import", ["babel-plugin-styled-components", {"displayName": DEBUG}]].concat(DEBUG ? [] : [["transform-react-remove-prop-types", {"removeImport": true}]]),
                "presets": ["@babel/preset-react"]
              }
            }
          ]
        }
      ]
    },
    "optimization": {
      "minimizer": [
        new TerserPlugin({
          "terserOptions": {
            "output": {
              "comments": false
            }
          }
        })
      ],
      "runtimeChunk": {
        "name": "vendors"
      },
      "splitChunks": {
        "cacheGroups": {
          "vendors": {
            "chunks": "all",
            "name": "vendors",
            "test": /[\\/]node_modules[\\/]/u
          }
        }
      }
    },
    "output": {
      "filename": `[name].${argv.mode}.[chunkhash].js`,
      "libraryTarget": "umd",
      "path": path.resolve(__dirname, "dist")
    },
    "plugins": [
      new CleanWebpackPlugin(["dist"]),
      new webpack.DefinePlugin({
        "DEBUG": JSON.stringify(DEBUG)
      }),
      new HtmlWebpackPlugin({
        "filename": "index.html",
        "minify": {
          "collapseWhitespace": !DEBUG,
          "removeComments": !DEBUG
        },
        "template": path.resolve(__dirname, "index.ejs")
      }),
      new BundleAnalyzerPlugin({
        "analyzerMode": "static",
        "openAnalyzer": false
      })
    ],
    "target": "web"
  };
};
