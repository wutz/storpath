# Storpath

**分布式存储运维工程师**的在线交互式学习项目。

从 Linux 系统基础出发，吃透 Ceph 的块 / 文件 / 对象三种存储，学会把业务需求翻译成机器配置，
再走向 GPFS ECE、K8s CSI 与商业存储的进阶战场。

## 学习路径

| 阶段 | 主题 | 说明 |
| --- | --- | --- |
| **L0** | 系统基础 | USE 方法、CPU/内存、磁盘 I/O、文件系统、网络、观测与压测工具箱 |
| **L1** | 存储原理 | 块/文件/对象三种语义、副本与纠删码、一致性与故障域、硬件与协议 |
| **L2** | Ceph 主战场 | 架构、CRUSH/PG、cephadm 与 Rook 部署、RBD/CephFS/RGW、Day-2、故障闯关、调优 |
| **L3** | 容量与性能规划 | 需求拆解、容量推算、性能估算、方案对比 |
| **L4** | 进阶方向 | GPFS/ECE、K8s 存储与 CSI、商业存储、可观测性、值班手册 |

共 5 个阶段 **36 节课，全部已完成正文**，其中动手环节 18 个（12 个实验 + 4 个命令行闯关 + 2 个规划计算器），
另有 1 个嵌在课程中的终端演练（PVC Pending 排查）与 1 个 CRUSH 交互推演。

线上地址：<https://storpath.wutz.dev>

## 交互形式

- **检查点（Quiz）** —— 随堂单选/多选，选错给针对性反馈，答对写入本地进度
- **命令行闯关（Terminal）** —— 模拟终端，预置真实的 `ceph -s`、`dmesg`、`smartctl` 输出，
  按目标一步步定位根因；支持 `goals` / `hint` / `help` / 命令历史。
  共 4 关：坏盘导致的 HEALTH_WARN、MON quorum 丢失、CephFS 元数据过载、RGW 5xx 激增
- **CRUSH 推演（CrushExplorer）** —— 改对象名 / pg_num / 故障域，实时看 object → PG → OSD
  的完整计算过程；点击 OSD 标记为 down，观察 up 与 acting 分叉、PG 进入 remapped 或 undersized
- **规划计算器（Planner）** —— 两个：容量推算（TB→TiB、冗余开销、水位预留三刀账）与
  带宽估算（分别算盘 / cluster 网 / public 网的上限，自动标出瓶颈资源）
- **进度追踪** —— 存 localStorage，无账号体系，换设备不同步

## 技术栈

