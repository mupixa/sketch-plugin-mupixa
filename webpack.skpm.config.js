module.exports = function (config, entry) {
  config.node = entry.isPluginCommand ? false : {
    setImmediate: false
  };
  config.module.rules.push({
    test: /\.(html)$/,
    use: [{
        loader: "@skpm/extract-loader",
      },
      {
        loader: "html-loader",
        options: {
          attrs: [
            'img:src',
            'link:href'
          ],
          interpolate: true,
        },
      },
    ]
  })
  config.module.rules.push({
    test: /\.(css)$/,
    use: [
      {
        loader: "style-loader",
      },
      {
        loader: "css-loader",
      },
    ]
  })
  config.module.rules.push({
    test: /\.(png|svg|jpg|gif)$/,
    use: [{
        loader: "url-loader",
    }]
  })
  config.module.rules.push({
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: {
      loader: "babel-loader",
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react']
      }
    }
  })
}
