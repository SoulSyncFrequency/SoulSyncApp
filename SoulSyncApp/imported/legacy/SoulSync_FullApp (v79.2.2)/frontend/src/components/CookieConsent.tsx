import { useState } from 'react'
import useCookieConsent from '../hooks/useCookieConsent'
import useI18n from '../hooks/useI18n'

export default function CookieConsent() {
  const { consent, setConsent } = useCookieConsent()
  const { lang, setLang } = useI18n()
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsTemp, setAnalyticsTemp] = useState(false)

  if (consent) {
    return (
      <footer className='fixed bottom-0 left-0 right-0 text-center text-xs text-gray-500 pb-1 z-40'>
        <button onClick={() => setShowSettings(true)} className='underline hover:text-gray-700'>
          {lang==='hr' ? 'Postavke kolačića' : 'Cookie Settings'}
        </button>
        <span className='mx-2'>•</span>
        <button onClick={()=>setLang(lang==='hr'?'en':'hr')} className='underline hover:text-gray-700'>
          {lang.toUpperCase()}
        </button>
        {/* Modal even when consent exists */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
              <div className='flex items-center justify-between'>
                <h2 className="text-lg font-semibold">{lang==='hr'?'Postavke kolačića':'Cookie Settings'}</h2>
                <span className='text-xs text-gray-500'>Last updated: Sep 2025</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked disabled />
                  <span>{lang==='hr'?'Neophodni (uvijek aktivni)':'Necessary (always on)'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={analyticsTemp} onChange={e => setAnalyticsTemp(e.target.checked)} />
                  <span>{lang==='hr'?'Analitički':'Analytics'}</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowSettings(false)} className="px-3 py-1 text-sm">{lang==='hr'?'Odustani':'Cancel'}</button>
                <button onClick={() => { setConsent(analyticsTemp); setShowSettings(false); }} className="px-3 py-1 bg-blue-600 text-white text-sm rounded">{lang==='hr'?'Spremi':'Save'}</button>
              </div>
            </div>
          </div>
        )}
      </footer>
    )
  }

  const text = lang==='hr'
    ? 'Ova aplikacija koristi kolačiće radi poboljšanja korisničkog iskustva. Analitički kolačići su opcionalni.'
    : 'This app uses cookies to enhance your experience. Analytics cookies are optional.'

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow p-4 flex flex-col md:flex-row items-center justify-between gap-2 z-50">
        <p className="text-sm text-gray-800">{text}</p>
        <div className="flex gap-2 items-center">
          <button onClick={() => setConsent(false)} className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm">
            {lang==='hr'?'Odbijam sve':'Reject All'}
          </button>
          <button onClick={() => setConsent(true)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">
            {lang==='hr'?'Prihvaćam sve':'Accept All'}
          </button>
          <button onClick={() => setShowSettings(true)} className="px-3 py-1 rounded border text-sm">
            {lang==='hr'?'Postavke kolačića':'Cookie Settings'}
          </button>
          <button onClick={()=>setLang(lang==='hr'?'en':'hr')} className='text-xs underline'>
            {lang.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
            <div className='flex items-center justify-between'>
              <h2 className="text-lg font-semibold">{lang==='hr'?'Postavke kolačića':'Cookie Settings'}</h2>
              <span className='text-xs text-gray-500'>Last updated: Sep 2025</span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked disabled />
                <span>{lang==='hr'?'Neophodni (uvijek aktivni)':'Necessary (always on)'}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={analyticsTemp} onChange={e => setAnalyticsTemp(e.target.checked)} />
                <span>{lang==='hr'?'Analitički':'Analytics'}</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setShowSettings(false)} className="px-3 py-1 text-sm">{lang==='hr'?'Odustani':'Cancel'}</button>
              <button onClick={() => { setConsent(analyticsTemp); setShowSettings(false); }} className="px-3 py-1 bg-blue-600 text-white text-sm rounded">{lang==='hr'?'Spremi':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
