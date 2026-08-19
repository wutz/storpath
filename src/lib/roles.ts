/**
 * 岗位路线 —— 首页的组织方式，也是课程页的"路线模式"。
 *
 * 课程本身仍然只有一份（见 curriculum.ts 的 L0–L4 阶段），
 * 这里做的是"按岗位裁剪并重排顺序"：同一节课可以出现在多条路线里，
 * 每条路线只挑这个岗位真正用得上的部分，再切成几段推进。
 *
 * 存储运维工程师那条不手写课程清单，直接由 L0–L4 全量阶段生成 —— 也就是
 * 站点原来的那条完整主线，它用 layout: 'catalog' 按阶段通读的样式渲染。
 */
import { type Lesson, type Track, getLesson, lessonKey, tracks } from './curriculum'

export interface RoleStage {
  title: string
  /** 这一段解决什么问题，一行以内 */
  hint: string
  /** 课程键，格式 `${trackId}/${lessonId}` */
  lessons: string[]
  /** 整段等于某个 L0–L4 阶段时填上，段标题会链到阶段页 */
  trackId?: string
}

export interface Role {
  id: string
  title: string
  /** 同一岗位的其它常见叫法，展示成一行 */
  alias: string
  /** 这个岗位真正的诉求，一句话 */
  tagline: string
  /** 这条线怎么裁的 */
  desc: string
  /** 走完能做什么 */
  outcomes: string[]
  /** catalog：按 L0–L4 阶段通读；默认按裁剪过的分段清单 */
  layout?: 'catalog'
  stages: RoleStage[]
}

export const roles: Role[] = [
  {
    id: 'architect',
    title: '解决方案架构师',
    alias: '方案工程师 · 售前技术',
    tagline: '客户要的是一份算得清、也报得出价的方案',
    desc: '你不必亲手换过一块盘，但方案里每个数字都得站得住：可用容量、带宽、故障域、两年后的运维成本。这条线把部署和深度排障压到最少，重点放在语义、算账与选型。',
    outcomes: [
      '把「要 1PB 高性能存储」追问成一份能落地的参数表',
      '从裸盘配置算出可用容量与带宽上限，并说出第一个瓶颈在哪',
      '在 Ceph、GPFS 与商业存储之间讲清各自的代价，而不是只报品牌',
    ],
    stages: [
      {
        title: '术语与语义',
        hint: '方案里每写一个词，都得知道它换成钱和风险是多少',
        lessons: [
          'l1-fundamentals/three-types',
          'l1-fundamentals/protocols',
          'l1-fundamentals/redundancy',
          'l1-fundamentals/hardware',
        ],
      },
      {
        title: '把需求写成容量与带宽',
        hint: '这条线的主课，两个计算器都在这一段',
        lessons: [
          'l0-systems/disk-io',
          'l3-planning/requirements',
          'l3-planning/capacity-calc',
          'l3-planning/perf-estimate',
        ],
      },
      {
        title: '选型与产品版图',
        hint: '知道市面上有什么、各自强在哪，才谈得上「为什么选它」',
        lessons: [
          'l3-planning/solution-compare',
          'l4-advanced/commercial',
          'l2-ceph/architecture',
          'l4-advanced/gpfs-concept',
          'l4-advanced/k8s-storage',
        ],
      },
      {
        title: '方案绕不开的配套',
        hint: '签字之前先知道交付以后会踩什么坑',
        lessons: ['l1-fundamentals/consistency', 'l2-ceph/day2'],
      },
    ],
  },
  {
    id: 'cluster-ops',
    title: '集群运维工程师',
    alias: '服务工程师 · GPU 集群 · K8s 平台',
    tagline: '存储不是你的产品，但故障总是先落到你头上',
    desc: '你管的是计算节点、GPU 集群和 K8s 平台，存储是一个依赖。这条线只学接入与排障用得上的那部分后端原理，不碰集群部署与深度调优。',
    outcomes: [
      '用 USE 方法十分钟内判断慢在应用、本地盘、网络还是后端存储',
      '把 Ceph 或 GPFS 通过 CSI 接进 K8s，并跑通快照与扩容',
      '面对「训练任务卡住」「ls 半分钟不返回」拿得出证据定位到元数据层',
    ],
    stages: [
      {
        title: '系统观测地基',
        hint: '先能读懂机器在说什么，再谈是不是存储的问题',
        lessons: [
          'l0-systems/use-method',
          'l0-systems/disk-io',
          'l0-systems/network',
          'l0-systems/cpu-memory',
          'l0-systems/filesystem',
          'l0-systems/toolbox',
        ],
      },
      {
        title: '把存储接进计算集群',
        hint: '从访问语义到 CSI 落地，一个 PVC 背后到底发生了什么',
        lessons: [
          'l1-fundamentals/three-types',
          'l1-fundamentals/protocols',
          'l4-advanced/k8s-storage',
          'l4-advanced/csi-practice',
          'l2-ceph/deploy-rook',
        ],
      },
      {
        title: '够用的后端心智模型',
        hint: '不必会部署，但要知道请求进了后端走哪几步',
        lessons: ['l2-ceph/architecture', 'l4-advanced/gpfs-concept'],
      },
      {
        title: '客户端侧的排障闯关',
        hint: '两关都是从计算侧先看到现象，再往后端追',
        lessons: ['l2-ceph/quest-mds', 'l2-ceph/quest-rgw'],
      },
      {
        title: '值班与协作',
        hint: '把排查过程固化成 SOP，容量水位提前两周看出来',
        lessons: ['l4-advanced/observability', 'l4-advanced/oncall'],
      },
    ],
  },
  {
    id: 'storage-ops',
    title: '存储运维工程师',
    alias: '存储 SRE · 完整主线 · 按阶段通读',
    tagline: '集群是你的产品，L0 到 L4 一节不落',
    desc: '站点原来的那条主线，不做裁剪：先打系统基础，再吃透 Ceph 的块 / 文件 / 对象三种形态，接着学会算账，最后走进 GPFS ECE、K8s CSI 与商业存储。',
    outcomes: [
      '看懂 iostat 每一列，用 USE 方法把「系统慢」收敛到具体资源',
      '独立部署并运维 Ceph 三种存储，扛住 HEALTH_WARN 到 MON 全挂的场面',
      '把业务需求翻译成机器配置，再走进企业级高性能存储的战场',
    ],
    layout: 'catalog',
    stages: tracks.map((track) => ({
      trackId: track.id,
      title: `${track.level} ${track.title}`,
      hint: track.goal,
      lessons: track.lessons.map((lesson) => lessonKey(track.id, lesson.id)),
    })),
  },
]

