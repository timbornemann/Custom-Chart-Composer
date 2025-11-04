import PropTypes from 'prop-types'

export default function CsvMappingPanel({
  columns,
  mapping,
  chartType,
  isScatterBubble,
  isCoordinate,
  allowMultipleValueColumns,
  onUpdateMapping,
  onToggleValueColumn
}) {
  if (isCoordinate) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-dark-textLight mb-2">Koordinaten-Mapping</h3>
          <p className="text-xs text-dark-textGray mb-4">
            Ordnen Sie Spalten zu Longitude/Latitude zu
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-dark-textGray mb-1">Longitude</label>
            <select
              value={mapping.longitudeColumn || ''}
              onChange={(e) => onUpdateMapping({ longitudeColumn: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Spalte wählen...</option>
              {columns.filter((col) => col.type === 'number').map((col) => (
                <option key={col.key} value={col.key}>{col.key}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-textGray mb-1">Latitude</label>
            <select
              value={mapping.latitudeColumn || ''}
              onChange={(e) => onUpdateMapping({ latitudeColumn: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Spalte wählen...</option>
              {columns.filter((col) => col.type === 'number').map((col) => (
                <option key={col.key} value={col.key}>{col.key}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-textGray mb-1">Datensatz-Label (optional)</label>
            <select
              value={mapping.datasetLabel || ''}
              onChange={(e) => onUpdateMapping({ datasetLabel: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Nicht verwenden</option>
              {columns.filter((col) => col.type !== 'number').map((col) => (
                <option key={col.key} value={col.key}>{col.key}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  if (isScatterBubble) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-dark-textLight mb-2">Scatter/Bubble Mapping</h3>
          <p className="text-xs text-dark-textGray mb-4">
            Wählen Sie X, Y und optional R (Größe) Spalten
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-dark-textGray mb-1">X-Werte</label>
            <select
              value={mapping.xColumn || ''}
              onChange={(e) => onUpdateMapping({ xColumn: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Spalte wählen...</option>
              {columns.filter((col) => col.type === 'number').map((col) => (
                <option key={col.key} value={col.key}>{col.key}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-textGray mb-1">Y-Werte</label>
            <select
              value={mapping.yColumn || ''}
              onChange={(e) => onUpdateMapping({ yColumn: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Spalte wählen...</option>
              {columns.filter((col) => col.type === 'number').map((col) => (
                <option key={col.key} value={col.key}>{col.key}</option>
              ))}
            </select>
          </div>

          {(chartType === 'bubble' || chartType === 'matrix') && (
            <div>
              <label className="block text-xs font-semibold text-dark-textGray mb-1">Größe (R) - optional</label>
              <select
                value={mapping.rColumn || ''}
                onChange={(e) => onUpdateMapping({ rColumn: e.target.value })}
                className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
              >
                <option value="">Keine (Standard: 10)</option>
                {columns.filter((col) => col.type === 'number').map((col) => (
                  <option key={col.key} value={col.key}>{col.key}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Standard mapping (Label + Values)
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-dark-textLight mb-2">Spalten-Mapping</h3>
        <p className="text-xs text-dark-textGray mb-4">
          Ordnen Sie CSV-Spalten den Diagramm-Feldern zu
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-dark-textGray mb-1">
            {chartType === 'radar' ? 'Datensatz-Name (optional)' : 'Beschriftungs-Spalte'}
          </label>
          <select
            value={mapping.label || ''}
            onChange={(e) => onUpdateMapping({ label: e.target.value })}
            className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
          >
            <option value="">{chartType === 'radar' ? 'Nicht verwenden' : 'Spalte wählen...'}</option>
            {columns.map((col) => (
              <option key={col.key} value={col.key}>
                {col.key} {col.type === 'number' ? '(Zahl)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-dark-textGray mb-1">
            {chartType === 'radar' ? 'Attribut-Spalten' : 'Werte-Spalten'}
          </label>
          {allowMultipleValueColumns ? (
            <div className="space-y-1 rounded-lg border border-gray-700 bg-dark-bg p-2 max-h-60 overflow-y-auto">
              {columns.map((col) => {
                const disabled = col.key === mapping.label
                const checked = mapping.valueColumns.includes(col.key)
                return (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                      disabled
                        ? 'cursor-not-allowed text-dark-textGray/60'
                        : 'cursor-pointer hover:bg-dark-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleValueColumn(col.key)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-gray-600 bg-dark-bg text-dark-accent1 focus:ring-dark-accent1"
                    />
                    <span className="text-dark-textLight">
                      {col.key}
                      <span className="ml-1 text-xs text-dark-textGray">
                        ({col.type === 'number' ? 'Zahl' : 'Text'})
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          ) : (
            <select
              value={mapping.valueColumns[0] || ''}
              onChange={(e) => onUpdateMapping({ valueColumns: e.target.value ? [e.target.value] : [] })}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Spalte wählen...</option>
              {columns.filter((col) => col.key !== mapping.label).map((col) => (
                <option key={col.key} value={col.key}>
                  {col.key} {col.type === 'number' ? '(Zahl)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {!isScatterBubble && allowMultipleValueColumns && chartType !== 'radar' && (
          <div>
            <label className="block text-xs font-semibold text-dark-textGray mb-1">Datensatz-Spalte (optional)</label>
            <select
              value={mapping.datasetLabel || ''}
              onChange={(e) => onUpdateMapping({ datasetLabel: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-dark-bg px-3 py-2 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none"
            >
              <option value="">Nicht verwenden</option>
              {columns
                .filter((col) => col.type !== 'number' && col.key !== mapping.label && !mapping.valueColumns.includes(col.key))
                .map((col) => (
                  <option key={col.key} value={col.key}>{col.key}</option>
                ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

CsvMappingPanel.propTypes = {
  columns: PropTypes.array.isRequired,
  mapping: PropTypes.object.isRequired,
  chartType: PropTypes.string,
  isScatterBubble: PropTypes.bool,
  isCoordinate: PropTypes.bool,
  allowMultipleValueColumns: PropTypes.bool,
  onUpdateMapping: PropTypes.func.isRequired,
  onToggleValueColumn: PropTypes.func.isRequired
}

