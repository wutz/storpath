import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Storpath — 存储成长路径' },
      {
        name: 'description',
        content:
          '存储运维工程师的成长路线：一条循序渐进的完整学习路径，从存储原理与 Linux 系统基础起步，走过 Ceph 三种存储、容量与性能规划，直到 RDMA 网络、GPFS ECE、K8s CSI 与商业存储。',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
      /* 正文与代码两套字面：Geist 走叙述，Geist Mono 走技术标签。中文回落到系统字体 */
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: RootLayout,
})

const navLink =
  'shrink-0 rounded-full px-3 py-1.5 text-body transition hover:bg-soft-2 hover:text-ink'

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-soft font-sans text-ink antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img src="/logo.svg" alt="" width={26} height={26} className="h-6.5 w-6.5 shrink-0" />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">Storpath</span>
              <span className="hidden border-l border-line pl-2.5 text-xs text-mute sm:inline">
                存储成长路径
              </span>
            </Link>
            <nav className="-mr-1 flex items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-soft-2 text-ink' }}
                className={navLink}
              >
                路径
              </Link>
              <Link to="/labs" activeProps={{ className: 'bg-soft-2 text-ink' }} className={navLink}>
                实验与闯关
              </Link>
              <a
                href="https://storplan.wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className={navLink}
              >
                规划工具 ↗
              </a>
              <a href="https://wutz.dev/" target="_blank" rel="noreferrer" className={navLink}>
                wutz.dev ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-line bg-canvas sm:mt-24">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="eyebrow">Storpath</div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-body">
              存储运维工程师的成长路线，从看懂一块盘到扛住一套集群。
            </p>
            <p className="mt-2 text-xs text-mute">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
