import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { createSearchConfig, rowMatchesQuery } from './useDataImport'
import { formatCellValue } from '../components/csv/formatting'

/**
 * Hook für Search-Funktionalität im CSV Workbench
 * Verwaltet Search Query, Matches, Navigation und Find & Replace
 */
export const useCsvWorkbenchSearch = ({
  searchQuery,
  searchMode,
  searchColumns,
  previewEntries,
  transformedPreviewEntries,
  visibleColumns,
  columns,
  transformedRows,
  canReplaceInTransformed,
  getImportState,
  updateCell
}) => {
  const [activeSearchMatchIndex, setActiveSearchMatchIndex] = useState(-1)
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false)
  const [findReplaceData, setFindReplaceData] = useState({
    raw: { matches: [], total: 0 },
    transformed: { matches: [], total: 0 }
  })
  const [findReplaceDefaultScope, setFindReplaceDefaultScope] = useState('raw')
  const searchMatchSignatureRef = useRef('')
  const findReplaceHistoryRef = useRef([])

  const activeSearchConfig = useMemo(
    () => createSearchConfig({ query: searchQuery, mode: searchMode, columns: searchColumns }),
    [searchQuery, searchMode, searchColumns]
  )

  const canOpenFindReplace = activeSearchConfig?.isActive && previewEntries.length > 0

  const computeMatchesForRows = useCallback(
    (rowsSource, scopeLabel) => {
      if (!activeSearchConfig?.isActive || !Array.isArray(rowsSource)) {
        return { matches: [], total: 0 }
      }
      const columnKeys = new Set(columns.map((column) => column.key))
      const columnOrder = new Map()
      columns.forEach((column, index) => {
        columnOrder.set(column.key, index)
      })
      const matches = []
      rowsSource.forEach((row, rowIndex) => {
        if (!row) return
        const result = rowMatchesQuery(row, activeSearchConfig)
        const entries = Object.entries(result.matchesByColumn || {})
        entries.forEach(([columnKey, positions]) => {
          if (!columnKeys.has(columnKey)) return
          if (!Array.isArray(positions) || positions.length === 0) return
          const rawValue = row[columnKey]
          const formattedRaw = formatCellValue(rawValue)
          const formattedValue =
            formattedRaw === null || formattedRaw === undefined
              ? ''
              : typeof formattedRaw === 'string'
                ? formattedRaw
                : String(formattedRaw)
          matches.push({
            scope: scopeLabel,
            rowIndex,
            columnKey,
            positions,
            formattedValue,
            rawValue
          })
        })
      })
      matches.sort((a, b) => {
        if (a.rowIndex !== b.rowIndex) {
          return a.rowIndex - b.rowIndex
        }
        const orderA = columnOrder.has(a.columnKey) ? columnOrder.get(a.columnKey) : Number.MAX_SAFE_INTEGER
        const orderB = columnOrder.has(b.columnKey) ? columnOrder.get(b.columnKey) : Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a.columnKey.localeCompare(b.columnKey, undefined, { sensitivity: 'base' })
      })
      const total = matches.reduce((sum, entry) => sum + (entry.positions?.length || 0), 0)
      return { matches, total }
    },
    [activeSearchConfig, columns, rowMatchesQuery]
  )

  useEffect(() => {
    if (!isFindReplaceOpen) {
      return
    }

    if (!activeSearchConfig?.isActive) {
      setFindReplaceData({ raw: { matches: [], total: 0 }, transformed: { matches: [], total: 0 } })
      return
    }

    const state = getImportState()
    const rawRows = Array.isArray(state?.rows) ? state.rows : []
    const rawResult = computeMatchesForRows(rawRows, 'raw')
    const transformedResult = canReplaceInTransformed
      ? computeMatchesForRows(transformedRows || [], 'transformed')
      : { matches: [], total: 0 }
    setFindReplaceData({ raw: rawResult, transformed: transformedResult })
  }, [
    isFindReplaceOpen,
    activeSearchConfig,
    getImportState,
    computeMatchesForRows,
    canReplaceInTransformed,
    transformedRows
  ])

  const searchMatches = useMemo(() => {
    if (!activeSearchConfig?.isActive) {
      return []
    }
    const columnOrder = new Map()
    visibleColumns.forEach((column, index) => {
      columnOrder.set(column.key, index)
    })
    const collectMatches = (entries, scope) => {
      if (!Array.isArray(entries) || entries.length === 0) {
        return []
      }
      const result = []
      entries.forEach((entry, rowPosition) => {
        const matchInfo = entry?.matchInfo || null
        if (!matchInfo) {
          return
        }
        Object.entries(matchInfo).forEach(([columnKey, positions]) => {
          if (!Array.isArray(positions) || positions.length === 0) {
            return
          }
          result.push({
            scope,
            rowIndex: entry.index,
            rowPosition,
            columnKey,
            positions,
            rowRefKey: `${scope}-${entry.index}`
          })
        })
      })
      return result
    }
    const rawMatches = collectMatches(previewEntries, 'raw')
    const transformedMatches = collectMatches(transformedPreviewEntries, 'transformed')
    const combined = [...rawMatches, ...transformedMatches]
    combined.sort((a, b) => {
      if (a.scope !== b.scope) {
        if (a.scope === 'raw') return -1
        if (b.scope === 'raw') return 1
        return a.scope.localeCompare(b.scope)
      }
      if (a.rowIndex !== b.rowIndex) {
        return a.rowIndex - b.rowIndex
      }
      const orderA = columnOrder.has(a.columnKey) ? columnOrder.get(a.columnKey) : Number.MAX_SAFE_INTEGER
      const orderB = columnOrder.has(b.columnKey) ? columnOrder.get(b.columnKey) : Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return a.columnKey.localeCompare(b.columnKey, undefined, { sensitivity: 'base' })
    })
    return combined
  }, [activeSearchConfig, previewEntries, transformedPreviewEntries, visibleColumns])

  const activeSearchMatch = activeSearchMatchIndex >= 0 ? searchMatches[activeSearchMatchIndex] : null
  const hasSearchMatches = searchMatches.length > 0
  const searchMatchSummary = hasSearchMatches && activeSearchMatchIndex >= 0
    ? `${activeSearchMatchIndex + 1}/${searchMatches.length}`
    : `0/${searchMatches.length}`

  useEffect(() => {
    if (!activeSearchConfig?.isActive) {
      searchMatchSignatureRef.current = ''
      setActiveSearchMatchIndex(-1)
      return
    }
    const columnsKey = Array.isArray(activeSearchConfig.columns) && activeSearchConfig.columns.length > 0
      ? activeSearchConfig.columns.join('|')
      : 'ALL'
    const signature = `${activeSearchConfig.mode || 'normal'}|${activeSearchConfig.query || ''}|${columnsKey}`
    if (signature !== searchMatchSignatureRef.current) {
      searchMatchSignatureRef.current = signature
      setActiveSearchMatchIndex(searchMatches.length > 0 ? 0 : -1)
      return
    }
    if (searchMatches.length === 0) {
      setActiveSearchMatchIndex(-1)
      return
    }
    setActiveSearchMatchIndex((previous) => {
      if (previous >= 0 && previous < searchMatches.length) {
        return previous
      }
      return 0
    })
  }, [activeSearchConfig, searchMatches.length])

  const handleSearchMatchNavigate = useCallback(
    (direction) => {
      if (!Array.isArray(searchMatches) || searchMatches.length === 0) {
        return
      }
      setActiveSearchMatchIndex((previous) => {
        if (previous === -1) {
          return direction >= 0 ? 0 : searchMatches.length - 1
        }
        const next = (previous + direction + searchMatches.length) % searchMatches.length
        return next
      })
    },
    [searchMatches]
  )

  const handleModalMatchFocus = useCallback(
    (match) => {
      if (!match) {
        return
      }
      const index = searchMatches.findIndex(
        (candidate) =>
          candidate.scope === match.scope &&
          candidate.rowIndex === match.rowIndex &&
          candidate.columnKey === match.columnKey
      )
      if (index >= 0) {
        setActiveSearchMatchIndex(index)
      }
    },
    [searchMatches]
  )

  const handleOpenFindReplace = useCallback(() => {
    if (!canOpenFindReplace) {
      return
    }
    const scope =
      activeSearchMatch?.scope === 'transformed' && canReplaceInTransformed ? 'transformed' : 'raw'
    setFindReplaceDefaultScope(scope)
    setIsFindReplaceOpen(true)
  }, [canOpenFindReplace, activeSearchMatch, canReplaceInTransformed])

  return {
    activeSearchConfig,
    canOpenFindReplace,
    searchMatches,
    activeSearchMatch,
    hasSearchMatches,
    searchMatchSummary,
    activeSearchMatchIndex,
    setActiveSearchMatchIndex,
    handleSearchMatchNavigate,
    isFindReplaceOpen,
    setIsFindReplaceOpen,
    findReplaceData,
    setFindReplaceData,
    findReplaceDefaultScope,
    setFindReplaceDefaultScope,
    findReplaceHistoryRef,
    handleModalMatchFocus,
    handleOpenFindReplace,
    computeMatchesForRows
  }
}

