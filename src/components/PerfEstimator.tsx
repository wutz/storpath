import { useState } from 'react'
import {
  PERF_PROFILES,
  estimateCephPerf,
  formatBW,
  type PerfInput,
  type PerfLimit,
} from '#/lib/ceph-perf'

const DEFAULTS: PerfInput = {
  nodes: 8,
  disksPerNode: 12,
  diskWriteMBps: 2000,
  diskReadMBps: 3500,
  publicGbps: 25,
  clusterGbps: 25,
  profileId: 'replica-3',
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  )
}

function LimitBars({ limits, bottleneck }: { limits: PerfLimit[]; bottleneck: PerfLimit }) {
  const max = Math.max(...limits.map((l) => l.valueMBps))
  return (
    <ul className="space-y-1.5">
      {limits.map((limit) => {
        const isBottleneck = limit.label === bottleneck.label
        return (
          <li key={limit.label}>
            <div className="flex justify-between text-[11px]">
              <span className={isBottleneck ? 'font-semibold text-rose-700' : 'text-gray-500'}>
                {limit.label}
                {isBottleneck && ' ← 瓶颈'}
              </span>
              <span className="font-mono text-gray-600">{formatBW(limit.valueMBps)}</span>
            </div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${isBottleneck ? 'bg-rose-500' : 'bg-gray-300'}`}
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
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            计算器
          </span>
          <span className="text-sm font-medium text-gray-700">集群带宽估算与瓶颈定位</span>
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
            <div className="rounded-xl bg-violet-50 px-3 py-3 text-center">
              <div className="text-xs font-medium text-violet-700">预估写带宽</div>
              <div className="mt-1 text-2xl font-bold text-violet-900">
                {formatBW(result.write.estimateMBps)}
              </div>
              <div className="mt-0.5 text-[11px] text-violet-700">
                瓶颈：{result.write.bottleneck.label}
              </div>
            </div>
            <div className="rounded-xl bg-sky-50 px-3 py-3 text-center">
              <div className="text-xs font-medium text-sky-700">预估读带宽</div>
              <div className="mt-1 text-2xl font-bold text-sky-900">
                {formatBW(result.read.estimateMBps)}
              </div>
              <div className="mt-0.5 text-[11px] text-sky-700">
                瓶颈：{result.read.bottleneck.label}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 px-3 py-3">
            <div className="mb-2 text-xs font-semibold text-gray-700">写路径各资源上限</div>
            <LimitBars limits={result.write.limits} bottleneck={result.write.bottleneck} />
          </div>

          <div className="rounded-xl border border-gray-200 px-3 py-3">
            <div className="mb-2 text-xs font-semibold text-gray-700">读路径各资源上限</div>
            <LimitBars limits={result.read.limits} bottleneck={result.read.bottleneck} />
          </div>

          <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            {result.notes.map((note) => (
              <li key={note} className="flex gap-1.5">
                <span className="shrink-0">·</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
