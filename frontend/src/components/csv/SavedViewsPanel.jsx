import PropTypes from 'prop-types'

function formatTimestamp(value) {
  if (!value) {
    return ''
  }
  try {
    return new Date(value).toLocaleString('de-DE')
  } catch (_error) {
    return ''
  }
}

export default function SavedViewsPanel({
  views,
  activeViewId,
  draftName,
  onDraftNameChange,
  onSave,
  onApply,
  onDelete,
  onRename
}) {
  const hasViews = Array.isArray(views) && views.length > 0

  const handleSubmit = (event) => {
    event.preventDefault()
    const result = onSave(draftName)
    if (result && result.success === false && result.reason) {
      window.alert(result.reason)
    }
  }

  const sortedViews = hasViews
    ? [...views].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    : []

  return (
    <section className="space-y-3 rounded-lg border border-gray-700 bg-dark-bg/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-dark-textLight">Ansichten speichern</h4>
          <p className="text-[11px] text-dark-textGray">
            Speichern Sie Filter-, Sortier- und Suchkonfigurationen als wiederverwendbare Ansichten.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="text"
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder="Name für Ansicht"
            className="w-full rounded-md border border-gray-700 bg-dark-secondary px-3 py-1.5 text-sm text-dark-textLight focus:border-dark-accent1 focus:outline-none sm:w-56"
          />
          <button
            type="submit"
            className="rounded-md border border-dark-accent1/60 px-3 py-1.5 text-sm font-medium text-dark-accent1 transition-colors hover:bg-dark-accent1/20"
          >
            Speichern
          </button>
        </form>
      </div>
      {!hasViews ? (
        <p className="text-xs text-dark-textGray">
          Noch keine Ansichten gespeichert. Legen Sie Filter und Sortierungen fest und speichern Sie anschließend die Konfiguration.
        </p>
      ) : (
        <div className="space-y-2">
          {sortedViews.map((view) => {
            const isActive = view.id === activeViewId
            return (
              <div
                key={view.id}
                className={`flex flex-col gap-2 rounded-md border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between ${
                  isActive ? 'border-dark-accent1/60 bg-dark-accent1/15 text-dark-textLight' : 'border-gray-700 bg-dark-secondary/40 text-dark-textGray'
                }`}
              >
                <div>
                  <div className="font-semibold text-dark-textLight">{view.name || 'Unbenannte Ansicht'}</div>
                  <div className="text-[10px] text-dark-textGray/80">
                    Aktualisiert: {formatTimestamp(view.updatedAt) || '–'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const result = onApply(view.id)
                      if (result && result.applied === false && result.reason) {
                        window.alert(result.reason)
                      }
                    }}
                    className="rounded border border-dark-accent1/60 px-2 py-1 text-[11px] text-dark-accent1 transition-colors hover:bg-dark-accent1/20"
                  >
                    Anwenden
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextName = window.prompt('Neuer Name für die Ansicht', view.name)
                      if (nextName === null) {
                        return
                      }
                      const trimmed = nextName.trim()
                      if (!trimmed || trimmed === view.name) {
                        return
                      }
                      onRename(view.id, trimmed)
                    }}
                    className="rounded border border-gray-600 px-2 py-1 text-[11px] text-dark-textGray transition-colors hover:border-dark-accent1 hover:text-dark-textLight"
                  >
                    Umbenennen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const label = view.name || 'diese Ansicht'
                      if (window.confirm(`Ansicht "${label}" wirklich löschen?`)) {
                        onDelete(view.id)
                      }
                    }}
                    className="rounded border border-red-600/60 px-2 py-1 text-[11px] text-red-200 transition-colors hover:bg-red-900/30"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

SavedViewsPanel.propTypes = {
  views: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      updatedAt: PropTypes.number
    })
  ).isRequired,
  activeViewId: PropTypes.string,
  draftName: PropTypes.string.isRequired,
  onDraftNameChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired
}

SavedViewsPanel.defaultProps = {
  activeViewId: null
}
