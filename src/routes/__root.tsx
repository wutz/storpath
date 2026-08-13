import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Storpath — 分布式存储运维工程师成长路径' },
      {
        name: 'description',
        content:
          '面向应届毕业生的分布式存储运维在线学习项目：从 Linux 系统基础到 Ceph 三种存储，再到容量规划、GPFS ECE 与 K8s CSI。',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                S
              </span>
              <span className="text-base font-bold tracking-tight">Storpath</span>
              <span className="hidden text-xs text-gray-400 sm:inline">存储运维成长路径</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-gray-100 text-gray-900' }}
                className="rounded-lg px-3 py-1.5 text-gray-600 transition hover:bg-gray-100"
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: 'bg-gray-100 text-gray-900' }}
                className="rounded-lg px-3 py-1.5 text-gray-600 transition hover:bg-gray-100"
              >
                实验与闯关
              </Link>
              <a
                href="https://storplan.wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-3 py-1.5 text-gray-600 transition hover:bg-gray-100"
              >
                Storplan ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-400">
            <p>
              Storpath · 分布式存储运维工程师成长路径。内容基于 k8s-in-action 部署手册、Storplan
              规划工具与 Systems Performance (2nd Edition) 整理。
            </p>
            <p className="mt-1">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
