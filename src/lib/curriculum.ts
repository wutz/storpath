/**
 * 课程大纲 —— 全站唯一数据源。
 * 技能树、阶段页、课程页、实验索引、进度统计都从这里派生。
 *
 * status: 'ready'   已有正文（src/content/<trackId>/<lessonId>.mdx）
 *         'planned' 仅有大纲，课程页会渲染大纲占位
 */

export type LessonKind = 'concept' | 'lab' | 'quest' | 'planner'
export type LessonStatus = 'ready' | 'planned'

export interface LessonRef {
  label: string
  /** 外部链接；本地仓库路径留空，按代码样式展示 */
  href?: string
  path?: string
}

export interface Lesson {
  id: string
  title: string
  summary: string
  kind: LessonKind
  status: LessonStatus
  /** 预计学习时长（分钟） */
  minutes: number
  /** 学完能做什么 */
  objectives: string[]
  /** 小节大纲 */
  outline: string[]
  refs?: LessonRef[]
}

export interface Track {
  id: string
  level: string
  title: string
  subtitle: string
  goal: string
  lessons: Lesson[]
}

export const KIND_LABEL: Record<LessonKind, string> = {
  concept: '原理',
  lab: '实验',
  quest: '闯关',
  planner: '规划',
}

/*
 * 阶段（L0–L4）不再各配一种颜色 —— 五条彩虹加品牌色，颜色就没意义了。
 * 阶段身份交给等宽的 L0…L4 代号本身，颜色预算留给品牌色和下面三个状态徽标。
 */
export const LEVEL_CHIP =
  'rounded-xs bg-soft-2 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-body'

export const KIND_STYLE: Record<LessonKind, string> = {
  concept: 'bg-soft-2 text-body',
  lab: 'bg-info-soft text-info-deep',
  quest: 'bg-warn-soft text-warn-deep',
  planner: 'bg-plum-soft text-plum-deep',
}

const REF_SYSPERF: LessonRef = { label: 'Systems Performance, 2nd Edition — Brendan Gregg' }
const REF_STORPLAN: LessonRef = { label: 'Storplan 容量与性能规划', href: 'https://storplan.wutz.dev/' }
const repo = (path: string): LessonRef => ({ label: 'k8s-in-action', path })

