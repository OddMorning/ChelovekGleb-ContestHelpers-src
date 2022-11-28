<template>
  <div :class='$style.container'>
    <gContainer
      :class='$style.resultContainer'
      :caption='rewardRedemptionsCount ? `Результат (${rewardRedemptionsCount} шт.)` : "Результат"'
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
    <div
      :class='$style.controlContainer'
    >
      <div :class='$style.buttons'>
        <gButton
          caption='Обновить'
          @click='getAll'
        />
        <CopyButton
          :class='$style.copyBtn'
          :target='() => $refs.result'
        />
      </div>
      <div :class='$style.filters'>
        <gToggler
          caption='Без повторений'
          v-model='filters.onlyUniqueNames'
          title='Исключить повторяющиеся имена'
          @click='processResult'
        />
        <gToggler
          caption='Запросить выполненные'
          v-model='filters.requireFulfilled'
          title='Запросить награды, которые отмечены как выполненные (за последние сутки)'
          @click='getAll'
        />
        <template v-if='hasRewards'>
          <gToggler
            v-for='(reward, idx) in rewards'
            :key='idx'
            :caption='reward.title'
            v-model='reward.enabled'
            :title='reward.prompt'
            @click='processResult'
          />
        </template>
        <gButton
          :class='$style.addRewardBtn'
          caption='Создать награду'
          @click='createReward'
          title='Создать новую награду, к которой приложение будет иметь доступ'
          nowrap
        />
      </div>
    </div>
  </div>
</template>

<script>

  // import uniSort from '@/lib/uniSort'

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
        result: '',
      },
      filters: {
        onlyUniqueNames: false,
        requireFulfilled: false,
      },
      rewards: [],
      rewardRedemptions: [],
      rewardRedemptionsCount: null,
      twitch: null,
    }),
    computed: {
      hasRewards () {
        return !!this.rewards.length
      },
    },
    async mounted () {
      // Get twitch controller
      const twitch = await this.$store.dispatch('getTwitchController')
      this.twitch = twitch

      await this.getAll()
    },
    methods: {
      async getAll () {
        this.rewardRedemptionsCount = null

        // Get rewards
        await this.getRewards()

        // Get redemptions
        await this.getRewardRedemptions()
      },
      async createReward () {
        const rewardName = prompt('Из-за ограничений Twitch API приложение может иметь доступ только к собственным наградам.\n\nСозданные награды можно активировать, редактировать или удалить в панели управления канала.\n\nВведите название новой награды:')

        if (!rewardName) return

        const result = await this.twitch.api('channel_points/custom_rewards', {
          method: 'POST',
          query: {
            broadcaster_id: this.twitch.user.id,
          },
          body: {
            title: rewardName,
            prompt: '(создано через приложение инструментов для конкурса)',
            cost: 100,
            is_enabled: false,
          },
        })

        if (!result.ok) {
          this.input.result = `Что-то пошло не так при обращении к API:\n\n${result.err}`
          return
        }

        await this.getRewards()
      },
      async getRewards () {
        const disabledMsg = '( Награда неактивна. Включть её можно в настройках Twitch )'
        try {
          const resultOriginal = this.input.result
          this.input.result = '( Получаю список наград... )'
          this.$set(this, 'rewards', [])

          const result = await this.twitch.api('channel_points/custom_rewards', {
            query: {
              broadcaster_id: this.twitch.user.id,
              only_manageable_rewards: true,
            },
          })

          if (!result.ok) {
            this.input.result = `Что-то пошло не так при обращении к API:\n\n${result.err}`
            return
          }

          const types = result.data.map(item => ({
            id: item.id,
            title: item.is_enabled ? item.title : `${item.title} (неактивна)`,
            prompt: item.is_enabled ? item.prompt : `${disabledMsg}\n\n${item.prompt}`,
            enabled: item.is_enabled,
          }))

          this.$set(this, 'rewards', types)
          if (resultOriginal) this.input.result = resultOriginal
        } catch (e) {
          console.error(e)
          this.input.result = `Что-то пошло не так при обработке запроса:\n\n${e.message}`
        }
      },
      async getRewardRedemptions () {
        try {
          this.input.result = '( Получаю список запросов на награды... )'
          this.rewardRedemptionsCount = null
          this.$set(this, 'rewardRedemptions', [])

          for (const reward of this.rewards) {
            const result = await this.twitch.api('channel_points/custom_rewards/redemptions', {
              query: {
                first: 50,
                broadcaster_id: this.twitch.user.id,
                reward_id: reward.id,
                status: this.filters.requireFulfilled ? 'FULFILLED' : 'UNFULFILLED',
                sort: 'NEWEST',
              },
            })

            if (!result.ok) {
              this.input.result = `Что-то пошло не так при обращении к API:\n\n${result.err}`
              return
            }

            let redemptions = result.data.map(item => ({
              id: item.id,
              rewardId: item.reward.id,
              userName: item.user_name,
              userInput: item.user_input,
              status: item.status,
              timestamp: item.redeemed_at,
              date: new Date(item.redeemed_at),
            }))

            // Only recent requests
            if (this.filters.requireFulfilled) {
              const oneDay = 86400000
              const expiryDate = new Date().valueOf() - oneDay

              redemptions = redemptions.filter(item => item.timestamp < expiryDate)
            }

            this.rewardRedemptions.push(...redemptions)
          }

          this.processResult()
        } catch (e) {
          console.error(e)
          this.input.result = `Что-то пошло не так при обработке запроса:\n\n${e.message}`
        }
      },
      processResult () {
        const enabledRewardIds = this.rewards
          .filter(reward => reward.enabled)
          .map(reward => reward.id)

        let users = this.rewardRedemptions

        // Filter by reward type
        users = users
          .filter((redemption, idx, self) => {
            const isEnabledReward = enabledRewardIds.includes(redemption.rewardId)
            const ok = isEnabledReward

            return ok
          })
          .map(row => row.userName)

        // Keep only unique usernames if needed
        if (this.filters.onlyUniqueNames) {
          users = users.filter((value, idx, self) => self.indexOf(value) === idx)
        }

        // // Sort users
        // users = users.sort(uniSort)

        this.input.result = users.join('\n')
        this.rewardRedemptionsCount = users.length
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    grid-template-areas: \
      'result' \
      'control'
    grid-template-rows: 1fr min-content
    grid-gap: 1rem
    display: grid

  .resultContainer
    grid-area: result

  .blackListContainer
    grid-area: blacklist

  .controlContainer
    grid-template-columns: 1fr 1fr
    grid-auto-flow: column
    justify-items: center
    align-items: start
    grid-area: control
    grid-gap: 1rem
    display: grid
    .buttons
    .filters
      text-align: center
      grid-gap: .5rem
      display: grid

  .textarea
    height: 100%
</style>
