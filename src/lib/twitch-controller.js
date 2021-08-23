function pause (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default class {
  constructor ({ clientId, token }) {
    this.clientId = clientId
    this.user = {
      ok: false,
      id: null,
      name: null,
      token,
      expiresIn: null,
      errorMsg: null,
    }
  }

  async api (apiUrl, opts = {}) {
    let isDone = false
    let cursor = null
    let result = {
      ok: false,
      data: [],
    }

    // const onProgressCallback = opts.onProgress ? opts.onProgress : null

    console.log('[API] [%s]\n===> %o', apiUrl, opts)

    // Go through all response pages
    do {
      let query = {}
      if (cursor) query.after = cursor
      if (opts.query) query = { ...query, ...opts.query }
      const optsLocal = { ...opts, query }
      if (opts.body) optsLocal.body = opts.body
      console.log('[API] [%s]\n--> %o', apiUrl, optsLocal)

      const resp = await this._api(apiUrl, optsLocal)
      await pause(250)

      // if (onProgressCallback) {
      //   onProgressCallback({
      //     current: result.data.length,
      //     total: resp.res.total,
      //   })
      // }

      console.log('[API] [%s]\n<-- %o', apiUrl, resp)

      if (resp.ok) {
        const isLastPage = !(resp.res.pagination && resp.res.pagination.cursor)
        result.data.push(...resp.res.data)

        if (isLastPage) {
          isDone = true
          result.ok = true
        } else {
          cursor = resp.res.pagination.cursor
        }
      } else {
        isDone = true
        result = resp
      }
    } while (!isDone)

    console.log('[API] [%s]\n<=== %o', apiUrl, result)

    // if (onProgressCallback) {
    //   onProgressCallback({
    //     current: result.data.length,
    //     total: result.data.length,
    //   })
    // }

    return result
  }

  async _api (apiUrl, opts = {}) {
    const fetchParams = {
      method: opts.method || 'GET',
      headers: {
        authorization: `Bearer ${this.user.token}`,
        'client-id': this.clientId,
      },
    }
    const method = opts.method || 'GET'
    let url = `https://api.twitch.tv/helix/${apiUrl}/`
    let result

    if (opts.query) {
      const query = new URLSearchParams(opts.query).toString()
      url += `?${query}`
    }

    if (opts.headers) {
      fetchParams.headers = { ...fetchParams.headers, ...opts.headers }
    }

    if (opts.body) {
      fetchParams.headers['Content-Type'] = 'application/json'
      fetchParams.body = JSON.stringify(opts.body)
    }

    try {
      const resultRaw = await fetch(url, fetchParams)
      const resultJson = await resultRaw.json()

      if (!resultRaw.ok) {
        throw new Error(JSON.stringify(resultJson, null, 2))
      }

      result = {
        ok: true,
        res: resultJson,
      }
    } catch (e) {
      result = {
        ok: false,
        err: e.message,
      }
    }

    return result
  }

  async checkToken () {
    const { token } = this.user
    let result

    try {
      const resp = await fetch('https://id.twitch.tv/oauth2/validate', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      result = await resp.json()

      if (!resp.ok) {
        throw new Error(result.message)
      }

      this.user = {
        ok: true,
        id: result.user_id,
        name: result.login,
        token,
        expiresIn: result.expires_in,
        errorMsg: null,
      }
    } catch (e) {
      this.user = {
        ok: false,
        id: null,
        name: null,
        token: null,
        expiresIn: null,
        errorMsg: e.message,
      }
    }

    console.log('[API] [validate]\n %o', { raw: result, parsed: this.user })

    return this.user.ok
  }

  auth ({ scope, inNewWindow } = {}) {
    if (!scope) throw new Error('"scope" is missing!')

    const query = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'token',
      redirect_uri: location.origin + location.pathname,
      scope: scope.join(' '),
    }).toString()

    const url = `https://id.twitch.tv/oauth2/authorize?${query}`

    if (inNewWindow) {
      window.open(url, '_blank')
    } else {
      location.href = url
    }
  }

  async revokeToken () {
    const query = new URLSearchParams({
      client_id: this.clientId,
      token: this.user.token,
    }).toString()

    const resp = await fetch(`https://id.twitch.tv/oauth2/revoke?${query}`, {
      method: 'POST',
    })

    console.log('resp', resp)

    if (!resp.ok) {
      alert('Не удалось отозвать токен')
      return false
    }

    this.user = {
      ok: false,
      id: null,
      name: null,
      token: null,
      expiresIn: null,
      errorMsg: null,
    }

    return true
  }
}
