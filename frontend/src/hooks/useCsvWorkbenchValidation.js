import { useCallback, useEffect, useState } from 'react'
import { createUniqueId } from '../components/csv/utils'
import { isCellValueEmpty } from '../components/csv/formatting'

/**
 * Hook für Validation Rules im CSV Workbench
 * Verwaltet Validierungsregeln und -ergebnisse
 */
export const useCsvWorkbenchValidation = ({
  columns,
  getImportState,
  transformedRows,
  schedulePersist,
  registerVersionEvent
}) => {
  const [validationRules, setValidationRules] = useState(() => [])
  const [validationComputed, setValidationComputed] = useState({ issues: [], summary: [] })

  const handleAddValidationRule = useCallback(() => {
    const defaultColumn = columns[0]?.key || ''
    const createdAt = Date.now()
    let createdRule = null
    setValidationRules((prev) => {
      const base = Array.isArray(prev) ? [...prev] : []
      createdRule = {
        id: createUniqueId('rule'),
        name: `Regel ${base.length + 1}`,
        column: defaultColumn,
        type: 'required',
        scope: 'raw',
        message: '',
        createdAt,
        updatedAt: createdAt
      }
      base.push(createdRule)
      schedulePersist({ validationRules: base })
      return base
    })
    if (createdRule) {
      registerVersionEvent({
        type: 'validation-rule',
        description: `Validierungsregel „${createdRule.name}" erstellt`,
        meta: { ruleId: createdRule.id }
      })
    }
  }, [columns, schedulePersist, registerVersionEvent])

  const handleUpdateValidationRule = useCallback(
    (ruleId, changes) => {
      if (!ruleId || !changes) {
        return
      }
      setValidationRules((prev) => {
        const base = Array.isArray(prev) ? [...prev] : []
        const index = base.findIndex((rule) => rule.id === ruleId)
        if (index === -1) {
          return prev
        }
        const updated = {
          ...base[index],
          ...changes,
          updatedAt: Date.now()
        }
        base[index] = updated
        schedulePersist({ validationRules: base })
        return base
      })
    },
    [schedulePersist]
  )

  const handleRemoveValidationRule = useCallback(
    (ruleId) => {
      if (!ruleId) {
        return
      }
      setValidationRules((prev) => {
        const base = Array.isArray(prev) ? prev.filter((rule) => rule.id !== ruleId) : []
        schedulePersist({ validationRules: base })
        return base
      })
      registerVersionEvent({
        type: 'validation-rule-delete',
        description: 'Validierungsregel entfernt',
        meta: { ruleId }
      })
    },
    [schedulePersist, registerVersionEvent]
  )

  useEffect(() => {
    if (!Array.isArray(validationRules) || validationRules.length === 0) {
      if (validationComputed.issues.length > 0 || validationComputed.summary.length > 0) {
        setValidationComputed({ issues: [], summary: [] })
      }
      return
    }

    const state = getImportState()
    const rawRows = Array.isArray(state?.rows) ? state.rows : []
    const transformed = Array.isArray(transformedRows) ? transformedRows : []
    const columnSet = new Set(columns.map((column) => column.key))
    const issues = []
    const summaryMap = new Map()

    validationRules.forEach((rule) => {
      if (!rule || !rule.id) {
        return
      }
      const columnKey = typeof rule.column === 'string' ? rule.column : ''
      if (!columnKey || !columnSet.has(columnKey)) {
        return
      }

      const scope = rule.scope === 'transformed' ? 'transformed' : 'raw'
      const sourceRows = scope === 'transformed' ? transformed : rawRows
      if (!Array.isArray(sourceRows) || sourceRows.length === 0) {
        return
      }

      const summaryEntry = summaryMap.get(rule.id) || {
        id: rule.id,
        name: rule.name || 'Regel',
        column: columnKey,
        scope,
        failures: 0,
        total: sourceRows.length
      }

      let evaluator = null
      if (rule.type === 'regex' && rule.pattern) {
        try {
          evaluator = new RegExp(rule.pattern, rule.flags || '')
        } catch (error) {
          issues.push({
            id: `${rule.id}-regex`,
            ruleId: rule.id,
            columnKey,
            scope,
            rowIndex: -1,
            message: `Ungültiges Regex-Muster: ${(error && error.message) || 'Fehler'}`
          })
          summaryEntry.failures += sourceRows.length
          summaryMap.set(rule.id, summaryEntry)
          return
        }
      }

      let customEvaluator = null
      if (rule.type === 'custom' && typeof rule.expression === 'string' && rule.expression.trim()) {
        try {
          customEvaluator = new Function('value', 'row', rule.expression)
        } catch (error) {
          issues.push({
            id: `${rule.id}-custom`,
            ruleId: rule.id,
            columnKey,
            scope,
            rowIndex: -1,
            message: `Ausdruck kann nicht ausgewertet werden: ${(error && error.message) || 'Fehler'}`
          })
          summaryEntry.failures += sourceRows.length
          summaryMap.set(rule.id, summaryEntry)
          return
        }
      }

      const minValue = rule.min !== undefined ? Number(rule.min) : null
      const maxValue = rule.max !== undefined ? Number(rule.max) : null

      sourceRows.forEach((row, rowIndex) => {
        const value = row?.[columnKey]
        let isValid = true
        let message = ''

        switch (rule.type) {
          case 'required':
            isValid = !isCellValueEmpty(value)
            if (!isValid) message = rule.message || 'Pflichtfeld darf nicht leer sein.'
            break
          case 'numberRange': {
            const numeric = Number(value)
            if (!Number.isFinite(numeric)) {
              isValid = false
              message = rule.message || 'Wert muss eine Zahl sein.'
              break
            }
            if (minValue !== null && Number.isFinite(minValue) && numeric < minValue) {
              isValid = false
              message = rule.message || `Wert muss ≥ ${minValue} sein.`
              break
            }
            if (maxValue !== null && Number.isFinite(maxValue) && numeric > maxValue) {
              isValid = false
              message = rule.message || `Wert muss ≤ ${maxValue} sein.`
            }
            break
          }
          case 'regex':
            isValid = evaluator ? evaluator.test(String(value ?? '')) : true
            if (!isValid) {
              message = rule.message || 'Wert erfüllt das Muster nicht.'
            }
            break
          case 'custom':
            if (customEvaluator) {
              try {
                isValid = Boolean(customEvaluator(value, row))
                if (!isValid) {
                  message = rule.message || 'Individuelle Regel verletzt.'
                }
              } catch (error) {
                isValid = false
                message = `Regel konnte nicht berechnet werden: ${(error && error.message) || 'Fehler'}`
              }
            }
            break
          default:
            break
        }

        if (!isValid) {
          summaryEntry.failures += 1
          issues.push({
            id: `${rule.id}-${scope}-${rowIndex}`,
            ruleId: rule.id,
            columnKey,
            scope,
            rowIndex,
            value,
            message
          })
        }
      })

      summaryMap.set(rule.id, summaryEntry)
    })

    const summary = Array.from(summaryMap.values())
    setValidationComputed({ issues, summary })
  }, [validationRules, columns, getImportState, transformedRows])

  return {
    validationRules,
    setValidationRules,
    validationComputed,
    handleAddValidationRule,
    handleUpdateValidationRule,
    handleRemoveValidationRule
  }
}

