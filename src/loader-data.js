import TwitchController from '@/lib/twitch-controller'
import ls from '@/lib/local-storage-proxy'
const clientId = process.env.VUE_APP_TWITCH_CLIENT_ID

function processHash (hash) {
  const params = {}

  for (const shard of hash.slice(1).split('&')) {
    const [key, value] = shard.split('=')
    params[key] = decodeURIComponent(value)
  }

  return params
}

async function initTwitchController (redirectAuthData = {}) {
  const token = redirectAuthData.access_token || ls.token // Read token
  const controller = new TwitchController({ clientId, token })

  if (redirectAuthData.access_token) {
    ls.token = token // Save token
  }

  return controller
}

export default async () => {
  const hashRaw = location.hash
  const hash = hashRaw ? processHash(hashRaw) : {}
  const twitchController = await initTwitchController(hash)

  // Make URL pretty again after redirect
  if (location.hash) window.history.replaceState(null, '', location.pathname)

  return {
    hash,
    twitchController,
  }
}
