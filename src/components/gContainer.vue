<template>
  <div
    :class='$style.container'
    v-on='$listeners'
    v-bind='$attrs'
    ref='root'
  >
    <div
      :class='[$style.caption, {
        [$style.hasCloseButton]: canBeClosed,
      }]'
      ref='caption'
    >
      <span v-text='caption'/>
      <span
        v-if='canBeClosed'
       :class='$style.closeBtn'
       v-text='"×"'
       @click='$emit("onClose")'
      />
    </div>
    <div
      :class='[$style.content, innerClass]'
      ref='content'
    >
      <slot/>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      innerClass: {
        type: [Object, Array, String],
        default: null,
      },
      caption: {
        type: String,
        default: null,
      },
      canBeClosed: {
        type: Boolean,
        default: false,
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    grid-template-rows: min-content 1fr
    border-radius: var(--BorderRadius)
    overflow: hidden
    display: grid

  .caption
    background-color: var(--ColorBg)
    text-shadow: var(--TextShadow)
    color: var(--ColorFg)
    padding: .5rem 2rem
    text-align: center
    &.hasCloseButton
      grid-template-columns: 1fr min-content
      display: grid
      .closeBtn
        cursor: pointer
        padding: .5rem
        margin: -.5rem
        opacity: .5
        &:hover
          opacity: 1


  .content
    background-color: var(--ColorBgSecondary)
    color: var(--ColorFgSecondary)
    height: 100%
</style>
