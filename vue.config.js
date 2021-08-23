const packageJson = JSON.parse(require('fs').readFileSync('./package.json'))
const isDevelopment = (process.env.NODE_ENV !== 'production')
const FaviconsPlugin = require('favicons-webpack-plugin')

// Define global variables
process.env.VUE_APP_IS_DEVELOPMENT = isDevelopment ? '1' : ''

const now = new Date()
process.env.VUE_APP_VERSION_STR = `v${packageJson.version || 0}`
process.env.VUE_APP_LAST_UPDATE_STR = [
  now.getDate().toString().padStart(2, '0'),
  (now.getMonth() + 1).toString().padStart(2, '0'),
  now.getFullYear(),
].join('.')

module.exports = {
  publicPath: isDevelopment ? '/' : '/ChelovekGleb-ContestHelpers/',
  productionSourceMap: isDevelopment,
  assetsDir: 'assets',
  devServer: {
    host: '0.0.0.0',
    port: 51888,
    disableHostCheck: true, // Aaaaaaaaaaaa
  },
  css: {
    sourceMap: isDevelopment,
    loaderOptions: {
      stylus: {
        import: ['~@/shortcuts'],
      },
    },
  },

  // https://cli.vuejs.org/guide/webpack.html#chaining-advanced
  // https://github.com/neutrinojs/webpack-chain
  chainWebpack: (config) => {
    // ~~~~~~ Favicons generator
    // https://github.com/jantimon/favicons-webpack-plugin
    // configureWebpack.plugins.push(new FaviconsWebpackPlugin({ ... }))
    config.plugin('favicons').use(FaviconsPlugin, [{
      logo: './src/assets/favicon.png',
      prefix: './assets/favicons/',
      lang: 'ru-RU',
      cache: true,
      inject: true,
      favicons: {
        background: '#000',
        theme_color: 'green',
        icons: {
          favicons: true,
          yandex: true,

          appleStartup: false,
          appleIcon: false,
          firefox: false,
          windows: false,
          android: false,
          coast: false,
        },
      },
    }])
  },
}
