import { useState, useRef } from 'react'
import PropTypes from 'prop-types'

export default function BackgroundImageEditor({ backgroundImage, onBackgroundImageChange }) {
  const fileInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(backgroundImage?.url || null)

  const defaultSettings = {
    url: null,
    positionX: 50,
    positionY: 50,
    scale: 100,
    flipHorizontal: false,
    flipVertical: false,
    rotation: 0,
    opacity: 100,
    blur: 0,
    brightness: 100,
    contrast: 100,
    grayscale: 0
  }

  const settings = { ...defaultSettings, ...backgroundImage }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target.result
      setPreviewUrl(url)
      onBackgroundImageChange({
        ...settings,
        url: url
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onBackgroundImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSettingChange = (key, value) => {
    onBackgroundImageChange({
      ...settings,
      [key]: value
    })
  }

  const handleReset = () => {
    onBackgroundImageChange({
      ...defaultSettings,
      url: settings.url
    })
  }

  return (
    <div className="space-y-4 border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-dark-textLight">
          Hintergrundbild
        </label>
        {settings.url && (
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 bg-dark-bg hover:bg-gray-800 text-dark-textGray hover:text-dark-textLight rounded transition-all"
            title="Einstellungen zurücksetzen"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      <div className="text-xs text-dark-textGray bg-dark-bg/50 rounded-lg p-3 flex items-start space-x-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Das Bild wird nur im Datenbereich des Diagramms angezeigt und beim Export verwendet. Maximale Größe: 5MB
        </span>
      </div>

      {/* Image Upload/Preview */}
      <div className="space-y-3">
        {!settings.url ? (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-dark-accent1 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="background-image-upload"
            />
            <label
              htmlFor="background-image-upload"
              className="cursor-pointer flex flex-col items-center space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-dark-bg flex items-center justify-center">
                <svg className="w-8 h-8 text-dark-accent1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-dark-textLight">Bild hochladen</div>
                <div className="text-xs text-dark-textGray mt-1">PNG, JPG, GIF bis 5MB</div>
              </div>
            </label>
          </div>
        ) : (
          <>
            {/* Image Preview */}
            <div className="relative bg-dark-bg rounded-lg p-4 border border-gray-700">
              <div 
                className="w-full h-32 rounded overflow-hidden flex items-center justify-center"
                style={{
                  backgroundImage: `url(${previewUrl})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                }}
              >
              </div>
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all"
                title="Bild entfernen"
              >
                ✕
              </button>
            </div>

            {/* Position Controls */}
            <div className="space-y-3 p-4 bg-dark-bg rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-dark-textLight mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Position
              </h4>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Horizontal</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.positionX}%</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  value={settings.positionX}
                  onChange={(e) => handleSettingChange('positionX', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
                <div className="flex justify-between text-xs text-dark-textGray mt-1">
                  <span>-400%</span>
                  <span>400%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Vertikal</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.positionY}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="200"
                  value={settings.positionY}
                  onChange={(e) => handleSettingChange('positionY', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
                <div className="flex justify-between text-xs text-dark-textGray mt-1">
                  <span>-100%</span>
                  <span>200%</span>
                </div>
              </div>
            </div>

            {/* Scale & Rotation */}
            <div className="space-y-3 p-4 bg-dark-bg rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-dark-textLight mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Größe & Rotation
              </h4>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Skalierung</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.scale}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={settings.scale}
                  onChange={(e) => handleSettingChange('scale', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Rotation</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={settings.rotation}
                  onChange={(e) => handleSettingChange('rotation', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
              </div>
            </div>

            {/* Flip Controls */}
            <div className="p-4 bg-dark-bg rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-dark-textLight mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Spiegeln
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSettingChange('flipHorizontal', !settings.flipHorizontal)}
                  className={`px-3 py-2 rounded-lg transition-all text-sm ${
                    settings.flipHorizontal
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-secondary text-dark-textGray hover:bg-gray-800 hover:text-dark-textLight'
                  }`}
                >
                  Horizontal
                </button>
                <button
                  onClick={() => handleSettingChange('flipVertical', !settings.flipVertical)}
                  className={`px-3 py-2 rounded-lg transition-all text-sm ${
                    settings.flipVertical
                      ? 'bg-dark-accent1 text-white'
                      : 'bg-dark-secondary text-dark-textGray hover:bg-gray-800 hover:text-dark-textLight'
                  }`}
                >
                  Vertikal
                </button>
              </div>
            </div>

            {/* Image Adjustments */}
            <div className="space-y-3 p-4 bg-dark-bg rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-dark-textLight mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Bildbearbeitung
              </h4>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Deckkraft</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.opacity}
                  onChange={(e) => handleSettingChange('opacity', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Weichzeichnen</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={settings.blur}
                  onChange={(e) => handleSettingChange('blur', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Helligkeit</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={settings.brightness}
                  onChange={(e) => handleSettingChange('brightness', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Kontrast</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={settings.contrast}
                  onChange={(e) => handleSettingChange('contrast', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-dark-textGray">Graustufen</label>
                  <span className="text-xs font-mono text-dark-accent1">{settings.grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.grayscale}
                  onChange={(e) => handleSettingChange('grayscale', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dark-accent1"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

BackgroundImageEditor.propTypes = {
  backgroundImage: PropTypes.shape({
    url: PropTypes.string,
    positionX: PropTypes.number,
    positionY: PropTypes.number,
    scale: PropTypes.number,
    flipHorizontal: PropTypes.bool,
    flipVertical: PropTypes.bool,
    rotation: PropTypes.number,
    opacity: PropTypes.number,
    blur: PropTypes.number,
    brightness: PropTypes.number,
    contrast: PropTypes.number,
    grayscale: PropTypes.number
  }),
  onBackgroundImageChange: PropTypes.func.isRequired
}

