export function dig(obj: any, keys: string) {
  // console.log('DIGGING into ', obj, keys)
  return keys.split('.').reduce(function (prev, curr) {
    return prev ? prev = prev[curr] : undefined;
  }, obj);
}

export function tr(text: string, alphabet1: string, alphabet2: string) {
  const c1 = alphabet1.split('')
  const c2 = alphabet2.split('')
  const translationMap = Object.fromEntries(c1.map((c, i) => [c, c2[i] || c]))
  return text
    .split('')
    .map(char => (translationMap[char] || char))
    .join('')
}

export const escapeDots = (text: string) => tr(text, '.|', '|.')
export const unescapeDots = (text: string) => tr(text, '|.', '.|')

// ------------------------------------------------------------------------------------------------------------------------

/**
 * A variant of native `JSON.stringify` which recursively replaces every occurrence of nested objects of the form
 * ```ts
 * { raw: "unquotedExpression", unquoted: true}
 * ```
 * by the plain `unquotedExpression` as a TypeScript expression, with all surrounding quotes stripped away.
 * @param object An arbitrary JSON object.
 * @param space Passed on as-is to `JSON.stringify`.
 * @returns The same return value of `JSON.stringify`, except for the replacements mentioned above.
 */
export function unquotedJSONstringify(object: any, space?: string | number) {
  const N = 1279834926359676
  const markedForRaw = JSON.stringify(object, (key: string, value: any) => {
    if (typeof value === 'object' && value !== null && value.unquoted === true) {
      return `${N}${value.raw}${N}`
    }
    return value;
  }, space);
  return markedForRaw.replace(new RegExp(`( *)"${N}(.+)${N}"`, 'g'), (fullMatch, indentation, raw) => {
    console.log('INDENTATIONLENGTH', indentation.length)
    const lines = JSON.parse(`"${raw}"`).split('\n') as string[]
    return lines.map(l => indentation + l).join('\n')
  });
}
