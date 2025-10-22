import { useState } from 'react'
import { useExport } from '../hooks/useExport'

export default function ExportPanel({ chartType, config }) {
  const [format, setFormat] = useState('png')
  const [transparent, setTransparent] = useState(false)
  const { handleExport, exporting, error } = useExport()

  const formats = [
    { value: 'png', label: 'PNG', icon: '🖼️' },
    { value: 'jpeg', label: 'JPEG', icon: '📷' },
    { value: 'svg', label: 'SVG', icon: '✨' },
    { value: 'html', label: 'HTML', icon: '🌐' }
  ]

  const onExport = () => {
    handleExport(chartType, config, format, transparent)
  }

  return (
    <div className="bg-dark-secondary rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-dark-textLight mb-4">Export</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-textLight mb-3">
            Format wählen
          </label>
          <div className="grid grid-cols-4 gap-2">
            {formats.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setFormat(fmt.value)}
                className={`px-4 py-3 rounded-xl transition-all ${
                  format === fmt.value
                    ? 'bg-gradient-to-r from-dark-accent1 to-dark-accent2 text-white shadow-lg'
                    : 'bg-dark-bg text-dark-textGray hover:bg-gray-800 hover:text-dark-textLight'
                }`}
              >
                <div className="text-2xl mb-1">{fmt.icon}</div>
                <div className="text-xs font-medium">{fmt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {(format === 'png' || format === 'svg') && (
          <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
            <label className="text-sm font-medium text-dark-textLight">
              Transparenter Hintergrund
            </label>
            <button
              onClick={() => setTransparent(!transparent)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                transparent ? 'bg-dark-accent1' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  transparent ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={onExport}
          disabled={exporting || !chartType}
          className="w-full px-6 py-4 bg-gradient-to-r from-dark-accent1 to-dark-accent2 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {exporting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Exportiere...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Diagramm exportieren</span>
            </>
          )}
        </button>

        <div className="text-xs text-dark-textGray text-center">
          Das Diagramm wird als {format.toUpperCase()} heruntergeladen
        </div>
      </div>
    </div>
  )
}

