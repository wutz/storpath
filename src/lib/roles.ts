/**
 * 岗位路线 —— 首页目录的组织方式。
 *
 * 课程本身仍然只有一份（见 curriculum.ts 的 L0–L4 阶段），
 * 这里做的是"按岗位重新排一遍顺序"：同一节课可以出现在多条路线里，
 * 每条路线只挑这个岗位真正用得上的部分。
 *
 * 存储运维工程师那条路线不手写课程清单，直接由 L0–L4 全量阶段生成，
 * 也就是站点原来的那条主线，进度统计跟着它走。
 */
import { type Lesson, type Track, getLesson, lessonKey, tracks } from './curriculum'

export interface RoleStage {
  id: string
  title: string
  /** 这一段要解决什么问题 */
  goal: string
  /** 课程键，格式 `${trackId}/${lessonId}` */
  lessons: string[]
  /** 整段等于某个 L0–L4 阶段时填上，阶段标题会链到阶段页 */
  trackId?: string
}

export interface Role {
  id: string
  /** 岗位主名称 */
  title: string
  /** 同一岗位的其它常见叫法 */
  aliases: string[]
  /** 一句话定位 */
  tagline: string
  /** 谁该走这一条 */
  audience: string
  /** 走完能做什么 */
  outcomes: string[]
  accent: {
    text: string
    bg: string
    border: string
    ring: string
    bar: string
  }
  stages: RoleStage[]
}

/** 站点原来的主线：L0 → L4 全量，一节不落 */
const fullPathStages: RoleStage[] = tracks.map((track) => ({
  id: track.id,
  trackId: track.id,
  title: `${track.level} ${track.title}`,
  goal: track.goal,
  lessons: track.lessons.map((lesson) => lessonKey(track.id, lesson.id)),
}))

