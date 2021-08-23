<template>
  <gButton
    :caption='buttonCaption'
    @click='onClick'
    nowrap
    :compact='compact'
  />
</template>

<script>
  export default {
    components: {
      gButton: () => import(/* webpackMode: "eager" */ '@/components/gButton'),
    },
    props: {
      caption: {
        type: String,
        default: null,
      },
      value: {
        type: Boolean,
        requred: true,
      },
      compact: {
        type: Boolean,
        default: null,
      },
    },
    data: () => ({
      mark: '[×]',
      blank: '[ ]',
    }),
    computed: {
      buttonCaption () {
        return this.value ? `${this.mark} ${this.caption}` : `${this.blank} ${this.caption}`
      },
    },
    methods: {
      onClick (...args) {
        this.$emit('input', !this.value)

        if (this.$listeners.click) {
          this.$listeners.click(...args)
        }
      },
    },
  }
</script>
