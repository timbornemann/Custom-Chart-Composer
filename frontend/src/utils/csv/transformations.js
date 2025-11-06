export const TRANSFORMATION_STAGE_KEYS = ['valueRules', 'filters', 'grouping', 'pivot', 'unpivot']

export const createDefaultPipeline = () => [...TRANSFORMATION_STAGE_KEYS]

export const ensurePipelineIntegrity = (order) => {
  const base = Array.isArray(order) ? order.filter((key) => TRANSFORMATION_STAGE_KEYS.includes(key)) : []
  const seen = new Set(base)
  const result = [...base]
  TRANSFORMATION_STAGE_KEYS.forEach((key) => {
    if (!seen.has(key)) {
      result.push(key)
      seen.add(key)
    }
  })
  return result
}

export const createDefaultStageStates = () =>
  TRANSFORMATION_STAGE_KEYS.reduce((acc, key) => {
    acc[key] = { enabled: true }
    return acc
  }, {})

