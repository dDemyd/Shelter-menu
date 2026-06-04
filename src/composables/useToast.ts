import { ref } from 'vue'

export interface Toast {
  id: number
  text: string
  variant: 'default' | 'success' | 'error'
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function show(text: string, variant: Toast['variant'] = 'default', ms = 1800) {
    const id = nextId++
    toasts.value.push({ id, text, variant })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, ms)
  }
  return {
    toasts,
    show,
    success: (m: string, ms?: number) => show(m, 'success', ms),
    error: (m: string, ms?: number) => show(m, 'error', ms),
  }
}
