<template>
  <div :class='$style.container'>
    <div
      :class='[$style.mainContainer, {
        [$style.hasResult]: hasResult,
      }]'
    >
      <gContainer
        :inner-class='$style.messagesContainer'
        ref='messagesContainer'
        caption='Чат'
      >
        <div
          v-for='(message, idx) of messages'
          :key='idx'
          :class='[$style.message, {
            [$style.systemMessage]: message.isSystemMessage,
            [$style.highlight]: message.isHighlighed,
          }]'
        >
          <template v-if='message.isSystemMessage'>
            <span
              :class='$style.text'
              v-text='message.textProcessed'
              :style='{
                "--color": message.color
              }'
            />
          </template>
          <template v-else>
            <span
              :class='$style.user'
              v-text='message.user.name'
              :style='{
                "--color": message.user.color
              }'
            />
            <span
              :class='$style.text'
              v-html='message.textProcessed'
              :style='{
                "--color": message.color
              }'
            />
          </template>
        </div>
      </gContainer>
      <gContainer
        v-if='hasResult'
        :inner-class='$style.messagesContainer'
        caption='Найденные сообщения'
        can-be-closed
        @onClose='onResultClose'
      >
        <div
          v-for='(message, idx) of resultMessages'
          :key='idx'
          :class='$style.message'
        >
          <span
            :class='$style.time'
            v-text='message.timestamp.timeWithSeconds'
          />
          <span
            :class='$style.user'
            v-text='message.user.name'
            :style='{
              "--color": message.user.color
            }'
          />
          <span
            :class='$style.text'
            v-html='message.textProcessed'
            :style='{
              "--color": message.color
            }'
          />
        </div>
      </gContainer>
    </div>
    <div :class='$style.sidebarContainer'>
      <gContainer
        :inner-class='$style.searchContainer'
        caption='Искать по шаблону'
      >
        <gTextarea
          :class='$style.input'
          v-model='input.confSearchQuery'
          rows='1'
          placeholder='Что искать'
          title='Если в качестве поиска указана строка «АБВ», то с настройками по умолчанию может быть найдено как сообщение «АБВ», так и «а б в г д»'
        />
        <div :class='$style.buttonsWrapper'>
          <gToggler
            caption='Учитывать регистр'
            v-model='conf.search.considerCase'
            title='Если отмечено, сообщения «АБВ» и «абв» будут считаться разными сообщениями'
            @click='saveValueToLs("chat_search.considerCase", conf.search.considerCase)'
            compact
          />
          <gToggler
            caption='Учитывать пробелы'
            v-model='conf.search.considerSpaces'
            title='Если отмечено, сообщения «АБВ» и «А Б В» будут считаться разными сообщениями'
            @click='saveValueToLs("chat_search.considerSpaces", conf.search.considerSpaces)'
            compact
          />
          <gToggler
            caption='Сообщение целиком'
            v-model='conf.search.onlyEntireMessage'
            title='Если отмечено, сообщения «АБВ» и «АБВГД» будут считаться разными сообщениями'
            @click='saveValueToLs("chat_search.onlyEntireMessage", conf.search.onlyEntireMessage)'
            compact
          />
        </div>
      </gContainer>
      <gContainer
        :inner-class='$style.confFoundContainer'
        caption='Когда сообщение найдено'
      >
        <gTextarea
          :class='$style.input'
          v-model='input.successNotificationTemplate'
          rows='1'
          :placeholder='defaultValues.successNotificationTemplate'
          :title='"Текст, который будет отображён, когда сообщение найдено.\n\nСимвол «@» будет заменён на ник.\nСимвол «*» будет заменён на текст сообщения.\nСимвол «&» будет заменён на шаблон, введённый выше."'
          @input='saveValueToLs("chat_found.successNotificationTemplate", input.successNotificationTemplate)'
        />
        <div :class='$style.buttonsWrapper'>
          <gToggler
            caption='     Звук      '
            v-model='conf.found.playSound'
            title='Будет проигран звуковой сигнал'
            @click='saveValueToLs("chat_found.playSound", conf.found.playSound)'
            compact
          />
          <gToggler
            caption='  Уведомление  '
            v-model='conf.found.showNotification'
            title='Будет показано уведомление браузера'
            @click='verifyNotificationPermission'
            compact
          />
          <gToggler
            caption='Сообщение в чат'
            v-model='conf.found.sendToChat'
            title='Будет отправлено сообщение в чат на twitch'
            @click='saveValueToLs("chat_found.sendToChat", conf.found.sendToChat)'
            compact
          />
          <gButton
            :caption='timeoutButtonCaption'
            title='После найденного сообщения поиск отключится на N секунд'
            @click='setNextTimeoutValue'
            compact
          />
          <br>
          <gButton
            caption='Проверить'
            @click='createFakeSuccessfulMessage'
            title='Сымитировать ситуацию, будто в чате было дан правильный ответ (проиграть звук, показать уведомление и т.д.)'
            compact
          />
        </div>
      </gContainer>
    </div>
  </div>
