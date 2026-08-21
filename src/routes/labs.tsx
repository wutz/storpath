import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_STYLE, LEVEL_CHIP, allLessons, lessonKey, type LessonKind } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/labs')({
  component: LabsPage,
})

const SECTIONS: { kind: LessonKind; title: string; eyebrow: string; desc: string }[] = [
  {
    kind: 'quest',
    title: '命令行闯关',
    eyebrow: 'Quest',
    desc: '在模拟终端里接手一套出问题的集群，按目标一步步定位根因。',
  },
  {
    kind: 'lab',
    title: '动手实验',
    eyebrow: 'Lab',
    desc: '需要真实环境（虚拟机或测试集群），跟着步骤把服务跑起来。',
  },
  {
    kind: 'planner',
    title: '规划计算器',
    eyebrow: 'Planner',
    desc: '改参数看结果，把容量与性能的账算明白。',
  },
]

function LabsPage() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-10">
      <header>
        <div className="eyebrow">Hands-on</div>
        <h1 className="display-2xl mt-3">动手的部分。</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-body">
          知识点看过就忘，手上做过才记得住。这里把全部动手环节汇总在一起，
          你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        return (
          <section key={section.kind}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="eyebrow">{section.eyebrow}</span>
              <h2 className="display-md">{section.title}</h2>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-body">{section.desc}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="flex flex-col rounded-md bg-canvas px-5 py-4 shadow-card transition hover:shadow-float"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={LEVEL_CHIP}>{track.level}</span>
                      <span className="font-mono text-mute">{track.title}</span>
                      <span
                        className={`ml-auto rounded-xs px-1.5 py-0.5 ${KIND_STYLE[lesson.kind]}`}
                      >
                        {lesson.minutes} 分钟
                      </span>
                      {done && (
                        <span className="rounded-xs bg-brand-600 px-1.5 py-0.5 text-white">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && (
                        <span className="rounded-xs bg-soft-2 px-1.5 py-0.5 text-mute">仅大纲</span>
                      )}
                    </div>
                    <h3 className="display-sm mt-2.5">{lesson.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-body">{lesson.summary}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
