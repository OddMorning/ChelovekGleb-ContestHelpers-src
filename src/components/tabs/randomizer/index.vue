<template>
  <div :class='$style.container'>
    <iframe
      :class='$style.iframe'
      :src='url'
    />
  </div>
</template>

<script>
  export default {
    data: () => ({
      url: 'https://randomus.ru/list',
    }),
  }
</script>

<style module lang='stylus'>
  .container.container
    --padding-sides: 1rem
    --padding-top-bottom: 1rem
    height: calc(100vh - var(--header-height))
    max-width: 100%
    width: 100%
    padding: 0

    padding: var(--padding-sides) var(--padding-top-bottom)
    height: calc(100vh - var(--header-height) - var(--padding-top-bottom) * 2)
    max-width: calc(100vw - var(--padding-sides) * 2)

  .iframe
    border-radius: var(--BorderRadius)
    height: 100%
    border: none
    width: 100%
</style>
