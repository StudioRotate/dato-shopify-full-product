const path = require("path")
const uglifyjs = require("uglifyjs-webpack-plugin")
const vueloader = require("vue-loader/lib/plugin")
const webpack = require("webpack")

module.exports = {
  devtool: "sourcemap",
  devServer: {
    compress: true,
    host: "0.0.0.0",
    open: false,
    port: 3000,
    publicPath: "/dst/",
    stats: {
      modules: false
    },
    watchContentBase: true,
    watchOptions: {
      ignored: /(node_modules|bower_components)/,
      poll: true
    }
  },
  entry: {
    main: path.resolve(__dirname, "src", "main.js")
  },
  mode: process.env.NODE_ENV,
  module: {
    rules: [
      {
        loader: ["vue-style-loader", "css-loader"],
        test: /\.css$/
      },
      {
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
        options: {
          cacheBusting: true
        },
        test: /\.vue$/
      }
    ]
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dst")
  },
  performance: {
    hints: false
  },
  plugins: process.env.NODE_ENV === "production"
    ?
      [
        new vueloader(),
        new uglifyjs({
          cache: true,
          parallel: 8,
          sourceMap: true
        })
      ]
    :
      [
        new vueloader(),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
      ]
  ,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      vue$: "vue/dist/vue.esm.js"
    },
    extensions: ["*", ".js", ".json", ".vue"]
  },
  stats: {
    modules: false
  }
}
