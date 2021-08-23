
<template>
  <div :class='$style.container'>
    <KeepAlive>
      <Component
        :is='currentTab'
        :class='$style.component'
      />
    </KeepAlive>
  </div>
</template>

<script>
  const availableTabComponents = require.context(
    '@/components/tabs',
    true,
    /\.\/.+?\/index\.vue$/,
  )

  const components = {}

  for (const filepath of availableTabComponents.keys()) {
    const tabName = filepath.replace('./', '').replace('/index.vue', '')
    components[tabName] = () => import(
      `@/components/tabs/${tabName}/index.vue`
    )
  }

  export default {
    components,
    computed: {
      currentTab () {
        return this.$store.state.currentTab
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    align-self: center

  .component
    padding: 1rem 2rem
    max-width: 70rem
    height: 75vh
    margin: auto
</style>
