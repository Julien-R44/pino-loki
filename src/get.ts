/**
 * Dynamically get a nested value from an array or object with a
 * string.
 */
export function get<TDefault = unknown>(
  value: any,
  path: string,
  defaultValue?: TDefault,
): TDefault {
  const segments = path.split(/[.[\]]/g)
  let current: any = value

  for (const key of segments) {
    if (current === null) return defaultValue as TDefault
    if (current === undefined) return defaultValue as TDefault

    const unquotedKey = key.replace(/["']/g, '')
    if (unquotedKey.trim() === '') continue

    current = current[unquotedKey]
  }

  if (current === undefined) return defaultValue as TDefault
  return current
}
