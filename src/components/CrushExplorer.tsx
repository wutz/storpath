import { useMemo, useState } from 'react'
import {
  CLUSTER,
  FAILURE_DOMAIN_LABEL,
  crushMap,
  mapBatch,
  type CrushInput,
  type FailureDomain,
} from '#/lib/crush'
import { Field, Panel, inputCls } from './ui'

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
    <Panel eyebrow="Explorer" title="对象 → PG → OSD 映射" onReset={() => setInput(DEFAULTS)}>
      <div className="space-y-3.5 px-4 py-4">
        <Field label="对象名" hint="改一个字符试试：PG 会完全变到另一个位置">
          <input
            value={input.objectName}
            onChange={(e) => set('objectName', e.target.value)}
            spellCheck={false}
            className={`${inputCls} font-mono text-xs`}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="pg_num">
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
          </Field>

          <Field label="副本数">
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
          </Field>

          <Field label="故障域">
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
          </Field>
        </div>

        {/* 计算过程 */}
        <div className="space-y-0.5 rounded-md bg-ink px-4 py-3.5 font-mono text-xs leading-relaxed text-white/70">
          <div>
            <span className="text-white/35">1. hash(对象名) =</span> {result.objectHash}
          </div>
          <div>
            <span className="text-white/35">2. pg_seq = hash % pg_num =</span> {result.objectHash} %{' '}
            {input.pgNum} = <span className="font-medium text-white">{result.pgSeq}</span>
          </div>
          <div>
            <span className="text-white/35">3. PG =</span>{' '}
            <span className="font-medium text-white">{result.pgName}</span>
          </div>
          <div>
            <span className="text-white/35">4. CRUSH(PG, crushmap, rule) → up =</span>{' '}
            <span className="font-medium text-white">[{result.up.join(', ')}]</span>
          </div>
          <div>
            <span className="text-white/35">5. 剔除 down 后 acting =</span>{' '}
            <span className={`font-medium ${result.remapped ? 'text-warn' : 'text-white'}`}>
              [{result.acting.join(', ')}]
            </span>
            {result.acting.length > 0 && (
              <span className="text-white/35">，primary = osd.{result.acting[0]}</span>
            )}
          </div>
        </div>

        {/* 状态标记 */}
        <div className="flex flex-wrap gap-2 font-mono text-[11px]">
          {!result.remapped && !result.undersized && (
            <span className="rounded-xs bg-info-soft px-2 py-0.5 text-info-deep">active+clean</span>
          )}
          {result.remapped && (
            <span className="rounded-xs bg-warn-soft px-2 py-0.5 text-warn-deep">
              remapped（up 与 acting 不一致）
            </span>
          )}
          {result.undersized && (
            <span className="rounded-xs bg-danger-soft px-2 py-0.5 text-danger-deep">
              undersized+degraded（故障域不够，凑不齐 {input.replicas} 副本）
            </span>
          )}
        </div>

        {/* 集群拓扑 */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mute">
            <span>点击任意 OSD 可把它标记为 down，观察 acting 怎么变</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-brand-600" /> primary
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-info" /> 副本
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-ink" /> down
            </span>
          </div>

          <div className="space-y-2">
            {['rack1', 'rack2', 'rack3'].map((rack) => (
              <div key={rack} className="rounded-md px-2.5 py-2 shadow-hair">
                <div className="mb-1.5 font-mono text-[11px] text-mute">{rack}</div>
                <div className="grid grid-cols-2 gap-2">
                  {[...new Set(CLUSTER.filter((o) => o.rack === rack).map((o) => o.host))].map(
                    (host) => (
                      <div key={host} className="rounded-sm bg-soft-2 px-2 py-1.5">
                        <div className="mb-1 font-mono text-[11px] text-mute">{host}</div>
                        <div className="flex gap-1">
                          {CLUSTER.filter((o) => o.host === host).map((osd) => {
                            const isDown = downSet.has(osd.id)
                            const isPrimary = result.acting[0] === osd.id
                            const isReplica = actingSet.has(osd.id) && !isPrimary
                            const wasUp = upSet.has(osd.id) && !actingSet.has(osd.id)

                            let cls = 'bg-canvas border-line text-mute'
                            if (isDown) cls = 'bg-ink border-ink text-white'
                            else if (isPrimary) cls = 'bg-brand-600 border-brand-600 text-white'
                            else if (isReplica) cls = 'bg-info border-info text-white'
                            if (wasUp && !isDown) cls = 'bg-canvas border-warn text-warn-deep'

                            return (
                              <button
                                key={osd.id}
                                type="button"
                                onClick={() => toggleDown(osd.id)}
                                title={`osd.${osd.id} · ${osd.host} · ${osd.rack}`}
                                className={`h-7 flex-1 rounded-xs border font-mono text-[10px] transition hover:opacity-80 ${cls}`}
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

        <p className="rounded-md bg-soft-2 px-3.5 py-3 text-xs leading-relaxed text-body">
          把 pg_num 从 <strong className="font-mono text-ink">{input.pgNum}</strong> 调到{' '}
          <strong className="font-mono text-ink">{input.pgNum * 2}</strong>，抽样 200 个对象里约{' '}
          <strong className="font-mono text-ink">{churn}%</strong> 会落到不同的 PG 上 ——
          这些数据都要搬家。这就是「调整 pg_num 会触发大规模迁移」的由来。
        </p>
      </div>
    </Panel>
  )
}
