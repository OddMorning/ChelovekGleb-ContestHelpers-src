import dotenv from 'dotenv'
import Vue from 'vue'
import App from './App.vue'

import initDataLoader from './loader-data'
import storeLoader from './loader-store'

Vue.config.productionTip = false
dotenv.config()

// Asynchronous initialization
const init = async () => {
  // Process initial data
  const initialData = await initDataLoader()

  // Process Vuex
  const store = await storeLoader({ initialData })

  // Vue initialization
  new Vue({
    store,
    render: h => h(App),
  }).$mount('#app')
}

init()
  .catch(e => console.error('Failed to init app:', e))
