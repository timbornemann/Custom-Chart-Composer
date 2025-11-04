import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { AVAILABLE_FORMULAS } from '../utils/csv/formulas'

/**
 * Hook für Formula-Handling im CSV Workbench
 * Verwaltet Formula-Eingabe, Suggestions und Application
 */
export const useCsvWorkbenchFormulas = ({
  activeCell,
  visibleColumns,
  topValuesByColumn,
  getDisplayValueForCell,
  setCellFormula,
  clearCellFormula,
  updateCellValue,
  formulaErrors
}) => {
  const [formulaInputValue, setFormulaInputValue] = useState('')
  const [formulaCaretPosition, setFormulaCaretPosition] = useState(null)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [suppressFormulaSuggestions, setSuppressFormulaSuggestions] = useState(false)
  const [isFormulaEditing, setIsFormulaEditing] = useState(false)
  const formulaInputRef = useRef(null)
  const formulaEditingRef = useRef(false)

  const formulaMetadataByName = useMemo(() => {
    const map = new Map()
    AVAILABLE_FORMULAS.forEach((formula) => {
      map.set(formula.name.toUpperCase(), formula)
    })
    return map
  }, [])

  useEffect(() => {
    if (isFormulaEditing) {
      return
    }
    setSuppressFormulaSuggestions(true)
    setFormulaCaretPosition(null)
    setFormulaInputValue(getDisplayValueForCell(activeCell))
  }, [activeCell, getDisplayValueForCell, isFormulaEditing])

  useEffect(() => {
    formulaEditingRef.current = isFormulaEditing
  }, [isFormulaEditing])

  const activeFormulaError = useMemo(() => {
    if (!activeCell) {
      return ''
    }
    const rowKey = String(activeCell.rowIndex)
    return formulaErrors?.[rowKey]?.[activeCell.columnKey] || ''
  }, [activeCell, formulaErrors])

  const formulaSuggestionContext = useMemo(() => {
    if (suppressFormulaSuggestions) {
      return null
    }
    if (typeof formulaInputValue !== 'string') {
      return null
    }
    if (!formulaInputValue.startsWith('=')) {
      return null
    }
    if (!Number.isInteger(formulaCaretPosition)) {
      return null
    }
    const clampedCaret = Math.min(
      Math.max(formulaCaretPosition, 1),
      formulaInputValue.length
    )
    if (clampedCaret < 1) {
      return null
    }
    const query = formulaInputValue.slice(1, clampedCaret)
    if (!/^[A-Za-z]*$/.test(query)) {
      return null
    }
    return {
      query,
      start: 1,
      end: clampedCaret
    }
  }, [formulaInputValue, formulaCaretPosition, suppressFormulaSuggestions])

  const formulaSuggestions = useMemo(() => {
    if (!formulaSuggestionContext) {
      return []
    }
    const normalizedQuery = formulaSuggestionContext.query.toLowerCase()
    return AVAILABLE_FORMULAS.filter((formula) =>
      formula.name.toLowerCase().startsWith(normalizedQuery)
    )
  }, [formulaSuggestionContext])

  const valueSuggestions = useMemo(() => {
    if (!isFormulaEditing || typeof formulaInputValue !== 'string') {
      return []
    }
    if (formulaInputValue.trim().startsWith('=')) {
      return []
    }
    if (!activeCell || !activeCell.columnKey) {
      return []
    }
    const candidates = topValuesByColumn.get(activeCell.columnKey) || []
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return []
    }
    const normalizedQuery = formulaInputValue.trim().toLowerCase()
    const filtered = normalizedQuery
      ? candidates.filter((value) => String(value).toLowerCase().includes(normalizedQuery))
      : candidates
    return Array.from(new Set(filtered)).slice(0, 8)
  }, [isFormulaEditing, formulaInputValue, activeCell, topValuesByColumn])

  const suggestionDataset = useMemo(() => {
    if (
      formulaSuggestionContext &&
      Array.isArray(formulaSuggestions) &&
      formulaSuggestions.length > 0 &&
      !suppressFormulaSuggestions
    ) {
      return { type: 'formula', items: formulaSuggestions }
    }
    if (Array.isArray(valueSuggestions) && valueSuggestions.length > 0 && !suppressFormulaSuggestions) {
      return {
        type: 'value',
        items: valueSuggestions.map((value) => ({ label: String(value), value }))
      }
    }
    return { type: 'none', items: [] }
  }, [formulaSuggestionContext, formulaSuggestions, valueSuggestions, suppressFormulaSuggestions])

  const suggestionsOpen = suggestionDataset.type !== 'none' && suggestionDataset.items.length > 0

  useEffect(() => {
    if (!suggestionsOpen) {
      setActiveSuggestionIndex(0)
      return
    }
    setActiveSuggestionIndex((previous) => {
      if (previous < 0 || previous >= suggestionDataset.items.length) {
        return 0
      }
      return previous
    })
  }, [suggestionsOpen, suggestionDataset.items.length])

  const highlightedSuggestionIndex = suggestionsOpen
    ? Math.min(activeSuggestionIndex, suggestionDataset.items.length - 1)
    : -1

  const activeSuggestion =
    highlightedSuggestionIndex >= 0 ? suggestionDataset.items[highlightedSuggestionIndex] : null

  const typedFunctionName = useMemo(() => {
    if (typeof formulaInputValue !== 'string') {
      return ''
    }
    const trimmed = formulaInputValue.trim()
    if (!trimmed.startsWith('=')) {
      return ''
    }
    const match = trimmed.slice(1).match(/^([A-Za-z_][A-Za-z0-9_]*)/)
    if (!match) {
      return ''
    }
    return match[1].toUpperCase()
  }, [formulaInputValue])

  const currentFormulaHelp = useMemo(() => {
    if (suggestionDataset.type === 'formula' && activeSuggestion) {
      return activeSuggestion
    }
    if (!typedFunctionName) {
      return null
    }
    return formulaMetadataByName.get(typedFunctionName) || null
  }, [suggestionDataset.type, activeSuggestion, typedFunctionName, formulaMetadataByName])

  const hasActiveCell = Boolean(activeCell)

  const handleFormulaSelectionChange = useCallback((event) => {
    const target = event?.target
    if (!target) {
      return
    }
    const position =
      typeof target.selectionStart === 'number'
        ? target.selectionStart
        : target.value?.length ?? 0
    setFormulaCaretPosition(position)
  }, [])

  const applySuggestion = useCallback(
    (suggestion) => {
      if (!suggestion) {
        return
      }
      if (suggestionDataset.type === 'formula') {
        let nextCursorPosition = null
        setFormulaInputValue((previous) => {
          const baseText = typeof previous === 'string' ? previous : ''
          const ensuredBase = baseText.startsWith('=') ? baseText : `=${baseText}`
          const context = formulaSuggestionContext || { start: 1, end: 1 }
          const safeStart = Math.max(1, Math.min(context.start, ensuredBase.length))
          const safeEnd = Math.max(safeStart, Math.min(context.end, ensuredBase.length))
          const before = ensuredBase.slice(0, safeStart)
          const after = ensuredBase.slice(safeEnd)
          const insertion = `${suggestion.name}()`
          nextCursorPosition = before.length + suggestion.name.length + 1
          const schedule =
            typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
              ? window.requestAnimationFrame
              : (callback) => setTimeout(callback, 0)
          schedule(() => {
            if (formulaInputRef.current) {
              formulaInputRef.current.focus()
              formulaInputRef.current.setSelectionRange(nextCursorPosition, nextCursorPosition)
            }
          })
          return `${before}${insertion}${after}`
        })
        if (nextCursorPosition !== null) {
          setFormulaCaretPosition(nextCursorPosition)
        }
        setSuppressFormulaSuggestions(true)
        setActiveSuggestionIndex(0)
        formulaEditingRef.current = true
        setIsFormulaEditing(true)
      } else if (suggestionDataset.type === 'value') {
        const valueText = suggestion.value === null || suggestion.value === undefined ? '' : String(suggestion.value)
        setFormulaInputValue(valueText)
        setSuppressFormulaSuggestions(true)
        setActiveSuggestionIndex(0)
        setTimeout(() => {
          setSuppressFormulaSuggestions(false)
        }, 0)
      }
    },
    [
      suggestionDataset.type,
      formulaSuggestionContext,
      formulaInputRef,
      setFormulaInputValue,
      setSuppressFormulaSuggestions,
      setActiveSuggestionIndex,
      setFormulaCaretPosition,
      setIsFormulaEditing
    ]
  )

  const handleFormulaInputChange = useCallback((event) => {
    const { value, selectionStart } = event.target
    setSuppressFormulaSuggestions(false)
    setFormulaInputValue(value)
    if (typeof selectionStart === 'number') {
      setFormulaCaretPosition(selectionStart)
    } else {
      setFormulaCaretPosition(value.length)
    }
  }, [])

  const handleFormulaFocus = useCallback((event) => {
    formulaEditingRef.current = true
    setIsFormulaEditing(true)
    setSuppressFormulaSuggestions(false)
    if (event?.target) {
      const position =
        typeof event.target.selectionStart === 'number'
          ? event.target.selectionStart
          : event.target.value?.length ?? 0
      setFormulaCaretPosition(position)
    }
  }, [])

  const handleFormulaCancel = useCallback(() => {
    formulaEditingRef.current = false
    setIsFormulaEditing(false)
    setSuppressFormulaSuggestions(true)
    setFormulaCaretPosition(null)
    setFormulaInputValue(getDisplayValueForCell(activeCell))
    if (formulaInputRef.current) {
      formulaInputRef.current.blur()
    }
  }, [activeCell, getDisplayValueForCell])

  const applyFormulaInput = useCallback(() => {
    if (!activeCell) {
      return
    }
    const rawValue = formulaInputValue ?? ''
    const textValue = typeof rawValue === 'string' ? rawValue : String(rawValue)
    const trimmed = textValue.trim()
    const columnInfo =
      Number.isInteger(activeCell.columnIndex) && activeCell.columnIndex >= 0
        ? visibleColumns[activeCell.columnIndex]
        : null

    if (trimmed.startsWith('=')) {
      setCellFormula(activeCell.rowIndex, activeCell.columnKey, trimmed)
    } else {
      clearCellFormula(activeCell.rowIndex, activeCell.columnKey)
      let valueToSet = textValue
      if (columnInfo?.type === 'number') {
        if (trimmed === '') {
          valueToSet = ''
        } else {
          const numeric = Number(trimmed.replace(',', '.'))
          valueToSet = Number.isNaN(numeric) ? textValue : numeric
        }
      }
      updateCellValue(activeCell.rowIndex, activeCell.columnKey, valueToSet)
    }
    formulaEditingRef.current = false
    setIsFormulaEditing(false)
    setSuppressFormulaSuggestions(true)
    setFormulaCaretPosition(null)
  }, [activeCell, formulaInputValue, visibleColumns, setCellFormula, clearCellFormula, updateCellValue])

  const handleFormulaBlur = useCallback(() => {
    if (!formulaEditingRef.current) {
      return
    }
    setSuppressFormulaSuggestions(true)
    applyFormulaInput()
  }, [applyFormulaInput])

  const handleFormulaKeyDown = useCallback(
    (event) => {
        if (suggestionsOpen && suggestionDataset.items.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setActiveSuggestionIndex((previous) => {
              if (suggestionDataset.items.length === 0) {
              return 0
            }
            const nextIndex = previous + 1
              return nextIndex >= suggestionDataset.items.length ? 0 : nextIndex
          })
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setActiveSuggestionIndex((previous) => {
              if (suggestionDataset.items.length === 0) {
              return 0
            }
            const nextIndex = previous - 1
              return nextIndex < 0 ? suggestionDataset.items.length - 1 : nextIndex
          })
          return
        }
        if (event.key === 'Enter') {
          event.preventDefault()
            const suggestion =
              (highlightedSuggestionIndex >= 0
                ? suggestionDataset.items[highlightedSuggestionIndex]
                : suggestionDataset.items[0]) || null
            applySuggestion(suggestion)
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          setSuppressFormulaSuggestions(true)
          return
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        applyFormulaInput()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleFormulaCancel()
      }
    },
    [
      applyFormulaInput,
        applySuggestion,
        suggestionDataset.items,
      handleFormulaCancel,
      highlightedSuggestionIndex,
      suggestionsOpen
    ]
  )

  return {
    formulaInputValue,
    setFormulaInputValue,
    formulaCaretPosition,
    setFormulaCaretPosition,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    suppressFormulaSuggestions,
    setSuppressFormulaSuggestions,
    isFormulaEditing,
    setIsFormulaEditing,
    formulaInputRef,
    formulaEditingRef,
    formulaMetadataByName,
    activeFormulaError,
    formulaSuggestionContext,
    formulaSuggestions,
    valueSuggestions,
    suggestionDataset,
    suggestionsOpen,
    highlightedSuggestionIndex,
    activeSuggestion,
    typedFunctionName,
    currentFormulaHelp,
    hasActiveCell,
    handleFormulaSelectionChange,
    applySuggestion,
    handleFormulaInputChange,
    handleFormulaFocus,
    handleFormulaCancel,
    applyFormulaInput,
    handleFormulaBlur,
    handleFormulaKeyDown
  }
}

