<template>
  <textarea
    :class='[$style.container, {
      [$style.transparent]: transparent,
    }]'
    v-model='value'
    spellcheck='false'
    @input='$emit("input", value)'
  />
</template>

<script>
  export default {
    props: {
      value: {
        type: String,
        default: null,
      },
      transparent: {
        type: Boolean,
        default: false,
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    background-color: var(--ColorBgSecondary)
    color: var(--ColorFgSecondary)
    box-sizing: border-box
    padding: .5rem 1rem
    position: relative
    font: inherit
    // font-size: .5rem
    // line-height: 1.5
    line-height: 1.75
    font-size: 1rem
    outline: none
    border: none
    resize: none
    width: 100%
    &::placeholder
      color: var(--ColorFgSecondary)
      opacity: .5
    &:not(.transparent)
      --bg-inactive: #2
      --outline-width: 2px

      transition: \
        background-color var(--TransTmSimpleSmall) var(--TransFnDecelerate), \
        box-shadow var(--TransTmSimpleSmall) var(--TransFnDecelerate)
      border-radius: var(--BorderRadius)
      background-color: var(--bg-inactive)
      &:focus
        box-shadow: inset 0 0 0 var(--outline-width) var(--accent)
        background-color: transparent
</style>