</template>

<script>
  import ls from '@/lib/local-storage-proxy'
  import tmi from 'tmi.js'

  export default {
    components: {
      gButton: () => import(/* webpackMode: "eager" */ '@/components/gButton'),
      gContainer: () => import(/* webpackMode: "eager" */ '@/components/gContainer'),
      gTextarea: () => import(/* webpackMode: "eager" */ '@/components/gTextarea'),
      gToggler: () => import(/* webpackMode: "eager" */ '@/components/gToggler'),
    },
    data: () => ({
      messages: [],
      resultMessages: [],
      input: {
        confSearchQuery: '',
        successNotificationTemplate: '',
        timeout: 0,
      },
      conf: {
        search: {
          considerCase: null,
          considerSpaces: null,
          onlyEntireMessage: null,
        },
        found: {
          playSound: null,
          showNotification: null,
          sendToChat: null,
        },
      },
      twitch: null,
      chatClient: null,
      maxMessagesCount: 150,
      bttvCache: null,
      timeout: {
        values: [0, 5, 30],
        isActive: null,
        timer: null,
      },
      defaultValues: {
        usernameColors: ['#ff0000', '#0000ff', '#008000', '#b22222', '#ff7f50', '#9acd32', '#ff4500', '#2e8b57', '#daa520', '#d2691e', '#5f9ea0', '#1e90ff', '#ff69b4', '#8a2be2', '#00ff7f'],
        successNotificationTemplate: '/me @ дал правильный ответ (*)!',
        notificationSound: require('@/assets/notification.ogg'),
        notificationIcon: require('@/assets/favicon.png'),
      },
    }),
    computed: {
      hasResult () {
        return this.resultMessages && this.resultMessages.length
      },
      timeoutButtonCaption () {
        const { timeout } = this.input
        const isZero = timeout === 0
        const isNumber = Number.isInteger(timeout)

        const caption = 'Таймаут (*)'
        let indiator = '???'

        if (isZero) {
          indiator = 'выкл'
        } else if (isNumber) {
          indiator = `${timeout} сек`
        }

        return caption.replace('*', indiator)
      },
    },
    async activated () {
      // Scroll chat to the bottom on tab switching
      let done = false
      while (!done) {
        try {
          const chatContainer = this.$refs.messagesContainer.$refs.content
          const maxScrollUpdated = chatContainer.scrollHeight - chatContainer.clientHeight + 1
          chatContainer.scrollTop = maxScrollUpdated
          done = true
        } catch (e) {
          // 
        } finally {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    },
    async mounted () {
      // Get twitch controller
      const twitch = await this.$store.dispatch('getTwitchController')
      this.twitch = twitch

      this.initConf()
      await this.initChat()
      await this.verifyNotificationPermission()

      // await this.scrollToBottom()

      // Fix delayed first audio play ?
      new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==').play()
    },
    methods: {
      onResultClose () {
        this.$set(this, 'resultMessages', [])
      },

      saveValueToLs (optName, value) {
        ls[optName] = value
      },

      // $forceNextTick (callback) {
      //   const doubleRAF = (callback) => {
      //     requestAnimationFrame(() => {
      //       requestAnimationFrame(callback)
      //     })
      //   }
      //   if (callback && typeof callback === 'function') {
      //     doubleRAF(callback)
      //   } else {
      //     return new Promise(resolve => doubleRAF(resolve))
      //   }
      // },

      async verifyNotificationPermission () {
        let show = this.conf.found.showNotification

        // Request notifications permission
        if (show) {
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') {
            show = false
            this.conf.found.showNotification = false
            alert('Не могу показывать уведомления, так как они были запрещены браузером')
          }
        }

        this.saveValueToLs('chat_found.showNotification', show)
      },

      initConf () {
        // Read config
        const readLocalStorage = (key, defaultValue) => ls[key] === null ? defaultValue : ls[key]

        const { search, found } = this.conf
        search.considerCase = readLocalStorage('chat_search.considerCase', false)
        search.considerSpaces = readLocalStorage('chat_search.considerSpaces', false)
        search.onlyEntireMessage = readLocalStorage('chat_search.onlyEntireMessage', false)
        found.playSound = readLocalStorage('chat_found.playSound', true)
        found.showNotification = readLocalStorage('chat_found.showNotification', true)
        found.sendToChat = readLocalStorage('chat_found.sendToChat', false)
        this.input.successNotificationTemplate = ls['chat_found.successNotificationTemplate']
        this.input.timeout = readLocalStorage('chat_found.timeout', 0)
      },

      setNextTimeoutValue () {
        const curr = this.input.timeout
        const currIdx = this.timeout.values.findIndex(i => i === curr)
        const isLastIdx = currIdx + 1 === this.timeout.values.length
        const nextIdx = isLastIdx ? 0 : currIdx + 1

        const nextVal = this.timeout.values[nextIdx]
        this.input.timeout = nextVal
        this.saveValueToLs('chat_found.timeout', nextVal)

        clearTimeout(this.timeout.timer)
        this.timeout.isActive = false
        this.timeout.timer = null
      },

      /* === Process chat === */

      async initChat () {
        // Try to get BTTV emotes
        // [ ! ] Experiments, not complete feature
        try {
          const bttvUrl = `https://api.betterttv.net/3/cached/users/twitch/${this.twitch.user.id}`
          const resp = await fetch(bttvUrl)
          if (resp.status !== 200) {
            const respAsText = await resp.text()
            throw new Error(respAsText)
          }
          this.bttvCache = await resp.json()
        } catch (e) {
          console.log('Can not fetch BTTV API:', e)
          this.bttvCache = null
        }

        // Create chat client
        const client = new tmi.Client({
          channels: [this.twitch.user.name],
          identity: {
            username: this.twitch.user.name,
            password: `oauth:${this.twitch.user.token}`,
          },
        })
        this.onSystemMessage('info', 'Установка подключения...')
        client.connect().catch((e) => {
          this.onSystemMessage('error', e.message || e)
        })
        client.on('connected', (addr, port) => {
          this.onSystemMessage('info', 'Подключеие установлено')
        })
        client.on('message', this.onMessage)
        this.chatClient = client
      },

      async onSystemMessage (type, messageText) {
        const message = {
          isSystemMessage: true,
          color: type === 'error' ? '#F00' : null,
          text: messageText,
          textProcessed: messageText,
        }

        await this.addMessage(message)
      },

      async onMessage (channel, tags, messageText, self) {
        const username = tags['display-name']
        const date = new Date(+tags['tmi-sent-ts'])
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        const timeWithSeconds = `${time}:${date.getSeconds().toString().padStart(2, '0')}`

        // Compose user message object
        const message = {
          user: {
            name: username,
            color: tags.color || this.generateColorForString(username),
          },
          text: messageText,
          textProcessed: await this.processEmotes(messageText, tags.emotes),
          timestamp: {
            raw: date,
            time,
            timeWithSeconds,
          },
          isHighlighed: false,
        }

        await this.addMessage(message)
        await this.checkMessage(message, { channel, self })
      },

      async createFakeSuccessfulMessage () {
        const isTemplateEmpty = !this.input.confSearchQuery

        if (isTemplateEmpty) {
          this.input.confSearchQuery = 'Т Е С Т'
        }

        const channel = `#${this.twitch.user.name.toLowerCase()}`
        const tags = {
          'display-name': 'System',
          color: '#F00',
          'tmi-sent-ts': new Date().valueOf(),
        }
        const messageText = this.input.confSearchQuery
        const self = false

        await this.onMessage(channel, tags, messageText, self)

        if (isTemplateEmpty) {
          this.input.confSearchQuery = ''
        }
      },

      async checkMessage (message, { channel, self }) {
        if (self) return

        let templateToFind = this.input.confSearchQuery
        if (!templateToFind) return

        const { search, found } = this.conf
        let { text } = message
        let messageMatches = false

        // Convert to lowercase
        if (!search.considerCase) {
          templateToFind = templateToFind.toLowerCase()
          text = text.toLowerCase()
        }

        // Remove all spaces
        if (!search.considerSpaces) {
          templateToFind = templateToFind.replace(/\s/g, '')
          text = text.replace(/\s/g, '')
        }

        // Check if message matches template
        if (search.onlyEntireMessage) {
          // Entire message
          messageMatches = text === templateToFind
        } else {
          // Part of message
          messageMatches = text.includes(templateToFind)
        }

        if (!messageMatches) return
        if (this.timeout.isActive) return

        // Highlight message in page chat
        message.isHighlighed = true

        // Add message to page and adjust chat scroll
        // because of the appearing/resizing 'found messages' block
        {
          const chatContainer = this.$refs.messagesContainer.$refs.content
          const currChatHeight = chatContainer.clientHeight

          this.resultMessages.push(message)
          await this.$nextTick()

          const newChatHeight = chatContainer.clientHeight
          const diff = currChatHeight - newChatHeight
          chatContainer.scrollTop += diff
        }

        // Keep only 3 messages in results
        const exceedsMessagesLimit = this.resultMessages.length > 3
        if (exceedsMessagesLimit) {
          this.resultMessages.splice(0, 1)
        }

        // Build message to show
        const successfulMessage = (this.input.successNotificationTemplate || this.defaultValues.successNotificationTemplate)
          .replace('@', `@${message.user.name}`)
          .replace('*', message.text)
          .replace('&', this.input.confSearchQuery)

        // Play sound
        if (found.playSound) {
          try {
            const audio = new Audio(this.defaultValues.notificationSound)
            audio.play()
          } catch (e) {
            alert(`Не могу проиграть звук: ${e.message}`)
          }
        }

        // Show HTML notification
        if (found.showNotification) {
          try {
            // const notification = new Notification('Обнаружено сообщение', {
            const notification = new Notification(`Сообщение от @${message.user.name}`, {
              body: successfulMessage,
              icon: this.defaultValues.notificationIcon,
              silent: true,
            })

            notification.addEventListener('click', (ev) => {
              ev.target.close()
            })
          } catch (e) {
            alert(`Не могу создать уведомление: ${e.message}`)
          }
        }

        // Send message to twitch chat
        if (found.sendToChat) {
          try {
            this.chatClient.say(channel, successfulMessage)
          } catch (e) {
            alert(`Не могу отправить сообщение в чат: ${e.message}`)
          }
        }

        // Run timeout timer if needed
        if (this.input.timeout) {
          const timerMs = this.input.timeout * 1000
          this.timeout.isActive = true
          this.timeout.timer = setTimeout(() => {
            this.timeout.isActive = false
            this.timeout.timer = null
          }, timerMs)
        }
      },

      generateColorForString (str) {
        const colors = this.defaultValues.usernameColors
        let stringAsNumber = 0

        for (const char of str) {
          stringAsNumber += char.charCodeAt(0)
        }

        const colorId = stringAsNumber % colors.length

        return colors[colorId]
      },

      async processEmotes (messageText, emotes) {
        let text = messageText

        const addEmoji = (emoteName, url) => {
          const emoteNameEscaped = emoteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

          // Note: Don't use `title='${emoteName}'`, it breaks everything because of `.replace()`
          text = text.replace(
            new RegExp(emoteNameEscaped, 'g'),
            `<img class='${this.$style.emote}' src='${url}'>`,
          )
        }

        // Process default emotes
        if (emotes) {
          const emoteTemplateUrl = 'https://static-cdn.jtvnw.net/emoticons/v2/$$/default/dark/1.0'

          for (const [emoteId, pos] of Object.entries(emotes)) {
            const [posStart, posEnd] = pos[0].split('-')
            const emoteName = messageText.slice(+posStart, +posEnd + 1)
            const url = emoteTemplateUrl.replace('$$', emoteId)

            addEmoji(emoteName, url)
          }
        }

        // Process bttv emotes
        if (this.bttvCache) {
          const emoteTemplateUrl = 'https://cdn.betterttv.net/emote/$$/1x'

          const { sharedEmotes } = this.bttvCache
          for (const emote of sharedEmotes) {
            const emoteId = emote.id
            const emoteName = emote.code
            const url = emoteTemplateUrl.replace('$$', emoteId)

            addEmoji(emoteName, url)
          }
        }

        return text
      },

      async addMessage (message) {
        const container = this.$refs.messagesContainer.$refs.content
        let scrollAccuracyPx = 60

        // Check if chat is scrolled to the bottom
        const maxScroll = container.scrollHeight - container.clientHeight + 1
        const currScroll = container.scrollTop
        const shouldKeepScrolledToBottom = (currScroll >= (maxScroll - scrollAccuracyPx))

        // Push new message
        this.messages.push(message)

        // Scroll to the bottom after adding a new mesage if needed
        await this.$nextTick()
        if (shouldKeepScrolledToBottom) {
          const maxScrollUpdated = container.scrollHeight - container.clientHeight + 1
          container.scrollTop = maxScrollUpdated

          // Keep last `maxMessagesCount`
          // Remove old messages only if chat is autoscrolling
          const exceedsMessagesLimit = this.messages.length > this.maxMessagesCount
          if (exceedsMessagesLimit) {
            this.messages = this.messages.slice(this.maxMessagesCount * -1)
          }
        }
      },

      // async scrollToBottom () {
      //   await this.$forceNextTick()
      //   const container = this.$refs.messagesContainer.$refs.content
      //   if (container) {
      //     container.scrollTop = container.scrollHeight
      //     return true
      //   } else {
      //     return false
      //   }
      // }
    },
  }
</script>

<style module lang='stylus'>
  .container
    grid-template-columns: 1.2fr 1fr
    grid-gap: 1rem
    display: grid

  .mainContainer
    grid-template-rows: 1fr min-content
    overflow: auto
    display: grid
    &.hasResult
      grid-gap: 1rem

  .sidebarContainer
    grid-template-rows: min-content min-content
    grid-gap: 2rem
    display: grid

  .messagesContainer
    box-sizing: border-box
    padding: .5rem .75rem
    font-size: .8rem
    overflow: auto

    .message
      user-select: text
      padding: .5rem 0
      &.systemMessage
        font-style: italic
        font-size: .6rem
        opacity: .5
      &.highlight
        --pad: .5rem
        margin-right: calc(var(--pad) * -1)
        margin-left: calc(var(--pad) * -1)
        border-radius: var(--BorderRadius)
        background-color: rebeccapurple
        padding-right: var(--pad)
        padding-left: var(--pad)
      .time
        vertical-align: middle
        display: inline-block
        margin-bottom: .3rem
        font-size: .5rem
        opacity: .5
        &::after
          content: '\00a0'
      .user
        color: var(--color)
        &::after
          content: '\00a0'
      .text
        color: var(--color)
        line-height: 1.5
        cursor: text
        .emote
          margin: -.5rem -0.1rem
          vertical-align: super

  .searchContainer
  .confFoundContainer
    box-sizing: border-box
    padding: .5rem .75rem
    padding-bottom: 1rem
    .input
      margin-bottom: 1rem
      font-size: 13px
    .buttonsWrapper
      grid-gap: .5rem
      margin: 0 2rem
      display: grid
</style>
