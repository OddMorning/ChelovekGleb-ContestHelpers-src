<template>
  <label :class='$style.container'>
    <input
      ref='checkbox'
      type='checkbox'
      v-model='value'
      @click='updateValue($refs.checkbox.checked)'
    >
    Анимированный фон
  </label>
</template>

<script>
  import ls from '@/lib/local-storage-proxy'

  export default {
    props: {
      value: {
        type: Boolean,
        retuired: true,
      },
    },
    mounted () {
      const animateBackground = typeof ls.isBackgroundAnimated === 'boolean'
        ? ls.isBackgroundAnimated
        : true

      this.updateValue(animateBackground)
    },
    methods: {
      updateValue (forceValue) {
        const checked = typeof forceValue === 'undefined'
          ? this.$refs.checkbox.checked
          : forceValue

        ls.isBackgroundAnimated = checked
        this.$emit('input', checked)
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    grid-template-columns: min-content 1fr
    align-items: center
    grid-gap: .25rem
    cursor: pointer
    display: grid

  .checkbox
    font: inherit
</style>
