<template>
  <div :class='$style.container'>
    <gContainer
      :class='$style.resultContainer'
      :caption='subsCount ? `Результат (${subsCount} шт.)` : "Результат"'
    >
      <gTextarea
        ref='result'
        :class='$style.textarea'
        v-model='input.result'
        placeholder='[ пусто ]'
        transparent
        disabled
      />
    </gContainer>
    <gContainer
      :class='$style.blackListContainer'
      caption='Чёрный список'
    >
      <gTextarea
        :class='$style.textarea'
        v-model='input.blacklist'
        @input='onBlacklistEdit'
        placeholder='Список имён, которые будут исключены из результата'
        transparent
      />
    </gContainer>
    <div
      :class='$style.controlContainer'
    >
      <div :class='$style.buttons'>
        <gButton
          :class='$style.refreshSubsBtn'
          caption='Обновить'
          @click='getSubs'
        />
        <CopyButton
          :class='$style.copyBtn'
          :target='() => $refs.result'
        />
      </div>
      <div :class='$style.filters'>
        <gToggler
          caption='Tier 1'
          v-model='conf.tier1'
          @click='processResult'
        />
        <gToggler
          caption='Tier 2'
          v-model='conf.tier2'
          @click='processResult'
        />
        <gToggler
          caption='Tier 3'
          v-model='conf.tier3'
          @click='processResult'
        />
      </div>
    </div>
  </div>
</template>

<script>
  import ls from '@/lib/local-storage-proxy'
  import uniSort from '@/lib/uniSort'

  export default {
    components: {
      CopyButton: () => import(/* webpackMode: "eager" */ '@/components/special/copyButton'),
      gButton: () => import(/* webpackMode: "eager" */ '@/components/gButton'),
      gContainer: () => import(/* webpackMode: "eager" */ '@/components/gContainer'),
      gTextarea: () => import(/* webpackMode: "eager" */ '@/components/gTextarea'),
      gToggler: () => import(/* webpackMode: "eager" */ '@/components/gToggler'),
    },
    data: () => ({
      input: {
        blacklist: '',
        result: '',
      },
      conf: {
        tier1: true,
        tier2: true,
        tier3: true,
      },
      subsRaw: null,
      subsCount: null,
      twitch: null,
    }),
    async mounted () {
      // Get twitch controller
      const twitch = await this.$store.dispatch('getTwitchController')
      this.twitch = twitch

      // Init blacklist
      this.input.blacklist = ls.subs_blacklist || ''

      // Get subscribers
      await this.getSubs()
    },
    methods: {
      async getSubs () {
        try {
          this.input.result = '( Получаю список подписчиков... )'
          this.subsCount = null

          const result = await this.twitch.api('subscriptions', {
            query: {
              first: 100,
              broadcaster_id: this.twitch.user.id,
            },
          })

          if (!result.ok) {
            this.input.result = `Что-то пошло не так при обращении к API:\n\n${result.err}`
            this.$set(this, 'subsRaw', {})
            return
          }

          this.$set(this, 'subsRaw', result.data)

          this.processResult()
        } catch (e) {
          this.input.result = `Что-то пошло не так при обработке запроса:\n\n${e.message}`
        }
      },

      // toggleConf (optName) {
      //   this.conf[optName] = !this.conf[optName]
      //   this.processResult()
      // },
      onBlacklistEdit (value) {
        ls.subs_blacklist = value
        this.processResult()
      },
      processResult () {
        const blackList = this.input.blacklist ? this.input.blacklist.split('\n') : []

        let users = this.subsRaw
          .filter(user => {
            const isTier1 = user.tier === '1000'
            const isTier2 = user.tier === '2000'
            const isTier3 = user.tier === '3000'
            const isBlacklisted = blackList.includes(user.user_name)
            const isBroadcaster = user.user_name === this.twitch.user.name
            let ok = true

            if (isTier1) ok = ok && this.conf.tier1
            if (isTier2) ok = ok && this.conf.tier2
            if (isTier3) ok = ok && this.conf.tier3
            if (isBlacklisted) ok = false
            if (isBroadcaster) ok = false

            return ok
          })
          .map(row => row.user_name)
          .sort(uniSort)

        // Sometimes twitch can return same users twice so keep unique items only
        users = [...new Set(users)]

        this.input.result = users.join('\n')
        this.subsCount = users.length
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    grid-template-areas: \
      'result blacklist' \
      'control control'
    grid-template-columns: 2fr 1fr
    grid-template-rows: 1fr min-content
    grid-gap: 1rem
    display: grid

  .resultContainer
    grid-area: result

  .blackListContainer
    grid-area: blacklist

  .controlContainer
    grid-template-columns: 2fr 1fr
    grid-auto-flow: column
    justify-items: center
    align-items: start
    grid-area: control
    grid-gap: 1rem
    display: grid
    .buttons
    .filters
      grid-gap: .5rem
      display: grid

  .textarea
    height: 100%
</style>
