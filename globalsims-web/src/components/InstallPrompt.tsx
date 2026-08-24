import { useEffect, useState } from 'react'

type Platform = 'android' | 'ios' | null

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isAndroid = /android/i.test(ua)
  const isInStandaloneMode =
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches

  if (isInStandaloneMode) return null // already installed
  if (isIOS) return 'ios'
  if (isAndroid) return 'android'
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  useEffect(() => {
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem('install-dismissed')) return

    setPlatform(detectPlatform())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    else dismiss()
    setDeferredPrompt(null)
  }

  // Don't render if already installed, dismissed, or no relevant platform
  if (dismissed || !platform) return null
  // On Android, wait for the browser's BeforeInstallPrompt event before showing
  if (platform === 'android' && !deferredPrompt) return null

  return (
    <>
      {/* Backdrop for iOS steps modal */}
      {showIOSSteps && (
        <div
          className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm z-40"
          onClick={() => setShowIOSSteps(false)}
        />
      )}

      {/* iOS steps sheet */}
      {showIOSSteps && (
        <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-ink-700 bg-ink-800 p-6 pb-10 fade-up">
          <div className="w-10 h-1 rounded-full bg-ink-600 mx-auto mb-6" />
          <h3 className="display text-lg font-semibold mb-1">Add to Home Screen</h3>
          <p className="text-sm text-fog-400 mb-6">Install GlobalSims as an app in three taps.</p>
          <div className="space-y-4">
            {[
              { step: '1', text: 'Tap the Share button at the bottom of Safari (the box with an arrow pointing up).' },
              { step: '2', text: 'Scroll down in the share sheet and tap "Add to Home Screen".' },
              { step: '3', text: 'Tap "Add" in the top right. Done — GlobalSims opens like a native app.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <span className="mono text-signal-amber font-bold text-sm w-5 shrink-0">{s.step}</span>
                <p className="text-sm text-fog-400 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowIOSSteps(false)}
            className="mt-8 w-full rounded-xl border border-ink-700 py-3 text-sm text-fog-400"
          >
            Got it
          </button>
        </div>
      )}

      {/* Install banner — shown at the bottom on both platforms */}
      {!showIOSSteps && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 fade-up">
          <div className="mx-auto max-w-lg rounded-2xl border border-ink-700 bg-ink-800 p-4 flex items-center gap-4 shadow-2xl">
            <div className="h-10 w-10 rounded-xl bg-ink-900 flex items-center justify-center text-xl shrink-0">
              ✊
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-md font-semibold leading-tight">Install GlobalSims</p>
              <p className="text-sm text-fog-400 mt-0.5">Play faster, straight from your home screen</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={dismiss}
                className="text-sm text-fog-600 hover:text-fog-400 px-2 py-1"
              >
                Not now
              </button>
              <button
                onClick={platform === 'ios' ? () => setShowIOSSteps(true) : install}
                className="rounded-xl bg-signal-amber text-ink-950 font-semibold text-sm px-4 py-2 hover:brightness-110 transition"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
