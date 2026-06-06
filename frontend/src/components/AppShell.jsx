import Footer from './Footer'
import { useGsapPageTransitions } from '../hooks/useGsapPageTransitions'

const AppShell = ({ sidebarCollapsed, pageKey, navigation, mobileControls, floating, children }) => {
  const pageRef = useGsapPageTransitions(pageKey)

  return (
    <div
      className={[
        'app-container min-h-screen w-full overflow-x-hidden bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f5_48%,#ffffff_100%)] text-zinc-950 antialiased',
        sidebarCollapsed ? 'sidebar-collapsed' : ''
      ].join(' ')}
    >
      {navigation}
      {mobileControls}

      <div className="page-column relative z-10 flex min-h-screen w-full flex-1 flex-col px-3 pb-5 pt-20 sm:px-5 lg:px-7 lg:pt-6">
        <main ref={pageRef} className="main-content flex-1 pb-16">
          <div className="mx-auto min-h-[80vh] w-full max-w-[1440px] rounded-lg border border-zinc-200/70 bg-white/90 p-4 shadow-[0_18px_70px_rgba(24,24,27,0.08)] transition-[opacity,transform] duration-300 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
        <Footer />
      </div>

      {floating}
    </div>
  )
}

export default AppShell
