import Vue from 'vue'
import Vuex from 'vuex'

export default async ({ initialData }) => {
  Vue.use(Vuex)

  const { twitchController } = initialData

  const store = new Vuex.Store({
    state: {
      isAuthenticated: false,
      isBackgroundAnimated: true,
      currentTab: 'auth',
    },
    actions: {
      getTwitchController (store) {
        return twitchController
      },
      selectTab (store, tabName) {
        store.state.currentTab = tabName
      },
    },
  })

  return store
}
