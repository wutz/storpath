import type { ReactNode } from 'react'

/** 输入框统一样式：6px 圆角配 hairline 描边，聚焦时边框转为品牌色 */
export const inputCls =
  'w-full rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-body">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] leading-relaxed text-mute">{hint}</span>}
    </label>
  )
}

/** 课文内嵌交互面板的外壳：白卡加一条 hairline 标题条 */
export function Panel({
  eyebrow,
  title,
  onReset,
  children,
}: {
  eyebrow: string
  title: string
  onReset: () => void
  children: ReactNode
}) {
  return (
    <section className="my-6 overflow-hidden rounded-md bg-canvas shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="eyebrow">{eyebrow}</span>
          <span className="text-sm font-medium text-ink">{title}</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 font-mono text-[11px] text-mute transition hover:text-ink"
        >
          重置
        </button>
      </header>
      {children}
    </section>
  )
}

/** 数字结论块：一个大数加一行注解，超大字号仅限此处使用 */
export function Stat({
  label,
  value,
  note,
  size = 'lg',
}: {
  label: string
  value: string
  note?: ReactNode
  size?: 'lg' | 'md'
}) {
  return (
    <div className="rounded-md bg-soft-2 px-4 py-4">
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-1.5 font-semibold tracking-[-0.04em] text-ink ${
          size === 'lg' ? 'text-3xl' : 'text-2xl'
        }`}
      >
        {value}
      </div>
      {note && <div className="mt-1.5 text-[11px] leading-relaxed text-body">{note}</div>}
    </div>
  )
}

/** 提示清单：放计算得出的警告与口径说明 */
export function NoteList({ items, tone = 'note' }: { items: string[]; tone?: 'note' | 'warn' }) {
  return (
    <ul
      className={`space-y-1.5 rounded-md px-3.5 py-3 text-xs leading-relaxed ${
        tone === 'warn' ? 'bg-warn-soft text-warn-deep' : 'bg-soft-2 text-body'
      }`}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="shrink-0 font-mono">{tone === 'warn' ? '!' : '·'}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
