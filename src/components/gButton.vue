<template>
  <button
    :class='[$style.container, {
      [$style.nowrap]: nowrap,
      [$style.active]: active,
      [$style.compact]: compact,
    }]'
    v-on='$listeners'
    v-bind='$attrs'
  >
    {{ caption }}
  </button>
</template>

<script>
  export default {
    props: {
      caption: {
        type: String,
        default: null,
      },
      nowrap: {
        type: Boolean,
        default: null,
      },
      active: {
        type: Boolean,
        default: null,
      },
      compact: {
        type: Boolean,
        default: null,
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    transition: background-color var(--TransTmSimpleSmall) var(--TransFnDecelerate)
    border-radius: var(--BorderRadius)
    background-color: var(--ColorBg)
    text-shadow: var(--TextShadow)
    color: var(--ColorFg)
    padding: .5rem 2rem
    cursor: pointer
    font: inherit
    outline: none
    border: none
    &.active
      background-color: #c8de36
    &.nowrap
      white-space: nowrap
    &.compact
      font-size: 13px
    &:hover
      background-color: var(--accent)
</style>
