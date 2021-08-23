<template>
  <div
    :id='$style.app'
    :class='{
      [$style.animatedBackground]: isBackgroundAnimated,
    }'
  >
    <Header/>
    <Content/>
    <Footer v-if='showFooter'/>
  </div>
</template>

<script>
  export default {
    components: {
      Header: () => import(/* webpackMode: "eager" */ '@/components/internal/header'),
      Content: () => import(/* webpackMode: "eager" */ '@/components/internal/content'),
      Footer: () => import(/* webpackMode: "eager" */ '@/components/internal/footer'),
    },
    computed: {
      isBackgroundAnimated () {
        return this.$store.state.isBackgroundAnimated
      },
      showFooter () {
        return this.$store.state.currentTab === 'auth'
      },
    },
    watch: {
      isBackgroundAnimated: {
        immediate: true,
        handler (isChecked) {
          const className = this.$style.animatedBackground
          if (isChecked) {
            document.body.classList.add(className)
          } else {
            document.body.classList.remove(className)
          }
        },
      },
    },
  }

</script>

<style module lang='stylus'>
  :root
    --accent: #419e51
    --TransTmSimpleSmall: 100ms
    --TransFnDecelerate: cubic-bezier(0, 0, .2, 1)

    --TextShadow: 1px 1px 2px rgba(#0, .25)
    --ColorBg: #cfcecf
    --ColorBgSecondary: #1
    --ColorFg: #1b2523
    --ColorFgSecondary: #cfcecf

    --BorderRadius: 4px

  // https://css-tricks.com/custom-scrollbars-in-webkit/#article-header-id-1
  ::-webkit-scrollbar
    --scrollbar-size: .5rem
    size: var(--scrollbar-size)
    &-button
      &:vertical
      &:horizontal
        size: var(--scrollbar-size)
    &-thumb
      border-radius: 1rem
      background-color: var(--accent)
      &:hover
        background-color: var(--accent)
      &:active
        background-color: var(--accent)
    &-corner
      background-color: transparent

  ::selection
    background: var(--accent)
    color: #F

  @keyframes background {
    from {
      background-position: 0 0
    }
    to {
      background-position: 550px -512px // Image resolution (W H*-2)
    }
  }

  body
    --header-height: 2rem
    font: 400 1em/1 'Press Start 2P', 'Arial Narrow', fantasy
    background-image: url('./assets/background.png')
    background-position: center
    background-color: #0
    user-select: none
    overflow: overlay
    cursor: default
    height: 100vh
    padding: 0
    margin: 0
    color: #F
    &.animatedBackground
      animation: background linear 25s infinite

  #app
    grid-template-rows: min-content 1fr min-content
    display: grid
    height: 100%
</style>
