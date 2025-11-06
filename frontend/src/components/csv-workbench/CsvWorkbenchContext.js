import { createContext, useCallback, useContext, useMemo } from 'react'
import PropTypes from 'prop-types'
import { createUniqueId } from '../csv/utils'

const CsvWorkbenchContext = createContext(null)

export function CsvWorkbenchProvider({ transformations, updateTransformations, children }) {
  const filterGroups = useMemo(
    () => (Array.isArray(transformations?.filterGroups) ? transformations.filterGroups : []),
    [transformations]
  )

  const activeFilterGroupId = transformations?.activeFilterGroupId || null

  const currentFilters = useMemo(
    () => (Array.isArray(transformations?.filters) ? transformations.filters : []),
    [transformations]
  )

  const saveFilterGroup = useCallback(
    ({ name, groupId = null, filters: overrideFilters = null } = {}) => {
      let savedGroupId = groupId
      updateTransformations((prev) => {
        const prevGroups = Array.isArray(prev.filterGroups) ? prev.filterGroups : []
        const sourceFilters = Array.isArray(overrideFilters)
          ? overrideFilters
          : Array.isArray(prev.filters)
            ? prev.filters
            : []

        if (sourceFilters.length === 0) {
          return prev
        }

        const sanitizedFilters = sourceFilters.map((filter) => ({ ...filter }))

        if (groupId) {
          const nextGroups = prevGroups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  name: name?.trim() || group.name,
                  filters: sanitizedFilters.map((filter) => ({ ...filter }))
                }
              : group
          )
          return {
            ...prev,
            filterGroups: nextGroups
          }
        }

        savedGroupId = createUniqueId('fgroup')
        const nextGroup = {
          id: savedGroupId,
          name: name?.trim() || `Filtergruppe ${prevGroups.length + 1}`,
          filters: sanitizedFilters.map((filter) => ({ ...filter }))
        }

        return {
          ...prev,
          filterGroups: [...prevGroups, nextGroup]
        }
      })

      return savedGroupId
    },
    [updateTransformations]
  )

  const applyFilterGroup = useCallback(
    (groupId) => {
      if (!groupId) {
        return null
      }

      let didApply = false
      updateTransformations((prev) => {
        const prevGroups = Array.isArray(prev.filterGroups) ? prev.filterGroups : []
        const target = prevGroups.find((group) => group.id === groupId)
        if (!target) {
          return prev
        }

        didApply = true
        const nextFilters = Array.isArray(target.filters)
          ? target.filters.map((filter) => ({ ...filter }))
          : []

        return {
          ...prev,
          filters: nextFilters,
          activeFilterGroupId: groupId
        }
      })

      return didApply
    },
    [updateTransformations]
  )

  const resetActiveFilterGroup = useCallback(() => {
    updateTransformations((prev) => ({
      ...prev,
      filters: [],
      activeFilterGroupId: null
    }))
  }, [updateTransformations])

  const removeFilterGroup = useCallback(
    (groupId) => {
      if (!groupId) return false
      let removed = false
      updateTransformations((prev) => {
        const prevGroups = Array.isArray(prev.filterGroups) ? prev.filterGroups : []
        if (!prevGroups.some((group) => group.id === groupId)) {
          return prev
        }

        removed = true
        const nextGroups = prevGroups.filter((group) => group.id !== groupId)
        const isActiveRemoved = prev.activeFilterGroupId === groupId

        return {
          ...prev,
          filterGroups: nextGroups,
          activeFilterGroupId: isActiveRemoved ? null : prev.activeFilterGroupId,
          filters: isActiveRemoved ? [] : prev.filters
        }
      })

      return removed
    },
    [updateTransformations]
  )

  const value = useMemo(
    () => ({
      filterGroups,
      activeFilterGroupId,
      currentFilters,
      saveFilterGroup,
      applyFilterGroup,
      resetActiveFilterGroup,
      removeFilterGroup
    }),
    [
      filterGroups,
      activeFilterGroupId,
      currentFilters,
      saveFilterGroup,
      applyFilterGroup,
      resetActiveFilterGroup,
      removeFilterGroup
    ]
  )

  return <CsvWorkbenchContext.Provider value={value}>{children}</CsvWorkbenchContext.Provider>
}

CsvWorkbenchProvider.propTypes = {
  transformations: PropTypes.object.isRequired,
  updateTransformations: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
}

export function useCsvWorkbenchContext() {
  const context = useContext(CsvWorkbenchContext)
  if (!context) {
    throw new Error('useCsvWorkbenchContext must be used within a CsvWorkbenchProvider')
  }
  return context
}

export default CsvWorkbenchContext