/* ---------- 派生查询 ---------- */

export interface PathItem {
  key: string
  track: Track
  lesson: Lesson
  /** 在整条路线里的序号，1 起 */
  index: number
}

export interface PathStage {
  stage: RoleStage
  items: PathItem[]
  minutes: number
}

export interface RolePath {
  role: Role
  stages: PathStage[]
  items: PathItem[]
  lessonCount: number
  minutes: number
}

export function getRole(roleId: string | undefined): Role | undefined {
  return roles.find((role) => role.id === roleId)
}

/** 把一条路线的课程键解析成课程对象，并按路线顺序编号 */
export function rolePath(roleId: string | undefined): RolePath | undefined {
  const role = getRole(roleId)
  if (!role) return undefined

  let index = 0
  const stages = role.stages.map((stage) => {
    const items = stage.lessons.flatMap<PathItem>((key) => {
      const [trackId, lessonId] = key.split('/')
      const found = trackId && lessonId ? getLesson(trackId, lessonId) : undefined
      if (!found) {
        // 键写错时丢掉这一条，不让整个首页崩掉
        if (import.meta.env.DEV) console.warn(`[roles] 课程键无效：${key}`)
        return []
      }
      index += 1
      return [{ key, track: found.track, lesson: found.lesson, index }]
    })
    return {
      stage,
      items,
      minutes: items.reduce((sum, item) => sum + item.lesson.minutes, 0),
    }
  })

  const items = stages.flatMap((stage) => stage.items)
  return {
    role,
    stages,
    items,
    lessonCount: items.length,
    minutes: items.reduce((sum, item) => sum + item.lesson.minutes, 0),
  }
}

/** 课程页的路线模式：这节课在这条路线的第几节、属于哪一段、前后是哪两节 */
export function roleNav(roleId: string | undefined, key: string) {
  const path = rolePath(roleId)
  if (!path) return undefined

  const at = path.items.findIndex((item) => item.key === key)
  if (at === -1) return { path, current: undefined, stage: undefined, prev: undefined, next: undefined }

  return {
    path,
    current: path.items[at],
    stage: path.stages.find((stage) => stage.items.some((item) => item.key === key))?.stage,
    prev: at > 0 ? path.items[at - 1] : undefined,
    next: at < path.items.length - 1 ? path.items[at + 1] : undefined,
  }
}
