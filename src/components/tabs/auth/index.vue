<template>
  <div :class='$style.container'>
    <div :class='$style.stateContainer'>
      <div v-text='"Логин:"'/>
      <div
        v-if='login && authState === "ok"'
        :class='$style.login'
        v-text='login'
      />
      <div
        v-else
        :class='[$style.stateIcon, $style[authState]]'
      />
      <template v-if='errorMsg'>
        <div v-text='"Ошибка:"'/>
        <div v-text='errorMsg'/>
      </template>
    </div>
    <div :class='$style.buttonsContainer'>
      <gButton
        v-if='$store.state.isAuthenticated'
        caption='Отозвать токен'
        title='Разлогиниться и сделать токен недействительным'
        @click='revokeToken'
      />
      <gButton
        v-else
        caption='Авторизация'
        title='Открыть страницу авторизации Twitch'
        @click='doAuth'
      />
      <CopyButton
        caption='Копировать токен'
        :disabled='!$store.state.isAuthenticated'
        :target='generateTokenInputNode'
        title='Для отладочных целей'
      />
    </div>
    <input
      :class='$style.tokenInput'
      ref='tokenInput'
    >
  </div>
</template>

<script>
  import ls from '@/lib/local-storage-proxy'

  export default {
    components: {
      gButton: () => import(/* webpackMode: "eager" */ '@/components/gButton'),
      CopyButton: () => import(/* webpackMode: "eager" */ '@/components/special/copyButton'),
    },
    data: () => ({
      authState: 'noAuth',
      login: '',
      errorMsg: '',
      twitch: null,
    }),
    async mounted () {
      const twitch = await this.$store.dispatch('getTwitchController')
      this.twitch = twitch

      if (!twitch.user.token) {
        this.authState = 'noAuth'
        return
      }

      this.authState = 'waiting'
      await twitch.checkToken()

      if (twitch.user.ok) {
        this.authState = 'ok'
        this.login = twitch.user.name
        this.$store.state.isAuthenticated = true
      } else {
        this.authState = 'error'
        this.errorMsg = twitch.user.errorMsg
        this.$store.state.isAuthenticated = false
        delete ls.token
      }
    },
    methods: {
      async doAuth () {
        this.twitch.auth({
          scope: [
            'channel:read:redemptions', // Награди
            'channel:read:subscriptions', // Подписки
            'channel:manage:redemptions', // Управление наградами
            'chat:read', // Для возможности писать в чат
            'chat:edit',
          ],
        })
      },
      generateTokenInputNode () {
        const node = this.$refs.tokenInput
        node.value = ls.token
        setTimeout(() => {
          node.value = ''
        }, 1000)
        return node
      },
      async revokeToken () {
        this.twitch.revokeToken()

        this.authState = 'noAuth'
        this.login = ''
        this.$store.state.isAuthenticated = false
        delete ls.token
      },
    },
  }
</script>

<style module lang='stylus'>
  .container.container
    grid-template-rows: 1fr 1fr
    justify-content: center
    max-width: 90rem
    grid-gap: 1rem
    display: grid
    height: 100%

  .stateContainer
    grid-template-columns: min-content min-content
    justify-self: center
    text-align: center
    align-self: end
    grid-gap: .5rem
    display: grid

  .login
    color: green

  .buttonsContainer
    justify-content: center
    align-items: start
    grid-gap: 1rem
    display: grid

  .tokenInput
    pointer-events: none
    opacity: 0
    height: 0

  .stateIcon
    &.noAuth::after
      content: '-'
      opacity: .5
    &.waiting::after
      content: '…'
      color: yellow
    &.error::after
      content: '×'
      color: red

</style>