与 [storplan](https://storplan.wutz.dev/) 保持一致：

- **TanStack Start / Router** —— 全栈 React 框架 + 类型安全文件路由
- **MDX** —— 课程正文，可直接内嵌交互组件
- **Shiki** —— 构建期代码高亮
- **Tailwind CSS 4** —— 样式
- **Cloudflare Workers** —— 部署

## 快速开始

```bash
bun install
bun run dev        # http://localhost:3001
bun run build
bun run typecheck
bun run deploy     # 手工部署到 Cloudflare Workers
```

## 持续部署

用 **Cloudflare Workers Builds**，无需在 GitHub 里存密钥。
Dashboard → Compute (Workers) → `storpath` → Settings → Build → Connect，
授权 GitHub App 并选中 `wutz/storpath`，构建命令填 `bun run build`，部署命令填 `bunx wrangler deploy`。
之后推送到 `main` 即自动部署。

> Workers Builds 的仓库连接依赖 GitHub App 的 OAuth 授权，只能在 Dashboard 上完成，wrangler CLI 没有对应命令。

## 项目结构

```
storpath/
├── src/
│   ├── lib/
│   │   ├── curriculum.ts       # 课程大纲：全站唯一数据源
│   │   ├── content.ts          # MDX 正文加载
│   │   ├── progress.ts         # 学习进度（localStorage）
│   │   ├── ceph-capacity.ts    # Ceph 容量推算
│   │   ├── ceph-perf.ts        # Ceph 带宽估算与瓶颈定位
│   │   ├── crush.ts            # CRUSH 映射的教学级模拟（确定性哈希）
│   │   └── units.ts            # TB/TiB 换算，口径与 storplan 一致
│   ├── components/
│   │   ├── Callout.tsx             # note / tip / warn / trap 四种提示框
│   │   ├── Quiz.tsx                # 随堂检查点
│   │   ├── Terminal.tsx            # 命令行闯关模拟器
│   │   ├── CephCapacityPlanner.tsx # 容量计算器
│   │   ├── PerfEstimator.tsx       # 带宽估算与瓶颈定位
│   │   ├── CrushExplorer.tsx       # object → PG → OSD 交互推演
│   │   ├── mdx-components.tsx      # MDX 全局组件表
│   │   └── lesson-context.ts       # 当前课程 key，供交互组件写进度
│   ├── content/                # 33 节课程正文
│   │   ├── l0-systems/         # 6 节
│   │   ├── l1-fundamentals/    # 5 节
│   │   ├── l2-ceph/            # 13 节
│   │   ├── l3-planning/        # 4 节
│   │   └── l4-advanced/        # 8 节
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                    # 首页：路径总览 + 进度
│   │   ├── tracks.$trackId.tsx          # 阶段详情
│   │   ├── learn.$trackId.$lessonId.tsx # 课程页
│   │   └── labs.tsx                     # 实验与闯关索引
│   ├── router.tsx
│   └── styles.css
├── vite.config.ts
└── wrangler.toml
```

## 新增一节课

1. 在 `src/lib/curriculum.ts` 对应阶段里加一条 `Lesson`，写清 `objectives` 和 `outline`
2. 状态先留 `'planned'` —— 课程页会自动渲染大纲占位，路径图上标记为「大纲」
3. 正文写好后建 `src/content/<trackId>/<lessonId>.mdx`，把状态改成 `'ready'`

> 注意：MDX 里 JSX 属性值用双引号包裹，属性内部不要再出现半角双引号（用 `「」` 代替），
> 否则会在构建时报解析错误。

MDX 里可以直接使用交互组件，无需 import：

```mdx
<Callout type="trap" title="新人常踩的坑">
2 副本的空间效率看着诱人，但重建窗口内再坏一块盘就永久丢数据。
</Callout>

<Quiz
  id="cap-1"
  question="采购 100 块 7.68TB 的盘，3 副本，水位 0.85，可写容量约多少？"
  options={[
    { text: '约 198 TiB', correct: true },
    { text: '约 256 TiB', feedback: '忘了 TB→TiB 换算。' },
  ]}
  explain={<>768 TB → 698 TiB → ÷3 → ×0.85 ≈ 198 TiB。</>}
/>

<CephCapacityPlanner />
```

命令行闯关：给命令加 `goal` 字段即成为闯关目标，全部达成后自动记录通过。

```mdx
<Terminal
  id="ceph-health-quest"
  host="root@ceph-node1"
  commands={[
    { cmd: 'ceph -s', goal: '查看集群整体状态', hint: '第一步永远是看全局', output: `...` },
    { cmd: 'ceph osd df', output: `...` },
  ]}
/>
```

## 内容来源

- **部署与运维实操** —— [k8s-in-action](https://github.com/wutz) 的 `storage/` 手册
  （cephadm、rook、gpfs、ceph-csi、gpfs-csi、elbencho、weka、vast、xsky）
- **容量与性能规划** —— [Storplan](https://storplan.wutz.dev/)
- **系统基础** —— Brendan Gregg《Systems Performance, 2nd Edition》

## 后续可做

- PG 状态机动画
- GPFS 侧的终端演练（`mm*` 命令排障）
- 深色模式（Shiki 已按双主题编译，接一个切换即可）
- 全站搜索
