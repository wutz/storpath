import { Link, createFileRoute } from '@tanstack/react-router'
import {
  KIND_LABEL,
  KIND_STYLE,
  allLessons,
  lessonKey,
  stats,
  tracks,
} from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  const doneCount = allLessons.filter(({ track, lesson }) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length
  const percent = Math.round((doneCount / stats.lessonCount) * 100)

  const nextUp =
    allLessons.find(
      ({ track, lesson }) =>
        lesson.status === 'ready' && !doneSet.has(lessonKey(track.id, lesson.id)),
    ) ?? allLessons[0]

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-gray-200 bg-white px-5 py-7 shadow-sm sm:px-10 sm:py-10">
        <p className="text-xs font-semibold tracking-widest text-brand-600">
          分布式存储运维工程师成长路径
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          从看懂一条 <code className="rounded bg-gray-100 px-1.5 py-0.5 text-2xl">iostat</code>{' '}
          开始，成为能扛线上存储的工程师
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-gray-600">
          五个阶段，一条主线：先把 Linux 系统基础打扎实，再吃透 Ceph
          这一套统一存储的块、文件、对象三种形态，接着学会把业务需求翻译成机器配置，最后走向 GPFS
          ECE、K8s CSI 与商业存储的进阶战场。每节课都配检查点、实验或命令行闯关。
        </p>

        {/* 手机上排成 2×2，避免最后一格单独掉一行 */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
          {[
            ['学习阶段', `${stats.trackCount} 个`],
            ['课程', `${stats.lessonCount} 节`],
            ['实验与闯关', `${stats.labCount} 个`],
            ['预计学时', `${Math.round(stats.totalMinutes / 60)} 小时`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 px-4 py-2.5">
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {doneCount > 0 ? '继续学习' : '从第一课开始'} · {nextUp.lesson.title}
          </Link>
          <div className="min-w-48 flex-1">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>总进度</span>
              <span>
                {doneCount} / {stats.lessonCount}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-bold">学习路径</h2>

        {tracks.map((track, trackIndex) => {
          const trackDone = track.lessons.filter((lesson) =>
            doneSet.has(lessonKey(track.id, lesson.id)),
          ).length

          return (
            <article
              key={track.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${track.accent.border}`}
            >
              <header className={`flex flex-wrap items-start gap-4 px-5 py-4 ${track.accent.bg}`}>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold shadow-sm ${track.accent.text}`}
                >
                  {track.level}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Link
                      to="/tracks/$trackId"
                      params={{ trackId: track.id }}
                      className="text-lg font-bold hover:underline"
                    >
                      {track.title}
                    </Link>
                    <span className="text-xs text-gray-500">{track.subtitle}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{track.goal}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div className={`text-lg font-bold ${track.accent.text}`}>
                    {trackDone}/{track.lessons.length}
                  </div>
                  已完成
                </div>
              </header>

              <ol className="divide-y divide-gray-100">
                {track.lessons.map((lesson, index) => {
                  const done = doneSet.has(lessonKey(track.id, lesson.id))
                  return (
                    <li key={lesson.id}>
                      <Link
                        to="/learn/$trackId/$lessonId"
                        params={{ trackId: track.id, lessonId: lesson.id }}
                        className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50"
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                            done
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {done ? '✓' : `${trackIndex}.${index + 1}`}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900">
                            {lesson.title}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {lesson.summary}
                          </span>
                        </span>
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
    </div>
  )
}
