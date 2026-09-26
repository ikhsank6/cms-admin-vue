import { ref } from 'vue'
import { toast } from 'vue-sonner'
import type { ZodType } from 'zod'
import { toApiError } from '@/services/api'

/**
 * Wrap a form submit: optional Zod validation, server validation errors mapped to fields,
 * loading state and toast feedback.
 */
export function useFormSubmit() {
  const errors = ref<Record<string, string>>({})
  const submitting = ref(false)

  function validate<T>(schema: ZodType<T>, value: unknown): value is T {
    const result = schema.safeParse(value)
    if (result.success) {
      errors.value = {}
      return true
    }
    const next: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.')
      if (!next[key]) next[key] = issue.message
    }
    errors.value = next
    toast.error('Periksa kembali isian form')
    return false
  }

  async function submit<T>(fn: () => Promise<T>, successMessage?: string): Promise<T | undefined> {
    submitting.value = true
    try {
      const result = await fn()
      errors.value = {}
      if (successMessage) toast.success(successMessage)
      return result
    } catch (e) {
      const err = toApiError(e)
      if (err.details) {
        errors.value = Object.fromEntries(
          Object.entries(err.details).map(([k, v]) => [k, v[0] ?? '']),
        )
      }
      toast.error(err.message)
      return undefined
    } finally {
      submitting.value = false
    }
  }

  return { errors, submitting, validate, submit }
}
