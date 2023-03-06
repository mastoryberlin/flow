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