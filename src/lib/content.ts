/**
 * 加载课程正文。
 *
 * MDX 全量 eager 打包。课程在百篇量级以内，包体积可以接受，
 * SSR 能直出，站内跳转也不用等。
 * 正文体量再大就换成 lazy glob 配 React.lazy，代价是首屏多一次加载。
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
