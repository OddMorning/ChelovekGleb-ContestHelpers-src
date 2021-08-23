/**
 * Properly sorts unicode strings
 */
export default (a, b) => {
  const helperChar = String.fromCharCode(1110)
  const aCode = a.toLowerCase().replace(/ё/g, `е${helperChar}`)
  const bCode = b.toLowerCase().replace(/ё/g, `е${helperChar}`)

  return aCode > bCode
    ? 1
    : aCode < bCode
      ? -1
      : 0
}
