import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import './style.css'
import App from './App.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': {
      chart: {
        performanceTest: {
          title: 'Chart Performance Test',
          dataPoints: 'Data Points',
          datasets: 'Datasets',
          estimatedRender: 'Estimated Render',
          fps: 'FPS',
          duration: 'Duration',
          switchToLarge: 'Switch to Large Dataset',
          switchToSmall: 'Switch to Small Dataset',
          stopTest: 'Stop Test',
        },
      },
    },
  },
})

createApp(App).use(i18n).mount('#app')