export const tracks: Track[] = [
  {
    id: 'l0-systems',
    level: 'L0',
    title: '系统基础',
    subtitle: 'Linux 性能与观测',
    goal: '存储工程师的地基。看得懂 iostat 的每一列，能用 USE 方法在十分钟内把问题定位到 CPU、内存、磁盘还是网络。',
    lessons: [
      {
        id: 'use-method',
        title: '性能分析的第一课：USE 方法',
        summary: '面对"系统慢"这种模糊报障，用一套固定套路把范围收敛到具体资源。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '说清延迟、吞吐、IOPS、饱和度四个指标各自回答什么问题',
          '对任一资源列出它的 Utilization / Saturation / Errors 观测命令',
          '拿到一台陌生机器时，按 60 秒清单跑完一轮体检',
        ],
        outline: [
          '为什么"平均值"会骗人：延迟分布与长尾',
          'USE 方法：资源清单 × 三个指标',
          '60 秒性能体检清单',
          '把方法套到存储节点上',
        ],
        refs: [REF_SYSPERF, repo('os/os.md')],
      },
      {
        id: 'cpu-memory',
        title: 'CPU 与内存：存储节点的隐形瓶颈',
        summary: 'OSD 进程吃满 CPU、NUMA 跨节点访问、page cache 被挤掉，都会表现成"磁盘慢"。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '读懂 run queue、上下文切换、软中断对存储进程的影响',
          '判断一台存储节点是否存在 NUMA 亲和性问题',
          '解释 page cache、dirty page 回写与 fsync 的关系',
        ],
        outline: [
          'CPU 调度与 run queue：vmstat / mpstat 读法',
          '软中断与网卡多队列：存储节点的 si 高是什么信号',
          'NUMA 拓扑、内存带宽与 numactl 绑核',
          'page cache、dirty ratio 与回写风暴',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'disk-io',
        title: '磁盘 I/O：IOPS、吞吐与延迟的三角关系',
        summary: '为什么队列深度一加大 IOPS 就上去、延迟也跟着上去？这节课把 iostat 每一列讲透。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '推导 IOPS × 块大小 = 吞吐，并解释它何时不成立',
          '逐列读懂 iostat -x 输出，判断磁盘是否饱和',
          '区分 HDD / SATA SSD / NVMe 的性能量级与适用场景',
        ],
        outline: [
          '一次 I/O 的生命周期：应用 → VFS → 块层 → 驱动 → 设备',
          'IOPS、吞吐、延迟、队列深度四者的关系',
          'iostat -x 逐列精读',
          '排队论直觉：利用率逼近 100% 时延迟为何爆炸',
          '介质量级对照：HDD / SATA SSD / NVMe',
        ],
        refs: [REF_SYSPERF, repo('k8s/etcd-disk-performance.md')],
      },
      {
        id: 'filesystem',
        title: '文件系统：从 VFS 到 XFS 挂载参数',
        summary: '存储服务底下压着的还是本地文件系统，它的行为直接决定上层表现。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释 VFS、inode、dentry cache 在读写路径中的位置',
          '说明日志（journal）如何影响写放大',
          '为存储节点选择合理的 XFS/ext4 挂载参数',
        ],
        outline: [
          'VFS 抽象与页缓存',
          'inode / dentry / extent：元数据开销从哪来',
          '日志文件系统与写放大',
          'XFS vs ext4：格式化与挂载参数实操',
          '小文件问题：为什么元数据比数据更难扛',
        ],
        refs: [REF_SYSPERF],
      },
      {
        id: 'network',
        title: '网络：存储集群的第二块硬盘',
        summary: '分布式存储把网络放进了 I/O 路径，网络抖动会直接变成写延迟。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '估算给定带宽下集群副本写入的理论上限',
          '解释 public network 与 cluster network 分离的收益',
          '认识 MTU、bonding、RDMA/RoCE 在存储场景的取舍',
        ],
        outline: [
          'TCP 吞吐、RTT 与带宽时延积',
          '前后端网络分离：Ceph public/cluster 网的由来',
          'MTU 9000 与 bonding 模式选择',
          'RDMA / RoCE 入门与无损网络要求',
          '网络排障：ss、ethtool、丢包与重传',
        ],
        refs: [REF_SYSPERF, repo('network/')],
      },
      {
        id: 'toolbox',
        title: '观测与压测工具箱',
        summary: '把 iostat/vmstat/perf/bpftrace 和 elbencho 串成一套可复用的手法。',
        kind: 'lab',
        status: 'ready',
        minutes: 45,
        objectives: [
          '用 elbencho 设计出能回答具体问题的测试用例，而不是跑个分',
          '用 elbencho service 模式对共享文件系统做多客户端压测',
          '读懂 first done / last done 两列，从差距里看出不均衡',
          '用 bpftrace 抓出单次慢 I/O 的调用栈',
        ],
        outline: [
          '静态工具 vs 动态追踪：各自的代价',
          'elbencho 四件套：随机/顺序 × 读/写，以及 -t 与 --iodepth',
          'elbencho service 模式多客户端压测共享文件系统',
          '结果解读：first done vs last done，差距过大的排查路径',
          'bpftrace 一行流：biolatency、biosnoop',
          '压测报告怎么写才有说服力',
        ],
        refs: [REF_SYSPERF, repo('storage/elbencho/')],
      },
    ],
  },

  {
    id: 'l1-fundamentals',
    level: 'L1',
    title: '存储原理',
    subtitle: '块 / 文件 / 对象与冗余机制',
    goal: '建立分布式存储的通用心智模型：数据怎么切、怎么冗余、故障时怎么恢复，换任何一款产品都通用。',
    lessons: [
      {
        id: 'three-types',
        title: '块、文件、对象：三种存储语义',
        summary: '不是三种产品，是三种访问语义。选错语义，后面怎么调优都别扭。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '用一句话说清三种存储各自暴露给应用的是什么',
          '给定业务场景，判断应该用块、文件还是对象',
          '解释为什么对象存储天然易扩展而文件存储难',
        ],
        outline: [
          '块存储：一块裸盘，语义最少，性能最高',
          '文件存储：目录树与 POSIX 语义，元数据是代价',
          '对象存储：扁平命名空间与 HTTP 语义',
          '协议地图：iSCSI / NVMe-oF、NFS / SMB、S3',
          '选型练习：数据库、AI 训练、备份归档',
        ],
        refs: [repo('storage/README.md'), REF_STORPLAN],
      },
      {
        id: 'redundancy',
        title: '副本还是纠删码：冗余机制的取舍',
        summary: '三副本浪费 67% 空间，EC 省空间但重建时能把集群拖垮。这节课算清这笔账。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '计算任意副本数 / EC 方案的空间效率与故障容忍度',
          '解释 EC 的读放大、写放大与重建代价',
          '给出"什么场景用副本、什么场景用 EC"的判断依据',
        ],
        outline: [
          'RAID 回顾：条带、镜像、校验',
          'N 副本：效率、容忍度与恢复带宽',
          '纠删码 k+m：空间效率公式与容忍度',
          '写放大与小 I/O 惩罚：EC 为什么怕小文件',
          '重建风暴与故障域设计',
        ],
        refs: [REF_STORPLAN, repo('storage/gpfs/day-0-plan-ece.md')],
      },
      {
        id: 'consistency',
        title: '一致性、故障域与可用性',
        summary: 'CAP 不是屠龙术，它每天都在决定你的集群在断电时丢不丢数据。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '区分强一致、最终一致在运维上的可观察差异',
          '按机架/电源/交换机划分故障域',
          '解释 quorum 与脑裂，并说明为什么监控节点要奇数个',
        ],
        outline: [
          '强一致 vs 最终一致：客户端看到什么',
          'quorum、脑裂与奇数节点',
          '故障域层级：OSD / 主机 / 机架 / 机房',
          '可用性预算：MTBF、MTTR 与 SLA',
        ],
      },
      {
        id: 'hardware',
        title: '硬件基础：从 NAND 到整机选型',
        summary: '写放大、寿命、掉电保护，这些盘的特性会一路传导到集群指标上。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '解释 SSD 写放大、GC、TRIM 与稳态性能',
          '看懂 DWPD、TBW 并据此估算盘的寿命',
          '为存储节点搭配合理的 CPU / 内存 / 盘位 / 网卡',
        ],
        outline: [
          'NAND、FTL、GC 与写放大',
          'DWPD / TBW 与寿命估算',
          '掉电保护（PLP）为什么对存储服务是硬要求',
          '整机配比：每 OSD 多少核多少内存',
          'HBA / RAID 卡直通模式',
        ],
        refs: [REF_STORPLAN],
      },
      {
        id: 'protocols',
        title: '存储协议与接入方式',
        summary: 'iSCSI、NFS、S3、NVMe-oF 各自的开销与坑，接入前先知道。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '为给定业务选择接入协议并说明理由',
          '排查 NFS 挂载卡死、S3 签名失败一类常见故障',
          '理解多路径与客户端侧缓存的影响',
        ],
        outline: [
          'iSCSI 与多路径（multipath）',
          'NFSv3 vs NFSv4：锁与状态',
          'S3 API 与签名、分段上传',
          'NVMe-oF：RDMA 与 TCP 两种传输',
        ],
        refs: [repo('storage/nfs-csi/'), repo('storage/vast/nfs/')],
      },
    ],
  },

  {
    id: 'l2-ceph',
    level: 'L2',
    title: 'Ceph 主战场',
    subtitle: '一套集群，三种存储',
    goal: '这是分布式存储运维的核心战场。从架构原理到部署、日常运维、故障排查，形成完整闭环。',
    lessons: [
      {
        id: 'architecture',
        title: 'Ceph 架构总览：RADOS 与四类守护进程',
        summary: 'MON、OSD、MGR、MDS 各管什么，一次写入在集群里走过哪些环节。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '画出 Ceph 的分层架构并说明每层职责',
          '说清一次 RBD 写入从客户端到落盘的完整路径',
          '解释为什么 MON 要奇数个、MGR 要两个',
        ],
        outline: [
          'RADOS：一切的底座',
          'MON：集群地图与 quorum',
          'OSD：数据落盘与心跳',
          'MGR：管理面与 Dashboard',
          'MDS：CephFS 的元数据服务',
          '上层三张脸：RBD / CephFS / RGW',
          '一次写入的完整路径',
        ],
        refs: [
          repo('storage/cephadm/README.md'),
          { label: 'IBM Redbook: Ceph 概念与架构', href: 'https://www.redbooks.ibm.com/abstracts/redp5721.html' },
        ],
      },
      {
        id: 'crush-pg',
        title: 'CRUSH 与 PG：数据到底落在哪块盘上',
        summary: '没有中心元数据服务，客户端却能算出数据在哪 —— CRUSH 是 Ceph 最漂亮的设计。',
        kind: 'concept',
        status: 'ready',
        minutes: 40,
        objectives: [
          '手工推演 object → PG → OSD 的映射过程',
          '为集群估算合理的 PG 数量',
          '读懂 CRUSH map 与 rule，按机架划分故障域',
        ],
        outline: [
          '为什么不用元数据表：CRUSH 的动机',
          'object → PG：哈希取模',
          'PG → OSD：CRUSH 算法与 map',
          'PG 数量怎么定，pg_autoscaler 做了什么',
          'PG 状态机：active+clean 之外的那些状态',
          'CRUSH rule 实操：按机架分布副本',
        ],
        refs: [repo('storage/cephadm/2-ceph-rados.md')],
      },
      {
        id: 'deploy-cephadm',
        title: '实验：用 cephadm 从零部署一套集群',
        summary: '三节点起步，走完 bootstrap、加主机、加 OSD、看健康状态的全流程。',
        kind: 'lab',
        status: 'ready',
        minutes: 60,
        objectives: [
          '独立完成一套三节点 Ceph 集群部署',
          '排查 OSD 起不来的常见原因',
          '看懂 ceph -s 输出的每一段',
        ],
        outline: [
          '环境准备：主机名、时间同步、免密、容器运行时',
          'cephadm bootstrap 第一个 MON',
          '添加主机与标签',
          '添加 OSD：整盘、指定设备、按规格',
          '验证：ceph -s / ceph osd tree / ceph health detail',
          '常见翻车点',
        ],
        refs: [repo('storage/cephadm/1-deploy-ceph-cluster.md')],
      },
      {
        id: 'deploy-rook',
        title: '实验：Rook 在 K8s 里跑 Ceph',
        summary: '存储与计算同集群的另一条路线，Operator 帮你做了什么、藏了什么。',
        kind: 'lab',
        status: 'ready',
        minutes: 60,
        objectives: [
          '用 Rook Operator 部署一套 CephCluster',
          '用 kubectl rook-ceph 执行日常运维命令',
          '判断什么场景该选 Rook、什么场景该选 cephadm',
        ],
        outline: [
          'Operator 模式与 CephCluster CRD',
          '节点打标与存储节点选择',
          'public / cluster 双网配置',
          'toolbox 与 kubectl-rook-ceph 插件',
          'OSD prepare 失败的排查路径',
        ],
        refs: [repo('storage/rook/README.md'), repo('storage/rook/day-2.md')],
      },
      {
        id: 'rbd',
        title: 'RBD 块存储：从 pool 到挂载',
        summary: '创建 pool、开 image、映射到主机，再把它接到 K8s 里。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '创建 RBD pool 与 image 并挂载使用',
          '配置 ceph-csi-rbd 让 K8s 动态供卷',
          '理解 image 特性、快照与克隆',
        ],
        outline: [
          'pool 创建与副本/EC 选择',
          'rbd create / map / mkfs 全流程',
          'image features 与内核客户端兼容性',
          '快照、克隆与回滚',
          'ceph-csi-rbd 接入 K8s',
        ],
        refs: [repo('storage/cephadm/4-deploy-rbd.md'), repo('storage/ceph-csi-rbd/')],
      },
      {
        id: 'cephfs',
        title: 'CephFS 文件存储：MDS 与元数据',
        summary: '共享文件系统的甜与苦，元数据缓存是它的命门。',
        kind: 'lab',
        status: 'ready',
        minutes: 45,
        objectives: [
          '部署 CephFS 并用内核客户端挂载',
          '解释 MDS 缓存、cap 与客户端阻塞的关系',
          '配置多活 MDS 与目录分片',
        ],
        outline: [
          '创建 data pool / metadata pool 与 fs',
          'MDS 部署与多活配置',
          '内核客户端 vs FUSE 客户端',
          '子目录挂载与配额',
          'MDS 缓存压力与 slow request 排查',
          'ceph-csi-cephfs 接入 K8s',
        ],
        refs: [repo('storage/cephadm/3-deploy-cephfs.md'), repo('storage/ceph-csi-cephfs/')],
      },
      {
        id: 'rgw',
        title: 'RGW 对象存储：S3 网关',
        summary: '把 RADOS 包装成 S3，用户、bucket、配额与多站点。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '部署 RGW 并创建用户、bucket',
          '用 s3cmd / awscli 完成读写验证',
          '为 RGW 配置监控指标',
        ],
        outline: [
          'RGW 部署与负载均衡',
          '用户、密钥与 bucket 策略',
          'index pool 与海量对象数的坑',
          '生命周期与分段上传',
          'RGW 指标采集',
        ],
        refs: [repo('storage/cephadm/5-deploy-rgw.md'), repo('storage/rook/rgw/README.md')],
      },
      {
        id: 'day2',
        title: 'Day-2 运维：扩容、换盘、升级',
        summary: '集群跑起来只是开始，接下来两年都是这些活。',
        kind: 'lab',
        status: 'ready',
        minutes: 50,
        objectives: [
          '安全地加盘、下线盘并控制数据迁移速度',
          '滚动升级集群且不中断业务',
          '处理 near full、slow ops 一类日常告警',
        ],
        outline: [
          '加 OSD 与数据回填限速',
          '优雅下线：reweight、out、purge 的顺序',
          '坏盘更换标准流程',
          '滚动升级与版本兼容',
          'noout / norebalance 等运维开关',
          '容量水位管理：near full 与 full ratio',
        ],
        refs: [repo('storage/cephadm/day-2.md'), repo('storage/rook/day-2.md')],
      },
      {
        id: 'troubleshoot-quest',
        title: '闯关：HEALTH_WARN 从哪儿看起',
        summary: '在模拟终端里接手一套告警集群，一步步定位到根因。',
        kind: 'quest',
        status: 'ready',
        minutes: 45,
        objectives: [
          '形成"先看全局再看局部"的排查顺序',
          '把 ceph health detail 的告警映射到具体动作',
          '独立完成一次从告警到根因的闭环',
        ],
        outline: [
          '第一关：集群健康度总览',
          '第二关：定位问题 OSD',
          '第三关：确认根因并给出处置方案',
        ],
        refs: [repo('storage/cephadm/7-faq.md'), repo('storage/rook/README.md')],
      },
      {
        id: 'quest-mon',
        title: '闯关：集群完全不可用，MON 出了什么事',
        summary: 'ceph 命令直接卡住不返回。这一关练的是「管理面挂了怎么办」。',
        kind: 'quest',
        status: 'ready',
        minutes: 40,
        objectives: [
          '在 ceph 命令不可用时仍能定位问题',
          '判断 MON 是进程问题、时间问题还是磁盘问题',
          '按正确顺序恢复 quorum 而不损坏集群状态',
        ],
        outline: [
          '第一关：ceph 命令卡死时从哪入手',
          '第二关：定位失联的 MON',
          '第三关：找到 mon_data 写满的根因',
        ],
        refs: [repo('storage/cephadm/7-faq.md')],
      },
      {
        id: 'quest-mds',
        title: '闯关：CephFS 突然卡住，客户端全在等',
        summary: '带宽正常、OSD 全绿，但 ls 一个目录要等半分钟。问题在元数据层。',
        kind: 'quest',
        status: 'ready',
        minutes: 40,
        objectives: [
          '区分数据面故障与元数据面故障',
          '读懂 MDS 的 slow request 与 cap 相关告警',
          '定位到具体是哪个客户端在制造压力',
        ],
        outline: [
          '第一关：确认不是数据面的问题',
          '第二关：读 MDS 的告警与缓存指标',
          '第三关：揪出行为异常的客户端',
        ],
        refs: [repo('storage/cephadm/3-deploy-cephfs.md')],
      },
      {
        id: 'quest-rgw',
        title: '闯关：对象存储 5xx 激增',
        summary: '监控报 RGW 错误率飙升，但 Ceph 集群显示 HEALTH_OK。',
        kind: 'quest',
        status: 'ready',
        minutes: 40,
        objectives: [
          '在集群健康的情况下定位网关层故障',
          '把 RGW 的报错映射到 index 池与分片问题',
          '给出既能救急又能治本的处置方案',
        ],
        outline: [
          '第一关：确认故障范围与错误类型',
          '第二关：定位到具体 bucket',
          '第三关：确认 index 分片不足的根因',
        ],
        refs: [repo('storage/cephadm/5-deploy-rgw.md'), repo('storage/rook/rgw/README.md')],
      },
      {
        id: 'tuning',
        title: 'Ceph 性能调优与压测',
        summary: '先量再调。没有基线的调优都是玄学。',
        kind: 'lab',
        status: 'ready',
        minutes: 50,
        objectives: [
          '为集群建立性能基线',
          '定位瓶颈在客户端、网络还是 OSD',
          '掌握几个高收益的调优参数及其风险',
        ],
        outline: [
          '基线怎么打：rados bench、elbencho',
          '客户端并发与队列深度',
          'OSD 侧：BlueStore、WAL/DB 分离、内存目标',
          '网络侧：MTU、双网、带宽饱和判断',
          '调优的记录与回滚纪律',
        ],
        refs: [repo('storage/elbencho/'), repo('storage/cephadm/8-metrics.md')],
      },
    ],
  },

  {
    id: 'l3-planning',
    level: 'L3',
    title: '容量与性能规划',
    subtitle: '从需求到方案',
    goal: '把业务需求翻译成机器数量、盘型号和网络配置 —— 这是运维工程师开始有话语权的地方。',
    lessons: [
      {
        id: 'requirements',
        title: '需求拆解：容量、带宽、IOPS 三条线',
        summary: '客户说"要 1PB 高性能存储"，这句话里缺了至少五个关键参数。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '列出一份完整的存储需求调研清单',
          '把业务语言翻译成可计算的指标',
          '识别需求中互相冲突的部分并给出取舍建议',
        ],
        outline: [
          '容量：裸容量、可用容量、预留水位',
          '性能：峰值还是均值，读写比例，块大小',
          '可用性与恢复目标',
          '增长预测与扩容节奏',
          '需求调研清单模板',
        ],
        refs: [REF_STORPLAN],
      },
      {
        id: 'capacity-calc',
        title: '算一遍：Ceph 集群容量规划',
        summary: '给定裸盘配置，算出真正能用的容量 —— 交互计算器边调边看。',
        kind: 'planner',
        status: 'ready',
        minutes: 35,
        objectives: [
          '独立完成一次从裸容量到可用容量的推算',
          '解释 TB 与 TiB、水位线、冗余开销各吃掉多少',
          '判断给定节点数下哪些 EC 方案可选',
        ],
        outline: [
          '厂商 TB 与系统 TiB 的换算陷阱',
          '冗余开销：副本与 EC',
          '满水位与再平衡预留',
          '交互计算器：改参数看结果',
          '把结果写成一份配置建议',
        ],
        refs: [REF_STORPLAN, repo('storage/gpfs/day-0-plan-ece.md')],
      },
      {
        id: 'perf-estimate',
        title: '性能估算与瓶颈定位',
        summary: '在采购之前就算出这套配置能跑多快，以及第一个瓶颈会出现在哪。',
        kind: 'planner',
        status: 'ready',
        minutes: 35,
        objectives: [
          '按盘、网络、CPU 三条线分别估算上限',
          '找出配置中的短板资源',
          '解释副本/EC 对写带宽的放大效应',
        ],
        outline: [
          '单盘能力 × 盘数 = 理论上限（以及为什么达不到）',
          '网络上限与副本写放大',
          'CPU 与内存对 OSD 数量的约束',
          '木桶效应：找出第一个饱和的资源',
        ],
        refs: [REF_STORPLAN],
      },
      {
        id: 'solution-compare',
        title: '方案对比：什么时候不该用 Ceph',
        summary: '开源不等于便宜。把授权费、运维成本、技术支持一起算进去。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '按场景对比 Ceph / GPFS ECE / Weka / VastData / XSKY',
          '说明 CephFS 不建议用于 AI 训练场景的原因',
          '产出一份带取舍理由的选型建议',
        ],
        outline: [
          '高性能文件系统横评',
          '对象存储横评',
          '块存储横评',
          'TCO：授权费 vs 运维人力',
          '结合 Storplan 做一次完整选型',
        ],
        refs: [REF_STORPLAN],
      },
    ],
  },

  {
    id: 'l4-advanced',
    level: 'L4',
    title: '进阶方向',
    subtitle: 'GPFS ECE、K8s 与商业存储',
    goal: '走出 Ceph 的舒适区。企业级高性能场景里，GPFS、Weka、VastData 和 K8s CSI 才是常态。',
    lessons: [
      {
        id: 'gpfs-concept',
        title: 'GPFS / Storage Scale 概念与 ECE 架构',
        summary: 'NSD、文件系统、集群角色 —— 换一套术语体系，但底层问题还是那些。',
        kind: 'concept',
        status: 'ready',
        minutes: 40,
        objectives: [
          '说清 NSD、failure group、filesystem、cluster 的关系',
          '解释 ECE 与传统 ESS 的差别',
          '看懂 mmlscluster / mmlsnsd / mmlsfs 输出',
        ],
        outline: [
          'GPFS 术语地图',
          'NSD 与 failure group',
          'ECE：软件定义的纠删码',
          'owning cluster 与 accessing cluster（多集群挂载）',
          '常用 mm* 命令速查',
        ],
        refs: [repo('storage/gpfs/day-0-concept.md'), repo('storage/gpfs/day-0-network.md')],
      },
      {
        id: 'gpfs-deploy',
        title: '实验：GPFS ECE 部署与调优',
        summary: '从网络规划到 recovery group，把一套 ECE 集群跑起来。',
        kind: 'lab',
        status: 'ready',
        minutes: 70,
        objectives: [
          '完成 ECE 集群的规划与部署',
          '创建 recovery group、vdisk 与文件系统',
          '应用关键调优参数并验证效果',
        ],
        outline: [
          'ECE 容量与节点规划',
          '网络规划：数据网与管理网',
          '部署 ECE 与创建 recovery group',
          'vdisk set 与文件系统创建',
          '调优：pagepool、maxMBpS、workerThreads',
        ],
        refs: [
          repo('storage/gpfs/day-0-plan-ece.md'),
          repo('storage/gpfs/day-1-deploy-ece.md'),
          repo('storage/gpfs/day-1-tunning.md'),
        ],
      },
      {
        id: 'gpfs-day2',
        title: 'GPFS Day-2：多租户、快照与扩容',
        summary: 'fileset、配额、CES 导出、集群扩容，企业环境的日常。',
        kind: 'lab',
        status: 'ready',
        minutes: 50,
        objectives: [
          '用 fileset 与配额做多租户隔离',
          '配置快照策略并完成一次恢复',
          '在线扩容集群与文件系统',
        ],
        outline: [
          'fileset 与配额管理',
          'CES：NFS / SMB 导出',
          '快照创建、调度与恢复',
          '扩容节点与磁盘再平衡',
          '审计日志与常见故障',
        ],
        refs: [
          repo('storage/gpfs/day-2-multi-tenant.md'),
          repo('storage/gpfs/day-2-snapshot.md'),
          repo('storage/gpfs/day-2-scaling-cluster.md'),
        ],
      },
      {
        id: 'k8s-storage',
        title: 'K8s 存储模型：PV、PVC、SC 与 CSI',
        summary: '容器时代的存储接口层，运维和开发在这里分工。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '说清 PV / PVC / StorageClass 三者的职责边界',
          '解释 CSI driver 的组件构成与调用链',
          '排查 PVC 一直 Pending 的常见原因',
        ],
        outline: [
          '临时卷与持久卷',
          'PV / PVC 绑定与回收策略',
          'StorageClass 与动态供卷',
          'CSI 架构：controller、node、sidecar',
          'PVC Pending 排查清单',
        ],
        refs: [repo('storage/README.md'), repo('storage/local-storage/')],
      },
      {
        id: 'csi-practice',
        title: '实验：ceph-csi 与 gpfs-csi 接入',
        summary: '把后端存储真正接进 K8s，并跑通快照。',
        kind: 'lab',
        status: 'ready',
        minutes: 50,
        objectives: [
          '部署 ceph-csi 并创建可用的 StorageClass',
          '接入 gpfs-csi 并挂载已有文件系统',
          '配置 VolumeSnapshot 并完成一次恢复',
        ],
        outline: [
          'ceph-csi-rbd 与 ceph-csi-cephfs 部署',
          'secret、clusterID 与配置映射',
          'gpfs-csi 与 accessing cluster 配合',
          'snapshot-controller 与 VolumeSnapshotClass',
          '端到端验证：PVC → Pod → 数据 → 快照 → 恢复',
        ],
        refs: [
          repo('storage/ceph-csi-rbd/'),
          repo('storage/gpfs-csi/'),
          repo('storage/volumesnapshots/'),
          repo('storage/ceph-snapshot/'),
        ],
      },
      {
        id: 'commercial',
        title: '商业方案巡礼：Weka / VastData / XSKY',
        summary: '知道市面上有什么、各自强在哪，选型时才不会只会推 Ceph。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '说出三家方案的架构特点与典型场景',
          '识别各自的隐性成本',
          '在招标场景下提出有效的技术问题',
        ],
        outline: [
          'Weka：极致性能与授权成本',
          'VastData：DASE 架构与多协议统一',
          'XSKY XEOS：大规模对象存储',
          '3FS / JuiceFS / Longhorn 等其它路线',
          '如何评估一款没用过的存储',
        ],
        refs: [
          repo('storage/weka/'),
          repo('storage/vast/'),
          repo('storage/xsky/'),
          REF_STORPLAN,
        ],
      },
      {
        id: 'observability',
        title: '可观测性：指标、告警与容量水位',
        summary: '值班靠的不是手快，是提前两周就看到容量要满了。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '搭起存储集群的指标采集与看板',
          '设计不误报也不漏报的告警规则',
          '做容量趋势预测',
        ],
        outline: [
          '指标来源：Ceph exporter、GPFS、节点侧',
          'VictoriaMetrics / Prometheus 采集',
          'Grafana 看板设计：先看什么后看什么',
          '告警分级与静默策略',
          '容量趋势与扩容提前量',
        ],
        refs: [repo('o11y/'), repo('storage/cephadm/8-metrics.md')],
      },
      {
        id: 'oncall',
        title: '值班手册：SOP 与故障复盘',
        summary: '把前面所有知识固化成可交接的流程，这才是工程师的产出物。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '写出一份别人能照着执行的处置 SOP',
          '主持一次不追责的故障复盘',
          '建立变更前的检查清单',
        ],
        outline: [
          '常见告警的处置 SOP 模板',
          '变更管理：窗口、回滚、双人复核',
          '故障复盘：时间线、根因、改进项',
          '知识沉淀与交接',
        ],
      },
    ],
  },
]

