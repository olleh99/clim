const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  },

  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 백엔드 서버 주소
        changeOrigin: true
      }
    }
  },

  // 🔥 Chart 오류 완전 차단
  configureWebpack: {
    resolve: {
      fallback: {
        "chart.js": false,
        "Chart": false
      },
      alias: {
        'chart.js': false,
        'Chart': false
      }
    },
    externals: {
      'chart.js': 'Chart',
      'Chart': 'Chart'
    }
  },

  chainWebpack: config => {
    // Chart 관련 모듈 완전 무시
    config.resolve.set('symlinks', false)
    config.module
      .rule('ignore-chart')
      .test(/chart\.js/)
      .use('null-loader')
      .loader('null-loader')
  }
})