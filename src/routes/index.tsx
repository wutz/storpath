import type { ReactNode } from 'react'
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

/** 五个阶段各自解决什么问题 —— 说清「为什么是这个顺序」 */
const STAGE_HINT: Record<string, string> = {
  'l0-fundamentals': '不用碰任何命令行。先把存储的语言学会，后面每一节都建立在这几个词上。',
  'l1-systems': '存储跑在机器上。学会读机器给你的信号，才谈得上判断「到底慢在哪」。',
  'l2-ceph': '先把集群跑起来，再回头讲原理，最后用四关排障把手感练出来。',
  'l3-planning': '开始算账。把业务需求翻译成机器数量、盘型号和网络配置。',
  'l4-advanced': '走出 Ceph 的舒适区，把散落的知识收口成可交接的流程。',
}

function Home() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  const doneCount = allLessons.filter(({ track, lesson }) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length
  const percent = Math.round((doneCount / stats.lessonCount) * 100)

  const nextAt = allLessons.findIndex(
    ({ track, lesson }) => !doneSet.has(lessonKey(track.id, lesson.id)),
  )
  const next = nextAt === -1 ? undefined : allLessons[nextAt]

  return (
    <div className="space-y-10">
      <section>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.trackCount} stages ·{' '}
          {Math.round(stats.totalMinutes / 60)} hours
        </div>
        <h1 className="display-2xl mt-3">从零开始，一条路走到底。</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-body">
          没有分岔，也不用挑。{stats.lessonCount} 节课按「先懂原理、再读机器、然后上手集群、接着学会算账、
          最后走进企业级战场」排成一条线，从完全不懂存储开始，一节一节往下走就行。
        </p>
      </section>

      <section className="rounded-lg bg-canvas px-5 py-5 shadow-soft sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="display-md">
            {doneCount === 0 ? '从第一节开始' : next ? '接着上次往下走' : '全部走完了 🎉'}
          </h2>
          <span className="font-mono text-xs text-mute">
            已完成 {doneCount}/{stats.lessonCount}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-soft-2">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-mute">{percent}%</span>
        </div>

        {next && (
          <Link
            to="/learn/$trackId/$lessonId"
            params={{ trackId: next.track.id, lessonId: next.lesson.id }}
            className="mt-5 inline-flex items-center rounded-sm bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {doneCount > 0 ? '继续' : '开始学'} · 第 {nextAt + 1} 节 {next.lesson.title}
          </Link>
        )}
      </section>

      <section className="space-y-4">
        {tracks.map((track, stageIndex) => {
          const trackDone = track.lessons.filter((lesson) =>
            doneSet.has(lessonKey(track.id, lesson.id)),
          ).length

          return (
            <article key={track.id} className="overflow-hidden rounded-md bg-canvas shadow-card">
              <header className="border-b border-line bg-soft px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-xs bg-canvas px-2 py-1 font-mono text-xs text-ink shadow-hair">
                    {track.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="eyebrow">第 {stageIndex + 1} 步</span>
                      <Link
                        to="/tracks/$trackId"
                        params={{ trackId: track.id }}
                        className="text-[15px] font-semibold tracking-[-0.02em] hover:underline"
                      >
                        {track.title}
                      </Link>
                      <span className="font-mono text-[11px] text-mute">{track.subtitle}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-body">
                      {STAGE_HINT[track.id] ?? track.goal}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-mute">
                    {trackDone}/{track.lessons.length}
                  </span>
                </div>
              </header>

              <ol className="divide-y divide-line">
                {track.lessons.map((lesson, index) => {
                  const key = lessonKey(track.id, lesson.id)
                  return (
                    <li key={lesson.id}>
                      <Link
                        to="/learn/$trackId/$lessonId"
                        params={{ trackId: track.id, lessonId: lesson.id }}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-soft sm:px-5"
                      >
                        <Marker done={doneSet.has(key)}>{index + 1}</Marker>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink">{lesson.title}</span>
                          <span className="block truncate text-xs text-mute">{lesson.summary}</span>
                        </span>
                        <KindBadge kind={lesson.kind} />
                        <span className="shrink-0 font-mono text-[11px] text-mute">
                          {lesson.minutes}m
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </article>
          )
        })}

        <p className="text-sm leading-relaxed text-mute">
          顺序是建议不是限制 —— 已经有底子的话，直接跳到对应阶段也行。
          想先动手，
          <Link
            to="/labs"
            className="text-ink underline decoration-line underline-offset-4 transition hover:decoration-ink"
          >
            实验与闯关
          </Link>
          把全部动手环节单独汇总在了一起。
        </p>
      </section>
    </div>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        done ? 'bg-brand-600 text-white' : 'bg-soft-2 text-mute'
      }`}
    >
      {done ? '✓' : children}
    </span>
  )
}

/** 「原理」是默认形态，只给动手环节挂徽标 */
function KindBadge({ kind }: { kind: keyof typeof KIND_LABEL }) {
  if (kind === 'concept') return null
  return (
    <span
      className={`hidden shrink-0 rounded-xs px-1.5 py-0.5 text-[11px] sm:inline ${KIND_STYLE[kind]}`}
    >
      {KIND_LABEL[kind]}
    </span>
  )
}
