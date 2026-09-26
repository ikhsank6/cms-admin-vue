import { toRaw } from 'vue'

/** Deep clone JSON-compatible data (works on Vue reactive proxies, unlike structuredClone). */
export function deepClone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(toRaw(value))) as T)
}
