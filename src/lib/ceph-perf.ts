/**
 * Ceph 集群性能估算（教学口径）。
 *
 * 思路：分别算出盘、cluster 网、public 网三条线的上限，取最小值，
 * 再乘一个经验折扣。目的是回答「瓶颈在哪」，而不是给出精确承诺值。
 *
 * 写放大：
 *   N 副本   → 一次客户端写产生 N 次盘写，其中 N-1 份走 cluster 网
 *   EC k+m   → 一次客户端写产生 (k+m)/k 倍盘写，其中 (k+m-1)/k 走 cluster 网
 */

export interface PerfProfile {
  id: string
  label: string
  /** 盘写放大倍数 */
  writeAmp: number
  /** 走 cluster 网的倍数 */
  clusterAmp: number
}

export const PERF_PROFILES: PerfProfile[] = [
  { id: 'replica-2', label: '2 副本', writeAmp: 2, clusterAmp: 1 },
  { id: 'replica-3', label: '3 副本', writeAmp: 3, clusterAmp: 2 },
  { id: 'ec-4-2', label: 'EC 4+2', writeAmp: 6 / 4, clusterAmp: 5 / 4 },
  { id: 'ec-8-3', label: 'EC 8+3', writeAmp: 11 / 8, clusterAmp: 10 / 8 },
  { id: 'ec-8-2', label: 'EC 8+2', writeAmp: 10 / 8, clusterAmp: 9 / 8 },
]

/** 软件栈、PG 分布不均、长尾等因素的经验折扣 */
export const EFFICIENCY = { write: 0.7, read: 0.8 }

export interface PerfInput {
  nodes: number
  disksPerNode: number
  /** 单盘顺序写带宽 MB/s */
  diskWriteMBps: number
  /** 单盘顺序读带宽 MB/s */
  diskReadMBps: number
  /** 每节点 public 网带宽 Gbps */
  publicGbps: number
  /** 每节点 cluster 网带宽 Gbps；0 表示与 public 共用一张网 */
  clusterGbps: number
  profileId: string
}

export interface PerfLimit {
  label: string
  /** 该资源允许的客户端带宽上限 MB/s */
  valueMBps: number
}

export interface PerfResult {
  profile: PerfProfile
  osdCount: number
  write: {
    limits: PerfLimit[]
    bottleneck: PerfLimit
    estimateMBps: number
  }
  read: {
    limits: PerfLimit[]
    bottleneck: PerfLimit
    estimateMBps: number
  }
  notes: string[]
}

/** Gbps → MB/s，按 90% 可用线速折算 */
function gbpsToMBps(gbps: number) {
  return (gbps * 1000 * 0.9) / 8
}

function minBy(limits: PerfLimit[]): PerfLimit {
  return limits.reduce((min, cur) => (cur.valueMBps < min.valueMBps ? cur : min))
}

export function estimateCephPerf(input: PerfInput): PerfResult {
  const profile = PERF_PROFILES.find((p) => p.id === input.profileId) ?? PERF_PROFILES[1]
  const osdCount = input.nodes * input.disksPerNode

  const diskWriteTotal = osdCount * input.diskWriteMBps
  const diskReadTotal = osdCount * input.diskReadMBps

  const shared = input.clusterGbps <= 0
  const publicTotal = gbpsToMBps(input.publicGbps) * input.nodes
  const clusterTotal = shared ? publicTotal : gbpsToMBps(input.clusterGbps) * input.nodes

  // 写：盘要承受 writeAmp 倍；cluster 网要承受 clusterAmp 倍；public 网承受 1 倍
  const writeLimits: PerfLimit[] = [
    { label: '数据盘', valueMBps: diskWriteTotal / profile.writeAmp },
    {
      label: shared ? '网络（单网共用）' : 'cluster 网络',
      valueMBps: shared
        ? publicTotal / (1 + profile.clusterAmp)
        : clusterTotal / profile.clusterAmp,
    },
  ]
  if (!shared) {
    writeLimits.push({ label: 'public 网络', valueMBps: publicTotal })
  }

  // 读：正常路径下只读一份，盘和 public 网各承受 1 倍
  const readLimits: PerfLimit[] = [
    { label: '数据盘', valueMBps: diskReadTotal },
    { label: shared ? '网络（单网共用）' : 'public 网络', valueMBps: publicTotal },
  ]

  const writeBottleneck = minBy(writeLimits)
  const readBottleneck = minBy(readLimits)

  const notes: string[] = []
  if (shared) {
    notes.push('未做前后端网络分离：副本流量与客户端流量抢同一张网，恢复期间业务性能会明显下降。')
  }
  if (profile.id.startsWith('ec-')) {
    notes.push('EC 的估算只对大块顺序 I/O 成立；4K 随机小写会因为分片放大而远低于此值。')
  }
  if (input.disksPerNode * input.diskWriteMBps > gbpsToMBps(Math.max(input.publicGbps, input.clusterGbps)) * 3) {
    notes.push('单节点盘的聚合带宽远超网卡能力，加盘不会再提升带宽，应先升级网络。')
  }
  notes.push('以上为顺序大块带宽估算；随机小 I/O 的上限由 IOPS 和延迟决定，需要单独测量。')

  return {
    profile,
    osdCount,
    write: {
      limits: writeLimits,
      bottleneck: writeBottleneck,
      estimateMBps: writeBottleneck.valueMBps * EFFICIENCY.write,
    },
    read: {
      limits: readLimits,
      bottleneck: readBottleneck,
      estimateMBps: readBottleneck.valueMBps * EFFICIENCY.read,
    },
    notes,
  }
}

export function formatBW(mbps: number) {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} GB/s`
  return `${mbps.toFixed(0)} MB/s`
}