export const roles: Role[] = [
  {
    id: 'solution-architect',
    title: '解决方案架构师',
    aliases: ['方案工程师', '售前技术'],
    tagline: '算得准、讲得清、不被现场问倒。',
    audience:
      '你要面对客户需求出方案、报配置、做选型对比，不一定亲手运维集群，但每个数字都得站得住。',
    outcomes: [
      '把"要 1PB 高性能存储"追问成一份能落地的参数表',
      '从裸盘配置算出可用容量、预估带宽与 IOPS，并说出第一个瓶颈在哪',
      '讲清 Ceph / GPFS / 商业方案各自的适用边界与总成本',
    ],
    accent: {
      text: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      ring: 'ring-violet-400',
      bar: 'bg-violet-500',
    },
    stages: [
      {
        id: 'sa-semantics',
        title: '把方案里的名词说准',
        goal: '语义、冗余、协议、盘型 —— 方案里每写一个词，都要知道它换成钱和风险是多少。',
        lessons: [
          'l1-fundamentals/three-types',
          'l1-fundamentals/protocols',
          'l1-fundamentals/redundancy',
          'l1-fundamentals/hardware',
        ],
      },
      {
        id: 'sa-numbers',
        title: '把需求翻译成数字',
        goal: '这一段是方案工程师的核心手艺：需求拆解 → 容量核算 → 性能估算，全程有计算器可以边调边看。',
        lessons: [
          'l0-systems/disk-io',
          'l3-planning/requirements',
          'l3-planning/capacity-calc',
          'l3-planning/perf-estimate',
        ],
      },
      {
        id: 'sa-compare',
        title: '选型与产品版图',
        goal: '知道市面上有什么、各自强在哪，才谈得上"为什么选它"。架构与概念够用即可，不必陷进部署细节。',
        lessons: [
          'l3-planning/solution-compare',
          'l4-advanced/commercial',
          'l2-ceph/architecture',
          'l4-advanced/gpfs-concept',
          'l4-advanced/k8s-storage',
        ],
      },
      {
        id: 'sa-risk',
        title: '让方案落得住地',
        goal: '签字之前先知道交付以后会踩什么坑：断电丢不丢数据、两年里运维要干多少活。',
        lessons: ['l1-fundamentals/consistency', 'l2-ceph/day2'],
      },
    ],
  },
  {
    id: 'compute-ops',
    title: '服务工程师 / 计算集群运维',
    aliases: ['交付服务工程师', 'GPU 集群运维', 'K8s 平台运维'],
    tagline: '挂得上、跑得快，出问题能说清是谁的锅。',
    audience:
      '你管的是计算节点、GPU 集群和 K8s 平台，存储是你的依赖而不是你的产品 —— 但故障总是先落到你头上。',
    outcomes: [
      '用 USE 方法十分钟内判断慢在应用、本地盘、网络还是后端存储',
      '把后端存储通过 CSI 接进 K8s，并跑通快照与扩容',
      '面对"训练任务卡住""ls 半分钟不返回"能拿出证据定位到元数据层',
    ],
    accent: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'ring-emerald-400',
      bar: 'bg-emerald-500',
    },
    stages: [
      {
        id: 'co-observe',
        title: '系统观测地基',
        goal: '计算侧排障的全部底气都在这里：先能读懂机器在说什么，再谈是不是存储的问题。',
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
        id: 'co-attach',
        title: '把存储接进计算集群',
        goal: '从访问语义到 CSI 落地：PV / PVC / StorageClass 背后到底发生了什么。',
        lessons: [
          'l1-fundamentals/three-types',
          'l1-fundamentals/protocols',
          'l4-advanced/k8s-storage',
          'l4-advanced/csi-practice',
          'l2-ceph/deploy-rook',
        ],
      },
      {
        id: 'co-debug',
        title: '够用的后端心智模型 + 排障闯关',
        goal: '不需要会部署存储，但要知道请求进了后端走哪些环节，才能把问题递到对的人手上。',
        lessons: [
          'l2-ceph/architecture',
          'l4-advanced/gpfs-concept',
          'l2-ceph/quest-mds',
          'l2-ceph/quest-rgw',
        ],
      },
      {
        id: 'co-oncall',
        title: '值班与协作',
        goal: '把排查过程固化成 SOP，把容量水位提前两周看出来。',
        lessons: ['l4-advanced/observability', 'l4-advanced/oncall'],
      },
    ],
  },
  {
    id: 'storage-ops',
    title: '存储运维工程师',
    aliases: ['分布式存储运维', '存储 SRE'],
    tagline: '完整主线：从一条 iostat 到扛住线上集群。',
    audience: '集群是你的产品。这条是站点原来的那条主线，L0 到 L4 一节不落，全站进度统计跟着它走。',
    outcomes: [
      '看懂 iostat 每一列，用 USE 方法把"系统慢"收敛到具体资源',
      '独立部署并运维 Ceph 的块 / 文件 / 对象三种形态，扛住 HEALTH_WARN 到 MON 全挂的场面',
      '把业务需求翻译成机器配置，再走进 GPFS ECE、K8s CSI 与商业存储的进阶战场',
    ],
    accent: {
      text: 'text-brand-700',
      bg: 'bg-brand-50',
      border: 'border-brand-100',
      ring: 'ring-brand-500',
      bar: 'bg-brand-500',
    },
    stages: fullPathStages,
  },
]

/* ---------- 派生查询 ---------- */

export interface ResolvedLesson {
  key: string
  track: Track
  lesson: Lesson
}

/** 把课程键解析成课程对象；键写错时直接丢掉，不让首页整块崩掉 */
function resolve(keys: string[]): ResolvedLesson[] {
  return keys.flatMap((key) => {
    const [trackId, lessonId] = key.split('/')
    const found = trackId && lessonId ? getLesson(trackId, lessonId) : undefined
    if (!found) {
      if (import.meta.env.DEV) console.warn(`[roles] 课程键无效：${key}`)
      return []
    }
    return [{ key, track: found.track, lesson: found.lesson }]
  })
}

export interface ResolvedStage extends Omit<RoleStage, 'lessons'> {
  lessons: ResolvedLesson[]
}

export function getRole(roleId: string | undefined): Role | undefined {
  return roles.find((role) => role.id === roleId)
}

export function roleStages(role: Role): ResolvedStage[] {
  return role.stages.map((stage) => ({ ...stage, lessons: resolve(stage.lessons) }))
}

export function roleLessons(role: Role): ResolvedLesson[] {
  return resolve(role.stages.flatMap((stage) => stage.lessons))
}

export function roleStats(role: Role) {
  const lessons = roleLessons(role)
  return {
    lessonCount: lessons.length,
    minutes: lessons.reduce((sum, { lesson }) => sum + lesson.minutes, 0),
    handsOnCount: lessons.filter(
      ({ lesson }) => lesson.kind === 'lab' || lesson.kind === 'quest' || lesson.kind === 'planner',
    ).length,
  }
}

export const DEFAULT_ROLE_ID = roles[0].id
