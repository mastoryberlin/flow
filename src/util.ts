export function dig(obj: any, keys: string) {
  console.log('DIGGING into ', obj, keys)
  return keys.split('.').reduce(function (prev, curr) {
    return prev ? prev = prev[curr] : undefined;
  }, obj);
}