<template>
  <gButton
    :caption='buttonCaption'
    @click='copyFromTarget'
  />
</template>

<script>
  export default {
    props: {
      target: {
        type: Function,
        required: true,
      },
      caption: {
        type: String,
        default: null,
      },
    },
    components: {
      gButton: () => import(/* webpackMode: "eager" */ '@/components/gButton'),
    },
    data: () => ({
      buttonCaption: '',
    }),
    mounted () {
      this.setCopyButtonText('copy')
    },
    methods: {
      setCopyButtonText (state) {
        let caption

        switch (state) {
          case 'copy':
            caption = this.caption || 'Копировать'
            break
          case 'copied':
            caption = 'Скопировано!'
            break
          case 'error':
            caption = 'Не удалось скопировать'
            break
        }

        this.buttonCaption = caption
      },
      copyFromTarget () {
        let targetInput = this.target()
        if (targetInput._isVue) targetInput = targetInput.$el

        const isDisabled = targetInput.disabled

        // Select
        if (isDisabled) targetInput.disabled = false
        targetInput.focus()
        targetInput.select()

        // Copy
        const success = document.execCommand('copy')

        // Deselect
        if (window.getSelection) {
          if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty()
          } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges()
          }
        }
        if (isDisabled) targetInput.disabled = true

        if (success) {
          this.setCopyButtonText('copied')
          setTimeout(() => { this.setCopyButtonText('copy') }, 750)
        } else {
          this.setCopyButtonText('error')
        }
      },
    },
  }
</script>
