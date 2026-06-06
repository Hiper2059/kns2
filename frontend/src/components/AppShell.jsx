import Footer from './Footer'
import { useGsapPageTransitions } from '../hooks/useGsapPageTransitions'

const AppShell = ({ sidebarCollapsed, pageKey, navigation, mobileControls, floating, children }) => {
  const pageRef = useGsapPageTransitions(pageKey)

  return (
    <div
      className={[
        'app-container min-h-screen w-full overflow-x-hidden bg-transparent text-zinc-950 antialiased',
        sidebarCollapsed ? 'sidebar-collapsed' : ''
      ].join(' ')}
    >
      {navigation}
      {mobileControls}

      <div className="page-column relative z-10 flex min-h-screen w-full flex-1 flex-col px-3 pb-5 pt-20 sm:px-5 lg:px-7 lg:pt-6">
        <main ref={pageRef} className="main-content flex-1 pb-16">
          <div className="mx-auto min-h-[80vh] w-full max-w-[1440px] overflow-clip rounded-xl border border-white/70 bg-white/88 p-4 shadow-[0_22px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-[opacity,transform,box-shadow] duration-300 sm:p-6 lg:p-8">
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
