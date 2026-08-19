import { Link, createFileRoute } from '@tanstack/react-router'
import {
  KIND_LABEL,
  KIND_STYLE,
  allLessons,
  lessonKey,
  stats,
  tracks,
} from '#/lib/curriculum'
import {
  type ResolvedLesson,
  type Role,
  getRole,
  roleLessons,
  roleStages,
  roleStats,
  roles,
} from '#/lib/roles'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { role?: string } => {
    const role = typeof search.role === 'string' ? search.role : undefined
    return getRole(role) ? { role } : {}
  },
  component: Home,
})

function Home() {
  const { role: roleParam } = Route.useSearch()
  const role = getRole(roleParam) ?? roles[0]

  const progress = useProgress()
  const doneSet = new Set(progress.done)
  const isDone = ({ track, lesson }: ResolvedLesson) =>
    doneSet.has(lessonKey(track.id, lesson.id))

  const overallDone = allLessons.filter(({ track, lesson }) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-gray-200 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
        <p className="text-xs font-semibold tracking-widest text-brand-600">
          存储工程师成长路径
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          同一套存储知识，三个岗位有三种走法
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">
          方案工程师要算得准、讲得清；计算集群运维要挂得上、说得清是谁的问题；存储运维则要从{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5">iostat</code>{' '}
          一路扛到线上故障。先选一条路线，只学岗位上真正用得到的部分 —— 全部 {stats.lessonCount}{' '}
          节课都还在，随时可以越过路线直接翻完整目录。
        </p>

        {/* 手机上排成 2×2，避免最后一格单独掉一行 */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
          {[
            ['岗位路线', `${roles.length} 条`],
            ['课程', `${stats.lessonCount} 节`],
            ['实验与闯关', `${stats.labCount} 个`],
            ['课程总时长', `${Math.round(stats.totalMinutes / 60)} 小时`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 px-4 py-2.5">
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {overallDone > 0 && (
          <p className="mt-5 text-xs text-gray-500">
            全站已完成 {overallDone} / {stats.lessonCount} 节，进度在所有路线之间共享。
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-bold">你是哪一种工程师？</h2>
          <span className="text-sm text-gray-500">选一条路线，下面的目录随之变化</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {roles.map((item) => (
            <RoleCard
              key={item.id}
              role={item}
              selected={item.id === role.id}
              doneCount={roleLessons(item).filter(isDone).length}
            />
          ))}
        </div>
      </section>

      <RoleRoute role={role} isDone={isDone} />

      {role.id !== 'storage-ops' && <FullCatalog />}
    </div>
  )
}

function RoleCard({
  role,
  selected,
  doneCount,
}: {
  role: Role
  selected: boolean
  doneCount: number
}) {
  const { lessonCount, minutes } = roleStats(role)
  const percent = Math.round((doneCount / lessonCount) * 100)

  return (
    <Link
      to="/"
      search={{ role: role.id }}
      hash="route"
      className={`flex flex-col rounded-2xl border bg-white px-5 py-4 shadow-sm transition ${
        selected
          ? `${role.accent.border} ring-2 ${role.accent.ring}`
          : 'border-gray-200 hover:border-gray-300 hover:shadow'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-bold ${selected ? role.accent.text : 'text-gray-900'}`}>
          {role.title}
        </h3>
        {selected && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${role.accent.bg} ${role.accent.text}`}>
            当前
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">{role.aliases.join(' · ')}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{role.tagline}</p>

      <div className="mt-3 text-xs text-gray-500">
        {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时
        {doneCount > 0 && ` · 已完成 ${doneCount}`}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${role.accent.bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </Link>
  )
}

function RoleRoute({
  role,
  isDone,
}: {
  role: Role
  isDone: (item: ResolvedLesson) => boolean
}) {
  const stages = roleStages(role)
  const lessons = roleLessons(role)
  const doneCount = lessons.filter(isDone).length
  const percent = Math.round((doneCount / lessons.length) * 100)

  const nextUp =
    lessons.find((item) => item.lesson.status === 'ready' && !isDone(item)) ?? lessons[0]

  return (
    <section id="route" className="space-y-5 scroll-mt-20">
      <header className={`rounded-2xl border px-5 py-5 sm:px-6 ${role.accent.border} ${role.accent.bg}`}>
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-xl font-bold">{role.title}</h2>
          <span className="text-sm text-gray-500">路线 · {role.tagline}</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700">{role.audience}</p>

        <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
          {role.outcomes.map((outcome) => (
            <li key={outcome} className="flex gap-2">
              <span className={role.accent.text}>✓</span>
              <span className="min-w-0">{outcome}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {doneCount > 0 ? '继续这条路线' : '从第一课开始'} · {nextUp.lesson.title}
          </Link>
          <div className="min-w-48 flex-1">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>本路线进度</span>
              <span>
                {doneCount} / {lessons.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className={`h-full rounded-full transition-all ${role.accent.bar}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {stages.map((stage, stageIndex) => {
        const stageDone = stage.lessons.filter(isDone).length

        return (
          <article
            key={stage.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <header className="flex flex-wrap items-start gap-4 bg-gray-50 px-5 py-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold shadow-sm ${role.accent.text}`}
              >
                {stageIndex + 1}
              </div>
              <div className="min-w-0 flex-1">
                {stage.trackId ? (
                  <Link
                    to="/tracks/$trackId"
                    params={{ trackId: stage.trackId }}
                    className="text-lg font-bold hover:underline"
                  >
                    {stage.title}
                  </Link>
                ) : (
                  <h3 className="text-lg font-bold">{stage.title}</h3>
                )}
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{stage.goal}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div className={`text-lg font-bold ${role.accent.text}`}>
                  {stageDone}/{stage.lessons.length}
                </div>
                已完成
              </div>
            </header>

            <ol className="divide-y divide-gray-100">
              {stage.lessons.map((item, index) => {
                const { track, lesson } = item
                const done = isDone(item)
                return (
                  <li key={item.key}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                          done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {done ? '✓' : `${stageIndex + 1}.${index + 1}`}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {lesson.title}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {lesson.summary}
                        </span>
                      </span>
                      {/* 跨阶段挑课的路线里，标一下这节课原本属于哪个阶段 */}
                      {!stage.trackId && (
                        <span
                          className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[11px] sm:inline ${track.accent.bg} ${track.accent.text}`}
                        >
                          {track.level}
                        </span>
                      )}
                      <span
                        className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[11px] sm:inline ${KIND_STYLE[lesson.kind]}`}
                      >
                        {KIND_LABEL[lesson.kind]}
                      </span>
                      <span className="hidden w-12 shrink-0 text-right text-xs text-gray-400 sm:inline">
                        {lesson.minutes} 分
                      </span>
                      {lesson.status === 'planned' && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-400">
                          大纲
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ol>
          </article>
        )
      })}
    </section>
  )
}

/** 路线是"挑着学"，这里保留一份按 L0–L4 排的全量目录，免得有课找不到入口 */
function FullCatalog() {
  return (
    <details className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold text-gray-700">
        完整课程目录（按 L0–L4 阶段，共 {stats.lessonCount} 节）
      </summary>
      <div className="mt-4 space-y-4">
        {tracks.map((track) => (
          <div key={track.id}>
            <Link
              to="/tracks/$trackId"
              params={{ trackId: track.id }}
              className="text-sm font-semibold hover:underline"
            >
              <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[11px] ${track.accent.bg} ${track.accent.text}`}>
                {track.level}
              </span>
              {track.title}
              <span className="ml-2 text-xs font-normal text-gray-400">{track.subtitle}</span>
            </Link>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              {track.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to="/learn/$trackId/$lessonId"
                  params={{ trackId: track.id, lessonId: lesson.id }}
                  className="hover:text-brand-600 hover:underline"
                >
                  {lesson.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
