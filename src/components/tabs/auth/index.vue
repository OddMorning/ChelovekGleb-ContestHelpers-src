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
        @click='revokeToken'
      />
      <gButton
        v-else
        caption='Авторизоваться'
        @click='doAuth'
      />
    </div>
  </div>
</template>

<script>
  import ls from '@/lib/local-storage-proxy'

  export default {
    components: {
      gButton: () => import(/* webpackMode: "eager" */ '@/components/gButton'),
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
  .container
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
    display: grid

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
