import { ref, type Ref } from 'vue'

export interface SwipeHandlers {
  onRight?: () => void
  onLeft?: () => void
  onDown?: () => void
  onUp?: () => void
}

export interface UseSwipeOptions extends SwipeHandlers {
  threshold?: number
  axisLockRatio?: number
}

export function useSwipe(target: Ref<HTMLElement | null>, opts: UseSwipeOptions) {
  const threshold = opts.threshold ?? 80
  const axisLockRatio = opts.axisLockRatio ?? 1.4

  const offsetX = ref(0)
  const offsetY = ref(0)
  const dragging = ref(false)

  let startX = 0
  let startY = 0
  let active = false

  function onPointerDown(e: PointerEvent) {
    if (!target.value) return
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()
    active = true
    dragging.value = true
    startX = e.clientX
    startY = e.clientY
    offsetX.value = 0
    offsetY.value = 0
    target.value.setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!active) return
    e.preventDefault()
    offsetX.value = e.clientX - startX
    offsetY.value = e.clientY - startY
  }

  function onPointerUp(e: PointerEvent) {
    if (!active) return
    e.preventDefault()
    active = false
    dragging.value = false
    target.value?.releasePointerCapture?.(e.pointerId)

    const dx = offsetX.value
    const dy = offsetY.value
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)

    if (adx > threshold && adx > ady * axisLockRatio) {
      if (dx > 0) opts.onRight?.()
      else opts.onLeft?.()
    } else if (ady > threshold && ady > adx * axisLockRatio) {
      if (dy > 0) opts.onDown?.()
      else opts.onUp?.()
    }

    offsetX.value = 0
    offsetY.value = 0
  }

  function bind(el: HTMLElement | null) {
    if (!el) return () => {}
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }

  return { offsetX, offsetY, dragging, bind }
}
