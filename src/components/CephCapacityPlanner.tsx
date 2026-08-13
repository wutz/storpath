import { useState } from 'react'
import {
  REDUNDANCY_OPTIONS,
  planCephCapacity,
  type CapacityInput,
} from '#/lib/ceph-capacity'
import { formatNumber, formatPercent, formatTB, formatTiB } from '#/lib/units'

const DISK_SIZES = [3.84, 7.68, 15.36, 16, 18, 22]

const DEFAULTS: CapacityInput = {
  nodes: 5,
  disksPerNode: 12,
  diskSizeTB: 7.68,
  redundancyId: 'replica-3',
  fullRatio: 0.85,
  reserveNodeFailure: true,
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function CephCapacityPlanner() {
  const [input, setInput] = useState<CapacityInput>(DEFAULTS)
  const result = planCephCapacity(input)

  const set = <K extends keyof CapacityInput>(key: K, value: CapacityInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            计算器
          </span>
          <span className="text-sm font-medium text-gray-700">Ceph 集群容量推算</span>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULTS)}
          className="text-xs text-gray-400 transition hover:text-gray-700"
        >
          重置
        </button>
      </header>

      <div className="grid gap-5 px-4 py-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="存储节点数">
              <input
                type="number"
                min={1}
                max={200}
                value={input.nodes}
                onChange={(e) => set('nodes', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
            <Field label="每节点数据盘数">
              <input
                type="number"
                min={1}
                max={60}
                value={input.disksPerNode}
                onChange={(e) => set('disksPerNode', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="单盘容量" hint="厂商标称，十进制 TB">
            <select
              value={input.diskSizeTB}
              onChange={(e) => set('diskSizeTB', Number(e.target.value))}
              className={inputCls}
            >
              {DISK_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} TB
                </option>
              ))}
            </select>
          </Field>

          <Field label="冗余方式" hint={result.option.note}>
            <select
              value={input.redundancyId}
              onChange={(e) => set('redundancyId', e.target.value)}
              className={inputCls}
            >
              {REDUNDANCY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}（效率 {formatPercent(option.efficiency, 0)}，容忍 {option.tolerance} 台）
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={`满水位 ${formatPercent(input.fullRatio, 0)}`}
            hint="Ceph 默认 nearfull 0.85 / full 0.95，规划按 0.85 更稳"
          >
            <input
              type="range"
              min={0.6}
              max={0.95}
              step={0.05}
              value={input.fullRatio}
              onChange={(e) => set('fullRatio', Number(e.target.value))}
              className="w-full accent-violet-600"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={input.reserveNodeFailure}
              onChange={(e) => set('reserveNodeFailure', e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            预留一个节点的容量用于故障自愈
          </label>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-violet-50 px-4 py-4 text-center">
            <div className="text-xs font-medium text-violet-700">实际可写容量</div>
            <div className="mt-1 text-3xl font-bold text-violet-900">
              {formatTiB(result.usableTiB)}
            </div>
            <div className="mt-1 text-xs text-violet-700">
              端到端效率 {formatPercent(result.overallEfficiency)} · 每 1 TiB 可用需采购{' '}
              {result.tbPerUsableTiB.toFixed(2)} TB 裸盘
            </div>
          </div>

          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 text-sm">
            {[
              ['OSD 数量', `${formatNumber(result.osdCount)} 个`],
              ['裸容量（厂商口径）', formatTB(result.rawTB)],
              ['裸容量（系统口径）', formatTiB(result.rawTiB)],
              [`冗余后（${result.option.label}）`, formatTiB(result.afterRedundancyTiB)],
              ['可容忍主机故障', `${result.option.tolerance} 台`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-3 py-2">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>

          {result.warnings.length > 0 && (
            <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              {result.warnings.map((warning) => (
                <li key={warning} className="flex gap-1.5">
                  <span className="shrink-0">⚠</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
