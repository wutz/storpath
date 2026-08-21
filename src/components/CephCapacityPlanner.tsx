import { useState } from 'react'
import {
  REDUNDANCY_OPTIONS,
  planCephCapacity,
  type CapacityInput,
} from '#/lib/ceph-capacity'
import { formatNumber, formatPercent, formatTB, formatTiB } from '#/lib/units'
import { Field, NoteList, Panel, Stat, inputCls } from './ui'

const DISK_SIZES = [3.84, 7.68, 15.36, 16, 18, 22]

const DEFAULTS: CapacityInput = {
  nodes: 5,
  disksPerNode: 12,
  diskSizeTB: 7.68,
  redundancyId: 'replica-3',
  fullRatio: 0.85,
  reserveNodeFailure: true,
}

export function CephCapacityPlanner() {
  const [input, setInput] = useState<CapacityInput>(DEFAULTS)
  const result = planCephCapacity(input)

  const set = <K extends keyof CapacityInput>(key: K, value: CapacityInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  return (
    <Panel eyebrow="Planner" title="Ceph 集群容量推算" onReset={() => setInput(DEFAULTS)}>
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
              className="w-full accent-brand-600"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={input.reserveNodeFailure}
              onChange={(e) => set('reserveNodeFailure', e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            预留一个节点的容量用于故障自愈
          </label>
        </div>

        <div className="space-y-3">
          <Stat
            label="实际可写容量"
            value={formatTiB(result.usableTiB)}
            note={
              <>
                端到端效率 {formatPercent(result.overallEfficiency)} · 每 1 TiB 可用需采购{' '}
                {result.tbPerUsableTiB.toFixed(2)} TB 裸盘
              </>
            }
          />

          <dl className="divide-y divide-line rounded-md text-sm shadow-hair">
            {[
              ['OSD 数量', `${formatNumber(result.osdCount)} 个`],
              ['裸容量（厂商口径）', formatTB(result.rawTB)],
              ['裸容量（系统口径）', formatTiB(result.rawTiB)],
              [`冗余后（${result.option.label}）`, formatTiB(result.afterRedundancyTiB)],
              ['可容忍主机故障', `${result.option.tolerance} 台`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-3.5 py-2">
                <dt className="text-body">{label}</dt>
                <dd className="font-mono text-[13px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {result.warnings.length > 0 && <NoteList items={result.warnings} tone="warn" />}
        </div>
      </div>
    </Panel>
  )
}
