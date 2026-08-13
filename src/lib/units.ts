/** 容量/带宽单位换算，口径与 storplan 保持一致（1 TB = 0.909 TiB） */

export const TB_TO_TIB = 0.909

export function tbToTib(tb: number) {
  return tb * TB_TO_TIB
}

export function formatTiB(tib: number) {
  if (tib >= 1024) return `${(tib / 1024).toFixed(2)} PiB`
  if (tib >= 1) return `${tib.toFixed(2)} TiB`
  return `${(tib * 1024).toFixed(0)} GiB`
}

export function formatTB(tb: number) {
  if (tb >= 1000) return `${(tb / 1000).toFixed(2)} PB`
  return `${tb.toFixed(2)} TB`
}

export function formatPercent(ratio: number, digits = 1) {
  return `${(ratio * 100).toFixed(digits)}%`
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
