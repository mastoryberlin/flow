export const evaluateInContext = (value: string) => `(context: Context) => {
  for (const [key, value] of Object.entries(context)) {
    if (key in globalThis) {
      throw new Error('Illegal name for context variable: "' + key + '" is already defined as a global property. Please use a different name!')
    } else {
      Object.defineProperty(globalThis, key, {
        value,
        enumerable: false,
        configurable: true,
        writable: true,
      })
    }
  }
  const __userStore__ = usePersistedAccountStore()
  const userName = __userStore__.personalInfo.given_name ?? __userStore__.defaultName ?? '???'
  const username = userName
  //@ts-ignore
  const __returnValue__ = ${value}
  for (const [key] of Object.entries(context)) {
    //@ts-ignore
    delete globalThis[key]
  }
  return __returnValue__
}`
