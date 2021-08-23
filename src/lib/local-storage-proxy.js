const localStorageProxy = new Proxy({}, {
  get (_, prop) {
    const value = JSON.parse(localStorage.getItem(prop))
    return value
  },
  set (_, prop, value) {
    localStorage.setItem(prop, JSON.stringify(value))
    return true
  },
  deleteProperty (_, prop) {
    localStorage.removeItem(prop)
    return true
  },
})

export default localStorageProxy
