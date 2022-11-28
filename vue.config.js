const fs = require('fs').promises
const packageJson = JSON.parse(require('fs').readFileSync('./package.json'))
const isDevelopment = (process.env.NODE_ENV !== 'production')
const icongen = require('icon-gen')

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
  chainWebpack: async (config) => {
    // ~~~~~~ Custom favicons generator
    // https://github.com/akabekobeko/npm-icon-gen
    if (!isDevelopment) {
      const srcIcon = `${__dirname}/src/assets/favicon.png`
      const desrRoot = config.output.store.get('path')
      const destDir = `${desrRoot}/assets/favicons`
      const options = {
        favicon: {
          name: 'favicon-',
          pngSizes: [16, 32, 48, 128],
          icoSizes: [16, 24, 32, 48, 64]
        }
      }
  
      await fs.mkdir(destDir, { recursive: true })
      await icongen(srcIcon, destDir, options)
    }
  },
}
