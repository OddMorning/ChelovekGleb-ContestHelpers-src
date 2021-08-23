<template>
  <div :class='$style.container'>
    <button
      v-for='(tabData, idx) in tabs'
      :key='idx'
      :class='[$style.tab, {
        [$style.active]: tab === tabData.tab,
        [$style.locked]: !$store.state.isAuthenticated && tabData.tab !== "auth",
      }]'
      v-text='tabData.name'
      @click='selectTab(tabData.tab)'
    />
  </div>
</template>

<script>
  export default {
    data: () => ({
      tabs: [
        { tab: 'auth', name: 'Авторизация' },
        { tab: 'subs', name: 'Подписчики' },
        { tab: 'rewards', name: 'Награды' },
        { tab: 'chat', name: 'Чат' },
        { tab: 'randomizer', name: 'Рандомайзер' },
      ],
    }),
    computed: {
      tab () {
        return this.$store.state.currentTab
      },
    },
    methods: {
      selectTab (tabName) {
        this.$store.dispatch('selectTab', tabName)
      },
    },
  }
</script>

<style module lang='stylus'>
  .container
    background-color: var(--ColorBg)
    height: var(--header-height)
    justify-content: center
    grid-auto-flow: column
    display: grid

  .tab
    transition: background var(--TransTmSimpleSmall) var(--TransFnDecelerate)
    text-shadow: var(--TextShadow)
    background: transparent
    color: var(--ColorFg)
    padding: 0 3rem
    cursor: pointer
    font: inherit
    outline: none
    border: none
    &:hover
    &.active
      background: var(--accent)
    &.locked
      pointer-events: none
      opacity: .5
</style>
