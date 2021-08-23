<template>
  <div :class='$style.container'>
    <AnimatedBackgroundOption
      v-model='isBackgroundAnimated'
    />
    <div/>
    <div>
      {{ version }} :: {{ lastUpdate }} :: Специально для <a
        :class='$style.aboutLink'
        target='_blank'
        href='https://www.twitch.tv/chelovekgleb'
        v-text='"@chelovekgleb"'
      />
    </div>
  </div>
</template>

<script>
  export default {
    components: {
      AnimatedBackgroundOption: () => import(/* webpackMode: "eager" */ '@/components/special/animatedBackgroundOption'),
    },
    data: () => ({
      version: process.env.VUE_APP_VERSION_STR,
      lastUpdate: process.env.VUE_APP_LAST_UPDATE_STR,
    }),
    computed: {
      isBackgroundAnimated: {
        get () {
          return this.$store.state.isBackgroundAnimated
        },
        set (val) {
          this.$store.state.isBackgroundAnimated = val
        },
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    --outline-color: #0
    transition: opacity var(--TransTmSimpleSmall) var(--TransFnDecelerate)
    grid-template-columns: max-content 1fr max-content
    grid-auto-flow: column
    padding: .5rem .75rem
    align-items: center
    font-size: .75rem
    display: grid
    opacity: .4
    color: #f
    text-shadow: -2px 2px 0 var(--outline-color),\
      2px 2px 0 var(--outline-color), \
      2px -2px 0 var(--outline-color), \
      -2px -2px 0 var(--outline-color)
    &:hover
      opacity: .75

  .aboutLink
    color: var(--accent)
    text-decoration: none
    &:hover
      text-decoration: underline
</style>
