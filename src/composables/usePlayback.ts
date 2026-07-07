import { onUnmounted, ref } from 'vue'

/**
 * requestAnimationFrame 駆動の再生コントロール。
 * CSS アニメではなく rAF にすることで、正確な一時停止・可変速度・
 * 複数ストロークを距離ベースで連続再生する進捗管理ができる。
 *
 * @param getDurationMs 現在の設定での「0→1 に要する時間(ms)」を返す関数。
 *        速度スライダの変化に追従できるよう関数で受け取る。
 */
export function usePlayback(getDurationMs: () => number) {
  const progress = ref(1) // 1 = 描き切った状態
  const playing = ref(false)
  let raf = 0
  let lastT = 0

  function frame(t: number) {
    if (!playing.value) return
    if (lastT === 0) lastT = t
    const dt = t - lastT
    lastT = t
    const dur = Math.max(1, getDurationMs())
    progress.value = Math.min(1, progress.value + dt / dur)
    if (progress.value >= 1) {
      playing.value = false
      return
    }
    raf = requestAnimationFrame(frame)
  }

  function play() {
    if (progress.value >= 1) progress.value = 0 // 最後まで来ていたら頭出し
    playing.value = true
    lastT = 0
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(frame)
  }

  function pause() {
    playing.value = false
    cancelAnimationFrame(raf)
  }

  function reset() {
    pause()
    progress.value = 0
  }

  onUnmounted(() => cancelAnimationFrame(raf))

  return { progress, playing, play, pause, reset }
}
