import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'element-plus/dist/index.css'
import router from './router/index'

// console.log('router:', router)

let app = createApp(App)
app.use(router)
app.mount('#app')
