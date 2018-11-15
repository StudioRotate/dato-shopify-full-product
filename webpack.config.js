const path      = require("path")
const uglifyjs  = require("uglifyjs-webpack-plugin")
const vueloader = require("vue-loader/lib/plugin")

module.exports = {
  devtool: "sourcemap",
  entry: {
    index: path.resolve(__dirname, "index")
  },
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      {
        loader: ["vue-style-loader", "css-loader"],
        test: /\.css$/
      },
      {
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    browsers: ["last 2 versions", "ie 11"]
                  },
                  debug: false
                }
              ]
            ]
          }
        },
        test: /\.js$/
      },
      {
        loader: "vue-loader",
        test: /\.vue$/
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  plugins: [
    new uglifyjs({
      cache: true,
      parallel: true,
      uglifyOptions: {
        minimizer: [],
        splitChunks: {
          cacheGroups: {
            vendor: {
              test: /(node_modules|bower_components)/,
              name: "vendor",
              chunks: "all"
            }
          }
        }
      },
      sourceMap: true
    }),
    new vueloader()
  ],
  resolve: {
    alias: {
      "@": __dirname,
      vue: "vue/dist/vue.esm.js"
    }
  }
}
