import Footer from './Footer'
import { useGsapPageTransitions } from '../hooks/useGsapPageTransitions'

const AppShell = ({ pageKey, navigation, mobileControls, floating, fullScreen, fullWidth, children }) => {
  const pageRef = useGsapPageTransitions(pageKey)

  if (fullScreen) {
    return <div ref={pageRef}>{children}</div>
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 antialiased overflow-x-hidden">
      {navigation}
      {mobileControls}

      <div className="flex-1 w-full pt-[64px] flex flex-col">
        <main ref={pageRef} className={`flex-1 w-full ${fullWidth ? '' : 'max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4'}`}>
          {children}
        </main>
        {!fullWidth && <Footer />}
      </div>

      {floating}
    </div>
  )
}

export default AppShell
