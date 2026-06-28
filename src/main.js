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
          title: '图表性能测试',
          dataPoints: '数据点',
          datasets: '数据集',
          estimatedRender: '预计渲染',
          fps: '帧率',
          duration: '持续时间',
          switchToLarge: '切换大数据集',
          switchToSmall: '切换小数据集',
          stopTest: '停止测试',
        },
      },
    },
  },
})

createApp(App).use(i18n).mount('#app')
