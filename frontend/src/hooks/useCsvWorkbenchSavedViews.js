import { useCallback, useState } from 'react'
import { createUniqueId } from '../components/csv/utils'

/**
 * Hook für Saved Views im CSV Workbench
 * Verwaltet Gespeicherte Ansichten (Filter, Sort, Search)
 */
export const useCsvWorkbenchSavedViews = ({
  transformations,
  sortConfig,
  searchQuery,
  searchMode,
  searchColumns,
  schedulePersist,
  registerVersionEvent,
  updateTransformations,
  setSortConfig,
  setSearchQuery,
  setSearchMode,
  setSearchColumns
}) => {
  const [savedViews, setSavedViews] = useState(() => [])
  const [activeSavedViewId, setActiveSavedViewId] = useState(null)
  const [savedViewDraftName, setSavedViewDraftName] = useState('')

  const buildCurrentViewState = useCallback(() => {
    const rawFilters = Array.isArray(transformations?.filters) ? transformations.filters : []
    const filtersSnapshot = JSON.parse(JSON.stringify(rawFilters))
    const sortSnapshot = Array.isArray(sortConfig) ? sortConfig.map((entry) => ({ ...entry })) : []
    return {
      filters: filtersSnapshot,
      sortConfig: sortSnapshot,
      searchQuery,
      searchMode,
      searchColumns
    }
  }, [transformations, sortConfig, searchQuery, searchMode, searchColumns])

  const handleSaveCurrentView = useCallback(
    (name) => {
      const trimmed = (name || savedViewDraftName || '').trim()
      if (!trimmed) {
        return { success: false, reason: 'Bitte einen Namen für die Ansicht eingeben.' }
      }

      const snapshot = buildCurrentViewState()
      const timestamp = Date.now()
      let createdId = null

      setSavedViews((prev) => {
        const history = Array.isArray(prev) ? [...prev] : []
        const matchIndex = history.findIndex((view) => view?.name?.toLowerCase() === trimmed.toLowerCase())
        if (matchIndex >= 0) {
          const existing = history[matchIndex]
          createdId = existing.id
          history[matchIndex] = {
            ...existing,
            ...snapshot,
            name: trimmed,
            updatedAt: timestamp
          }
        } else {
          createdId = createUniqueId('view')
          history.push({
            id: createdId,
            name: trimmed,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...snapshot
          })
        }
        schedulePersist({ savedViews: history, activeSavedViewId: createdId })
        return history
      })

      if (createdId) {
        setActiveSavedViewId(createdId)
        setSavedViewDraftName('')
        registerVersionEvent({
          type: 'saved-view',
          description: `Ansicht „${trimmed}" gespeichert`,
          meta: { viewId: createdId }
        })
      }

      return { success: !!createdId, id: createdId }
    },
    [savedViewDraftName, buildCurrentViewState, schedulePersist, registerVersionEvent]
  )

  const handleApplySavedView = useCallback(
    (viewId) => {
      const target = savedViews.find((view) => view.id === viewId)
      if (!target) {
        return { applied: false, reason: 'Ansicht nicht gefunden.' }
      }

      const filtersSnapshot = JSON.parse(JSON.stringify(Array.isArray(target.filters) ? target.filters : []))
      updateTransformations((prev) => ({
        ...prev,
        filters: filtersSnapshot
      }))
      setSortConfig(Array.isArray(target.sortConfig) ? target.sortConfig : [])
      setSearchQuery(target.searchQuery || '')
      setSearchMode(target.searchMode || 'normal')
      setSearchColumns(Array.isArray(target.searchColumns) ? target.searchColumns : [])
      setActiveSavedViewId(viewId)
      setSavedViewDraftName(target.name || '')
      schedulePersist({ activeSavedViewId: viewId })
      registerVersionEvent({
        type: 'saved-view-apply',
        description: `Ansicht „${target.name || 'Unbenannt'}" angewendet`,
        meta: { viewId }
      })
      return { applied: true }
    },
    [savedViews, updateTransformations, setSortConfig, setSearchQuery, setSearchMode, setSearchColumns, schedulePersist, registerVersionEvent]
  )

  const handleDeleteSavedView = useCallback(
    (viewId) => {
      setSavedViews((prev) => {
        const history = Array.isArray(prev) ? prev.filter((view) => view.id !== viewId) : []
        const nextActive = viewId === activeSavedViewId ? null : activeSavedViewId
        schedulePersist({ savedViews: history, activeSavedViewId: nextActive })
        return history
      })
      if (activeSavedViewId === viewId) {
        setActiveSavedViewId(null)
        setSavedViewDraftName('')
      }
      registerVersionEvent({
        type: 'saved-view-delete',
        description: 'Gespeicherte Ansicht entfernt',
        meta: { viewId }
      })
    },
    [activeSavedViewId, schedulePersist, registerVersionEvent]
  )

  const handleRenameSavedView = useCallback(
    (viewId, nextName) => {
      const trimmed = (nextName || '').trim()
      if (!trimmed) {
        return { success: false }
      }
      let renamed = false
      setSavedViews((prev) => {
        const history = Array.isArray(prev) ? [...prev] : []
        const index = history.findIndex((view) => view.id === viewId)
        if (index === -1) {
          return prev
        }
        const updated = {
          ...history[index],
          name: trimmed,
          updatedAt: Date.now()
        }
        history[index] = updated
        schedulePersist({ savedViews: history })
        renamed = true
        return history
      })
      if (renamed) {
        registerVersionEvent({
          type: 'saved-view-rename',
          description: `Ansicht umbenannt in „${trimmed}"`,
          meta: { viewId }
        })
        if (activeSavedViewId === viewId) {
          setSavedViewDraftName(trimmed)
        }
      }
      return { success: renamed }
    },
    [schedulePersist, registerVersionEvent, activeSavedViewId]
  )

  return {
    savedViews,
    setSavedViews,
    activeSavedViewId,
    setActiveSavedViewId,
    savedViewDraftName,
    setSavedViewDraftName,
    handleSaveCurrentView,
    handleApplySavedView,
    handleDeleteSavedView,
    handleRenameSavedView
  }
}

