/**
 * Ceph 集群容量推算。
 *
 * 教学口径，刻意保持公式可手算：
 *   裸容量(TiB) = 节点数 × 每节点盘数 × 单盘 TB × 0.909
 *   冗余后      = 裸容量 × 冗余效率
 *   可写容量    = 冗余后 × 满水位 × (1 - 节点级重建预留)
 *
 * 真实项目还要计入 BlueStore 元数据、PG 分布不均带来的木桶效应，
 * 这些在 planning/perf-estimate 一课里单独讨论。
 */
import { tbToTib } from './units'

export interface RedundancyOption {
  id: string
  label: string
  /** 空间效率：可用 / 裸 */
  efficiency: number
  /** 最少节点数（按主机级故障域） */
  minNodes: number
  /** 可容忍同时故障的主机数 */
  tolerance: number
  note: string
}

export const REDUNDANCY_OPTIONS: RedundancyOption[] = [
  {
    id: 'replica-2',
    label: '2 副本',
    efficiency: 1 / 2,
    minNodes: 2,
    tolerance: 1,
    note: '生产不建议：重建期间再坏一块盘就丢数据',
  },
  {
    id: 'replica-3',
    label: '3 副本',
    efficiency: 1 / 3,
    minNodes: 3,
    tolerance: 2,
    note: '默认选择：块存储、数据库、元数据池',
  },
  {
    id: 'ec-4-2',
    label: 'EC 4+2',
    efficiency: 4 / 6,
    minNodes: 7,
    tolerance: 2,
    note: '对象/归档常用，节点数少时优先',
  },
  {
    id: 'ec-8-3',
    label: 'EC 8+3',
    efficiency: 8 / 11,
    minNodes: 12,
    tolerance: 3,
    note: '大集群，空间效率与容错兼顾',
  },
  {
    id: 'ec-8-2',
    label: 'EC 8+2',
    efficiency: 8 / 10,
    minNodes: 11,
    tolerance: 2,
    note: '空间效率最高，容错最紧',
  },
]

export interface CapacityInput {
  nodes: number
  disksPerNode: number
  diskSizeTB: number
  redundancyId: string
  /** 满水位，Ceph 默认 full_ratio 0.95 / nearfull 0.85 */
  fullRatio: number
  /** 是否预留一个节点的空间用于节点故障后自愈 */
  reserveNodeFailure: boolean
}

export interface CapacityResult {
  option: RedundancyOption
  osdCount: number
  rawTB: number
  rawTiB: number
  afterRedundancyTiB: number
  usableTiB: number
  /** 端到端效率：可写 / 裸 */
  overallEfficiency: number
  /** 每 TiB 可写容量需要买多少 TB 裸盘 */
  tbPerUsableTiB: number
  warnings: string[]
}

export function planCephCapacity(input: CapacityInput): CapacityResult {
  const option =
    REDUNDANCY_OPTIONS.find((o) => o.id === input.redundancyId) ?? REDUNDANCY_OPTIONS[1]

  const osdCount = input.nodes * input.disksPerNode
  const rawTB = osdCount * input.diskSizeTB
  const rawTiB = tbToTib(rawTB)
  const afterRedundancyTiB = rawTiB * option.efficiency

  const nodeReserve = input.reserveNodeFailure && input.nodes > 1 ? 1 - 1 / input.nodes : 1
  const usableTiB = afterRedundancyTiB * input.fullRatio * nodeReserve

  const warnings: string[] = []
  if (input.nodes < option.minNodes) {
    warnings.push(
      `${option.label} 建议至少 ${option.minNodes} 个节点（当前 ${input.nodes} 个），否则无法按主机划分故障域，坏一台就可能不可用。`,
    )
  }
  if (input.nodes < 3) {
    warnings.push('节点数少于 3，MON 无法组成 quorum，不是可用的生产形态。')
  }
  if (input.fullRatio > 0.9) {
    warnings.push('满水位超过 90%：一旦触发 full_ratio 集群会拒绝写入，且再平衡将没有腾挪空间。')
  }
  if (option.id.startsWith('ec-') && input.disksPerNode * input.nodes < 20) {
    warnings.push('OSD 总数偏少时使用 EC，重建流量集中，恢复期间性能下降会很明显。')
  }
  if (input.diskSizeTB >= 16) {
    warnings.push('单盘容量偏大：坏盘后重建的数据量与重建窗口同步变长，注意评估重建期间的风险。')
  }

  return {
    option,
    osdCount,
    rawTB,
    rawTiB,
    afterRedundancyTiB,
    usableTiB,
    overallEfficiency: rawTiB > 0 ? usableTiB / rawTiB : 0,
    tbPerUsableTiB: usableTiB > 0 ? rawTB / usableTiB : 0,
    warnings,
  }
}
