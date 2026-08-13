import { useMemo, useState } from 'react'
import {
  CLUSTER,
  FAILURE_DOMAIN_LABEL,
  crushMap,
  mapBatch,
  type CrushInput,
  type FailureDomain,
} from '#/lib/crush'

const DEFAULTS: CrushInput = {
  poolId: 3,
  objectName: 'rbd_data.10a26b8b4567.0000000000000042',
  pgNum: 128,
  replicas: 3,
  failureDomain: 'host',
  downOsds: [],
}

const PG_NUMS = [32, 64, 128, 256]
const SAMPLE_OBJECTS = Array.from(
  { length: 200 },
  (_, i) => `rbd_data.10a26b8b4567.${i.toString(16).padStart(16, '0')}`,
)

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function CrushExplorer() {
  const [input, setInput] = useState<CrushInput>(DEFAULTS)
  const result = crushMap(input)

  const set = <K extends keyof CrushInput>(key: K, value: CrushInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  function toggleDown(osdId: number) {
    setInput((prev) => ({
      ...prev,
      downOsds: prev.downOsds.includes(osdId)
        ? prev.downOsds.filter((id) => id !== osdId)
        : [...prev.downOsds, osdId],
    }))
  }

  // pg_num 翻倍后有多少对象换了 PG —— 直观解释"为什么调 pg_num 会全量迁移"
  const churn = useMemo(() => {
    const before = mapBatch(SAMPLE_OBJECTS, input.pgNum)
    const after = mapBatch(SAMPLE_OBJECTS, input.pgNum * 2)
    const moved = before.filter((pg, i) => pg !== after[i]).length
    return Math.round((moved / SAMPLE_OBJECTS.length) * 100)
  }, [input.pgNum])

  const actingSet = new Set(result.acting)
  const upSet = new Set(result.up)
  const downSet = new Set(input.downOsds)

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
            推演
          </span>
          <span className="text-sm font-medium text-gray-700">
            对象 → PG → OSD 映射
          </span>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULTS)}
          className="text-xs text-gray-400 transition hover:text-gray-700"
        >
          重置
        </button>
      </header>

      <div className="space-y-3 px-4 py-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">对象名</span>
          <input
            value={input.objectName}
            onChange={(e) => set('objectName', e.target.value)}
            spellCheck={false}
            className={`${inputCls} font-mono text-xs`}
          />
          <span className="mt-1 block text-[11px] text-gray-400">
            改一个字符试试：PG 会完全变到另一个位置
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">pg_num</span>
            <select
              value={input.pgNum}
              onChange={(e) => set('pgNum', Number(e.target.value))}
              className={inputCls}
            >
              {PG_NUMS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">副本数</span>
            <select
              value={input.replicas}
              onChange={(e) => set('replicas', Number(e.target.value))}
              className={inputCls}
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">故障域</span>
            <select
              value={input.failureDomain}
              onChange={(e) => set('failureDomain', e.target.value as FailureDomain)}
              className={inputCls}
            >
              {(Object.keys(FAILURE_DOMAIN_LABEL) as FailureDomain[]).map((d) => (
                <option key={d} value={d}>
                  {FAILURE_DOMAIN_LABEL[d]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* 计算过程 */}
        <div className="rounded-xl bg-gray-50 px-4 py-3 font-mono text-xs leading-relaxed text-gray-700">
          <div>
            <span className="text-gray-400">1. hash(对象名) =</span> {result.objectHash}
          </div>
          <div>
            <span className="text-gray-400">2. pg_seq = hash % pg_num =</span>{' '}
            {result.objectHash} % {input.pgNum} ={' '}
            <span className="font-semibold text-rose-700">{result.pgSeq}</span>
          </div>
          <div>
            <span className="text-gray-400">3. PG =</span>{' '}
            <span className="font-semibold text-rose-700">{result.pgName}</span>
          </div>
          <div>
            <span className="text-gray-400">4. CRUSH(PG, crushmap, rule) → up =</span>{' '}
            <span className="font-semibold text-emerald-700">
              [{result.up.join(', ')}]
            </span>
          </div>
          <div>
            <span className="text-gray-400">5. 剔除 down 后 acting =</span>{' '}
            <span
              className={`font-semibold ${result.remapped ? 'text-amber-700' : 'text-emerald-700'}`}
            >
              [{result.acting.join(', ')}]
            </span>
            {result.acting.length > 0 && (
              <span className="text-gray-400">，primary = osd.{result.acting[0]}</span>
            )}
          </div>
        </div>

        {/* 状态标记 */}
        <div className="flex flex-wrap gap-2 text-xs">
          {!result.remapped && !result.undersized && (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">
              active+clean
            </span>
          )}
          {result.remapped && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">
              remapped（up 与 acting 不一致）
            </span>
          )}
          {result.undersized && (
            <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-700">
              undersized+degraded（故障域不够，凑不齐 {input.replicas} 副本）
            </span>
          )}
        </div>

        {/* 集群拓扑 */}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            <span>点击任意 OSD 可把它标记为 down，观察 acting 怎么变</span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500" /> primary
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-sky-400" /> 副本
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-gray-800" /> down
            </span>
          </div>

          <div className="space-y-2">
            {['rack1', 'rack2', 'rack3'].map((rack) => (
              <div key={rack} className="rounded-lg border border-gray-200 px-2 py-2">
                <div className="mb-1.5 text-[11px] font-medium text-gray-500">{rack}</div>
                <div className="grid grid-cols-2 gap-2">
                  {[...new Set(CLUSTER.filter((o) => o.rack === rack).map((o) => o.host))].map(
                    (host) => (
                      <div key={host} className="rounded bg-gray-50 px-2 py-1.5">
                        <div className="mb-1 text-[11px] text-gray-500">{host}</div>
                        <div className="flex gap-1">
                          {CLUSTER.filter((o) => o.host === host).map((osd) => {
                            const isDown = downSet.has(osd.id)
                            const isPrimary = result.acting[0] === osd.id
                            const isReplica = actingSet.has(osd.id) && !isPrimary
                            const wasUp = upSet.has(osd.id) && !actingSet.has(osd.id)

                            let cls = 'bg-white border-gray-200 text-gray-400'
                            if (isDown) cls = 'bg-gray-800 border-gray-800 text-white'
                            else if (isPrimary)
                              cls = 'bg-emerald-500 border-emerald-500 text-white'
                            else if (isReplica) cls = 'bg-sky-400 border-sky-400 text-white'
                            if (wasUp && !isDown)
                              cls = 'bg-white border-amber-400 text-amber-600'

                            return (
                              <button
                                key={osd.id}
                                type="button"
                                onClick={() => toggleDown(osd.id)}
                                title={`osd.${osd.id} · ${osd.host} · ${osd.rack}`}
                                className={`h-7 flex-1 rounded border text-[10px] font-medium transition hover:opacity-80 ${cls}`}
                              >
                                {osd.id}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          把 pg_num 从 <strong>{input.pgNum}</strong> 调到{' '}
          <strong>{input.pgNum * 2}</strong>，抽样 200 个对象里约{' '}
          <strong>{churn}%</strong> 会落到不同的 PG 上 —— 这些数据都要搬家。
          这就是「调整 pg_num 会触发大规模迁移」的由来。
        </div>
      </div>
    </section>
  )
}
