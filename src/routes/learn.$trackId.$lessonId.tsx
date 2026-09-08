import { MDXProvider } from '@mdx-js/react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  KIND_LABEL,
  KIND_STYLE,
  RENAMED_TRACKS,
  allLessons,
  getFlatNeighbors,
  getLesson,
  lessonKey,
  stats,
} from '#/lib/curriculum'
import { getLessonContent } from '#/lib/content'
import { setLessonDone, useProgress } from '#/lib/progress'
import { LessonKeyContext } from '#/components/lesson-context'
import { mdxComponents } from '#/components/mdx-components'

export const Route = createFileRoute('/learn/$trackId/$lessonId')({
  beforeLoad: ({ params }) => {
    const renamed = RENAMED_TRACKS[params.trackId]
    if (renamed) {
      throw redirect({
        to: '/learn/$trackId/$lessonId',
        params: { ...params, trackId: renamed },
        replace: true,
      })
    }
  },
  component: LessonPage,
})

function LessonPage() {
  const { trackId, lessonId } = Route.useParams()
  const found = getLesson(trackId, lessonId)
  const progress = useProgress()

  if (!found) {
    return (
      <div className="rounded-lg bg-canvas px-6 py-12 text-center shadow-card">
        <p className="text-body">
          找不到这节课：{trackId}/{lessonId}
        </p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          返回学习路径
        </Link>
      </div>
    )
  }

  const { track, lesson } = found
  const key = lessonKey(track.id, lesson.id)
  const Content = getLessonContent(track.id, lesson.id)
  const done = progress.done.includes(key)
  const passedCheckpoints = progress.quiz.filter((q) => q.startsWith(`${key}#`)).length

  /* 全站只有一条路径，前后课按 L0→L4 的全局顺序排列 */
  const { prev, next } = getFlatNeighbors(track.id, lesson.id)
  const position =
    allLessons.findIndex((item) => lessonKey(item.track.id, item.lesson.id) === key) + 1

  return (
    <div className="lg:grid lg:grid-cols-[1fr_16rem] lg:gap-10">
      <article className="min-w-0">
        <nav className="font-mono text-xs text-mute">
          <Link to="/" className="transition hover:text-ink">
            学习路径
          </Link>
          <span className="mx-1.5 text-line-strong">/</span>
          <Link
            to="/tracks/$trackId"
            params={{ trackId: track.id }}
            className="transition hover:text-ink"
          >
            {track.level} {track.title}
          </Link>
        </nav>

        <PathBanner position={position} stage={`${track.level} ${track.title}`} />

        <header className="mt-4 border-b border-line pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-xs px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
              {KIND_LABEL[lesson.kind]}
            </span>
            <span className="font-mono text-[11px] text-mute">预计 {lesson.minutes} 分钟</span>
            {passedCheckpoints > 0 && (
              <span className="rounded-xs bg-info-soft px-1.5 py-0.5 text-[11px] text-info-deep">
                已过检查点 {passedCheckpoints}
              </span>
            )}
          </div>
          <h1 className="display-xl mt-3">{lesson.title}</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-body">{lesson.summary}</p>
        </header>

        <section className="mt-6 rounded-md bg-canvas px-5 py-4 shadow-card">
          <h2 className="eyebrow">本节目标</h2>
          <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed text-body">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                {objective}
              </li>
            ))}
          </ul>
        </section>

        <LessonKeyContext.Provider value={key}>
          <div className="lesson-body mt-8">
            {Content ? (
              <MDXProvider components={mdxComponents}>
                <Content />
              </MDXProvider>
            ) : (
              <OutlinePlaceholder outline={lesson.outline} />
            )}
          </div>
        </LessonKeyContext.Provider>

        {lesson.refs && lesson.refs.length > 0 && (
          <section className="mt-10 rounded-md bg-canvas px-5 py-4 shadow-card">
            <h2 className="eyebrow">延伸资料</h2>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              {lesson.refs.map((ref) => (
                <li key={ref.label + (ref.path ?? ref.href ?? '')} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                  {ref.href ? (
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      {ref.label} ↗
                    </a>
                  ) : (
                    <span className="text-body">
                      {ref.label}
                      {ref.path && (
                        <code className="ml-1.5 rounded-xs bg-soft-2 px-1.5 py-0.5 font-mono text-xs text-ink">
                          {ref.path}
                        </code>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => setLessonDone(key, !done)}
            className={`rounded-sm px-4 py-2.5 text-sm font-medium transition ${
              done
                ? 'bg-soft-2 text-body shadow-hair hover:text-ink'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {done ? '✓ 已完成（点击取消）' : '标记为已完成'}
          </button>
          {next ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: next.track.id, lessonId: next.lesson.id }}
              className="rounded-sm bg-canvas px-4 py-2.5 text-sm font-medium text-ink shadow-card transition hover:shadow-float"
            >
              下一课：{next.lesson.title} →
            </Link>
          ) : (
            <span className="text-sm text-mute">这是整条路径的最后一节 🎉</span>
          )}
        </div>

        {prev && (
          <nav className="mt-6">
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: prev.track.id, lessonId: prev.lesson.id }}
              className="text-sm text-mute transition hover:text-ink"
            >
              ← {prev.lesson.title}
            </Link>
          </nav>
        )}
      </article>

      <aside className="mt-12 lg:mt-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-md bg-canvas px-3 py-4 shadow-card">
          <div className="px-2">
            <div className="eyebrow">
              {track.level} · {track.title}
            </div>
            <div className="mt-1 font-mono text-[11px] text-mute">
              全程第 {position} / {stats.lessonCount} 节
            </div>
          </div>
          <ol className="mt-3 space-y-0.5 text-sm">
            {track.lessons.map((item) => (
              <li key={item.id}>
                <SidebarLink
                  trackId={track.id}
                  lessonId={item.id}
                  title={item.title}
                  active={item.id === lesson.id}
                  done={progress.done.includes(lessonKey(track.id, item.id))}
                />
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  )
}

/** 顶部进度条：位置与进度 */
function PathBanner({ position, stage }: { position: number; stage: string }) {
  const percent = Math.round((position / stats.lessonCount) * 100)

  return (
    <div className="mt-4 rounded-sm bg-canvas px-3.5 py-2.5 shadow-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-ink">{stage}</span>
        <span className="font-mono text-[11px] text-mute">
          全程第 {position} / {stats.lessonCount} 节
        </span>
        <Link to="/" className="ml-auto text-mute transition hover:text-ink">
          看完整路径
        </Link>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-soft-2">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function SidebarLink({
  trackId,
  lessonId,
  title,
  active,
  done,
}: {
  trackId: string
  lessonId: string
  title: string
  active: boolean
  done: boolean
}) {
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId, lessonId }}
      className={`flex gap-1.5 rounded-sm px-2 py-1.5 text-[13px] leading-snug transition ${
        active ? 'bg-soft-2 font-medium text-ink' : 'text-body hover:bg-soft'
      }`}
    >
      <span className={`shrink-0 font-mono text-[11px] ${done ? 'text-brand-600' : 'text-line-strong'}`}>
        {done ? '✓' : '○'}
      </span>
      <span className="min-w-0">{title}</span>
    </Link>
  )
}

function OutlinePlaceholder({ outline }: { outline: string[] }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong/50 bg-canvas px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-xs bg-soft-2 px-2 py-0.5 text-xs text-body">正文还没写</span>
        <span className="text-xs text-mute">本节大纲已定稿</span>
      </div>
      <ol className="mt-4 space-y-2">
        {outline.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-body">
            <span className="w-5 shrink-0 text-right font-mono text-xs text-mute">{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
