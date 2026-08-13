/**
 * CRUSH 映射的教学级模拟。
 *
 * 不是 Ceph 的真实 CRUSH 实现（真实版本有 straw2、权重、调整因子、重试等），
 * 但保留了三个最关键的性质，足以让人建立正确直觉：
 *   1. object → PG 是哈希取模，pg_num 一变映射全变
 *   2. PG → OSD 是纯计算，无需查表，同样的输入必得同样的输出
 *   3. 故障域约束：副本必须落在不同的 host / rack
 *
 * 所有哈希都是确定性的，因此 SSR 与客户端渲染结果一致。
 */

/** FNV-1a，32 位 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

export interface OsdNode {
  id: number
  host: string
  rack: string
}

/** 演示用拓扑：3 机架 × 2 主机 × 4 OSD = 24 个 OSD */
export const CLUSTER: OsdNode[] = Array.from({ length: 24 }, (_, i) => {
  const hostIndex = Math.floor(i / 4)
  return {
    id: i,
    host: `ceph-node${hostIndex + 1}`,
    rack: `rack${Math.floor(hostIndex / 2) + 1}`,
  }
})

export const HOSTS = [...new Set(CLUSTER.map((o) => o.host))]
export const RACKS = [...new Set(CLUSTER.map((o) => o.rack))]

export type FailureDomain = 'osd' | 'host' | 'rack'

export const FAILURE_DOMAIN_LABEL: Record<FailureDomain, string> = {
  osd: 'osd（同主机也可能）',
  host: 'host（默认）',
  rack: 'rack',
}

function bucketOf(osd: OsdNode, domain: FailureDomain): string {
  if (domain === 'rack') return osd.rack
  if (domain === 'host') return osd.host
  return `osd.${osd.id}`
}

/** 模拟 straw：为每个候选算一个确定性得分，取最高的若干个 */
function straw(pgId: number, key: string): number {
  return fnv1a(`${pgId}:${key}`)
}

export interface CrushResult {
  /** 对象名的哈希 */
  objectHash: number
  /** PG 序号（池内） */
  pgSeq: number
  /** 展示用的 PG 名，形如 3.1f */
  pgName: string
  /** 按 crushmap 算出的应然分布 */
  up: number[]
  /** 剔除 down 的 OSD 后实际生效的分布 */
  acting: number[]
  /** up 与 acting 不一致，即处于 remapped 状态 */
  remapped: boolean
  /** 因故障域不足而凑不齐副本数 */
  undersized: boolean
}

export interface CrushInput {
  poolId: number
  objectName: string
  pgNum: number
  replicas: number
  failureDomain: FailureDomain
  /** 被标记为 down 的 OSD id */
  downOsds: number[]
}

export function crushMap(input: CrushInput): CrushResult {
  const objectHash = fnv1a(input.objectName)
  const pgSeq = objectHash % input.pgNum
  const pgName = `${input.poolId}.${pgSeq.toString(16)}`

  // 第一步：在故障域层面挑选桶
  const buckets = [...new Set(CLUSTER.map((o) => bucketOf(o, input.failureDomain)))]
  const rankedBuckets = buckets
    .map((bucket) => ({ bucket, score: straw(pgSeq, bucket) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.replicas)
    .map((b) => b.bucket)

  // 第二步：每个桶里挑一个 OSD
  const up = rankedBuckets.map((bucket) => {
    const candidates = CLUSTER.filter((o) => bucketOf(o, input.failureDomain) === bucket)
    return candidates
      .map((o) => ({ id: o.id, score: straw(pgSeq, `osd.${o.id}`) }))
      .sort((a, b) => b.score - a.score)[0].id
  })

  // 第三步：剔除 down 的 OSD，尝试找替补
  const downSet = new Set(input.downOsds)
  const best = (candidates: OsdNode[]) =>
    candidates
      .map((o) => ({ id: o.id, score: straw(pgSeq, `osd.${o.id}`) }))
      .sort((a, b) => b.score - a.score)[0].id

  // 先把存活的占位记下来，避免替补时又选到别的副本已占的故障域
  const kept = up.map((id) => (downSet.has(id) ? null : id))
  const chosen = new Set(kept.filter((id): id is number => id !== null))
  const usedBuckets = new Set(
    [...chosen].map((id) => bucketOf(CLUSTER[id], input.failureDomain)),
  )

  const acting: number[] = []
  for (let i = 0; i < up.length; i++) {
    const keptId = kept[i]
    if (keptId !== null) {
      acting.push(keptId)
      continue
    }

    const origBucket = bucketOf(CLUSTER[up[i]], input.failureDomain)

    // 优先在原故障域内找替补
    let candidates = CLUSTER.filter(
      (o) =>
        bucketOf(o, input.failureDomain) === origBucket &&
        !downSet.has(o.id) &&
        !chosen.has(o.id),
    )

    // 原故障域整个没了：换一个还没被占用的故障域
    if (!candidates.length) {
      candidates = CLUSTER.filter(
        (o) =>
          !downSet.has(o.id) &&
          !chosen.has(o.id) &&
          !usedBuckets.has(bucketOf(o, input.failureDomain)),
      )
    }

    // 仍然找不到 → 这个副本位置空缺，PG 进入 undersized
    if (!candidates.length) continue

    const pick = best(candidates)
    acting.push(pick)
    chosen.add(pick)
    usedBuckets.add(bucketOf(CLUSTER[pick], input.failureDomain))
  }

  return {
    objectHash,
    pgSeq,
    pgName,
    up,
    acting,
    remapped: up.join(',') !== acting.join(','),
    undersized: acting.length < input.replicas,
  }
}

/** 把一批对象名映射到 PG，用于展示 pg_num 变化带来的影响面 */
export function mapBatch(objectNames: string[], pgNum: number): number[] {
  return objectNames.map((name) => fnv1a(name) % pgNum)
}
