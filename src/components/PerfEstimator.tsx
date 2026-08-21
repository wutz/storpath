import { useState } from 'react'
import {
  PERF_PROFILES,
  estimateCephPerf,
  formatBW,
  type PerfInput,
  type PerfLimit,
} from '#/lib/ceph-perf'
import { Field, NoteList, Panel, Stat, inputCls } from './ui'

const DEFAULTS: PerfInput = {
  nodes: 8,
  disksPerNode: 12,
  diskWriteMBps: 2000,
  diskReadMBps: 3500,
  publicGbps: 25,
  clusterGbps: 25,
  profileId: 'replica-3',
}

/** 各资源上限横条：瓶颈那一条用品牌色点出来，其余保持中性 */
function LimitBars({ limits, bottleneck }: { limits: PerfLimit[]; bottleneck: PerfLimit }) {
  const max = Math.max(...limits.map((l) => l.valueMBps))
  return (
    <ul className="space-y-2">
      {limits.map((limit) => {
        const isBottleneck = limit.label === bottleneck.label
        return (
          <li key={limit.label}>
            <div className="flex justify-between gap-2 text-[11px]">
              <span className={isBottleneck ? 'font-medium text-ink' : 'text-mute'}>
                {limit.label}
                {isBottleneck && ' ← 瓶颈'}
              </span>
              <span className={`font-mono ${isBottleneck ? 'text-ink' : 'text-mute'}`}>
                {formatBW(limit.valueMBps)}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-soft-2">
              <div
                className={`h-full rounded-full ${isBottleneck ? 'bg-brand-600' : 'bg-line-strong'}`}
                style={{ width: `${(limit.valueMBps / max) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function PerfEstimator() {
  const [input, setInput] = useState<PerfInput>(DEFAULTS)
  const result = estimateCephPerf(input)

  const set = <K extends keyof PerfInput>(key: K, value: PerfInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  return (
    <Panel eyebrow="Planner" title="集群带宽估算与瓶颈定位" onReset={() => setInput(DEFAULTS)}>
      <div className="grid gap-5 px-4 py-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="存储节点数">
              <input
                type="number"
                min={1}
                value={input.nodes}
                onChange={(e) => set('nodes', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
            <Field label="每节点数据盘数">
              <input
                type="number"
                min={1}
                value={input.disksPerNode}
                onChange={(e) => set('disksPerNode', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="单盘写带宽" hint="MB/s，用稳态实测值">
              <input
                type="number"
                min={1}
                value={input.diskWriteMBps}
                onChange={(e) => set('diskWriteMBps', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
            <Field label="单盘读带宽" hint="MB/s">
              <input
                type="number"
                min={1}
                value={input.diskReadMBps}
                onChange={(e) => set('diskReadMBps', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="public 网 Gbps/节点">
              <input
                type="number"
                min={1}
                value={input.publicGbps}
                onChange={(e) => set('publicGbps', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
            <Field label="cluster 网 Gbps/节点" hint="填 0 表示单网共用">
              <input
                type="number"
                min={0}
                value={input.clusterGbps}
                onChange={(e) => set('clusterGbps', Math.max(0, Number(e.target.value) || 0))}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="冗余方式">
            <select
              value={input.profileId}
              onChange={(e) => set('profileId', e.target.value)}
              className={inputCls}
            >
              {PERF_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}（盘写放大 {profile.writeAmp.toFixed(2)}×）
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="预估写带宽"
              size="md"
              value={formatBW(result.write.estimateMBps)}
              note={`瓶颈：${result.write.bottleneck.label}`}
            />
            <Stat
              label="预估读带宽"
              size="md"
              value={formatBW(result.read.estimateMBps)}
              note={`瓶颈：${result.read.bottleneck.label}`}
            />
          </div>

          <div className="rounded-md px-3.5 py-3 shadow-hair">
            <div className="eyebrow mb-2.5">写路径各资源上限</div>
            <LimitBars limits={result.write.limits} bottleneck={result.write.bottleneck} />
          </div>

          <div className="rounded-md px-3.5 py-3 shadow-hair">
            <div className="eyebrow mb-2.5">读路径各资源上限</div>
            <LimitBars limits={result.read.limits} bottleneck={result.read.bottleneck} />
          </div>

          <NoteList items={result.notes} />
        </div>
      </div>
    </Panel>
  )
}