/* ---------- 派生查询 ---------- */

export const allLessons = tracks.flatMap((track) =>
  track.lessons.map((lesson) => ({ track, lesson })),
)

export function getTrack(trackId: string): Track | undefined {
  return tracks.find((t) => t.id === trackId)
}

export function getLesson(trackId: string, lessonId: string) {
  const track = getTrack(trackId)
  if (!track) return undefined
  const index = track.lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return undefined
  return {
    track,
    lesson: track.lessons[index],
    prev: track.lessons[index - 1],
    next: track.lessons[index + 1],
  }
}

/** 全局线性顺序，用于"上一课 / 下一课"跨阶段跳转 */
export function getFlatNeighbors(trackId: string, lessonId: string) {
  const index = allLessons.findIndex(
    (item) => item.track.id === trackId && item.lesson.id === lessonId,
  )
  return {
    prev: index > 0 ? allLessons[index - 1] : undefined,
    next: index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : undefined,
  }
}

export function lessonKey(trackId: string, lessonId: string) {
  return `${trackId}/${lessonId}`
}

export const stats = {
  trackCount: tracks.length,
  lessonCount: allLessons.length,
  readyCount: allLessons.filter(({ lesson }) => lesson.status === 'ready').length,
  labCount: allLessons.filter(({ lesson }) => lesson.kind === 'lab' || lesson.kind === 'quest')
    .length,
  totalMinutes: allLessons.reduce((sum, { lesson }) => sum + lesson.minutes, 0),
}
