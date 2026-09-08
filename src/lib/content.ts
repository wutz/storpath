/**
 * 加载课程正文。
 *
 * MDX 全量 eager 打包。课程在百篇量级以内，换来 SSR 直出和站内秒开。
 * 正文体量再大就换 lazy glob + React.lazy，代价是首屏多一个 loading。
 */
import type { ComponentType } from 'react'

type MDXModule = { default: ComponentType<Record<string, unknown>> }

const modules = import.meta.glob<MDXModule>('../content/**/*.mdx', { eager: true })

export function getLessonContent(trackId: string, lessonId: string) {
  return modules[`../content/${trackId}/${lessonId}.mdx`]?.default
}

export function hasLessonContent(trackId: string, lessonId: string) {
  return Boolean(getLessonContent(trackId, lessonId))
}
