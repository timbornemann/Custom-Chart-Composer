export const FILTER_NODE_TYPES = {
  GROUP: 'group',
  CONDITION: 'condition'
}

const ensureBoolean = (value, fallback = true) => (value === false ? false : fallback)

export const createFilterGroup = ({ id = 'group-root', operator = 'all', enabled = true, children = [] } = {}) => ({
  id,
  type: FILTER_NODE_TYPES.GROUP,
  operator,
  enabled: ensureBoolean(enabled),
  children: Array.isArray(children) ? children : []
})

export const createFilterCondition = ({
  id,
  column = '',
  operator = 'equalsText',
  value = '',
  minValue = '',
  maxValue = '',
  flags = '',
  enabled = true
} = {}) => ({
  id,
  type: FILTER_NODE_TYPES.CONDITION,
  column,
  operator,
  value,
  minValue,
  maxValue,
  flags,
  enabled: ensureBoolean(enabled)
})

export const isGroupNode = (node) => node?.type === FILTER_NODE_TYPES.GROUP

const cloneNode = (node) => {
  if (!node || typeof node !== 'object') {
    return node
  }
  if (isGroupNode(node)) {
    return {
      ...node,
      children: Array.isArray(node.children) ? node.children.map((child) => cloneNode(child)) : []
    }
  }
  return { ...node }
}

const ensureConditionNode = (node, fallbackId) => {
  if (!node || typeof node !== 'object') {
    return createFilterCondition({ id: fallbackId })
  }
  if (isGroupNode(node)) {
    return node
  }
  return {
    ...createFilterCondition({ id: node.id || fallbackId }),
    ...node,
    type: FILTER_NODE_TYPES.CONDITION,
    enabled: ensureBoolean(node.enabled)
  }
}

const legacyListToTree = (legacyFilters) => {
  if (!Array.isArray(legacyFilters) || legacyFilters.length === 0) {
    return createFilterGroup()
  }

  const convertCondition = (entry, index) =>
    ensureConditionNode(
      {
        ...entry,
        id: entry?.id || `legacy-filter-${index}`
      },
      `legacy-filter-${index}`
    )

  let expression = convertCondition(legacyFilters[0], 0)

  for (let index = 1; index < legacyFilters.length; index += 1) {
    const filter = convertCondition(legacyFilters[index], index)
    const logicOperator = (legacyFilters[index].logicOperator || 'and').toLowerCase()

    if (logicOperator === 'or') {
      if (isGroupNode(expression) && expression.operator === 'any') {
        expression = {
          ...expression,
          children: [...expression.children, filter]
        }
      } else {
        expression = createFilterGroup({
          id: `legacy-group-${index}`,
          operator: 'any',
          children: [cloneNode(expression), filter]
        })
      }
    } else {
      if (isGroupNode(expression) && expression.operator === 'all') {
        expression = {
          ...expression,
          children: [...expression.children, filter]
        }
      } else {
        expression = createFilterGroup({
          id: `legacy-group-${index}`,
          operator: 'all',
          children: [cloneNode(expression), filter]
        })
      }
    }
  }

  if (isGroupNode(expression)) {
    return expression
  }

  return createFilterGroup({ children: [expression] })
}

const ensureTreeShape = (node, { defaultId = 'group-root', isRoot = false } = {}) => {
  if (!node || typeof node !== 'object') {
    return createFilterGroup({ id: defaultId })
  }
  if (!node.id && isRoot) {
    node.id = defaultId
  }
  if (isGroupNode(node)) {
    const children = Array.isArray(node.children) ? node.children : []
    return {
      ...createFilterGroup({
        id: node.id || defaultId,
        operator: node.operator || 'all',
        enabled: ensureBoolean(node.enabled)
      }),
      children: children.map((child, index) =>
        ensureTreeShape(child, { defaultId: `${node.id || defaultId}-${index}` })
      )
    }
  }
  return ensureConditionNode(node, defaultId)
}

export const normalizeFilterTree = (rawFilters) => {
  if (Array.isArray(rawFilters)) {
    return legacyListToTree(rawFilters)
  }
  if (!rawFilters || typeof rawFilters !== 'object') {
    return createFilterGroup({ id: 'group-root' })
  }
  const tree = ensureTreeShape(rawFilters, { defaultId: rawFilters.id || 'group-root', isRoot: true })
  if (!isGroupNode(tree)) {
    return createFilterGroup({ id: 'group-root', children: [tree] })
  }
  return tree
}

export const addNodeToGroup = (tree, groupId, node) => {
  if (!tree || !groupId || !node) {
    return tree
  }
  const targetNode = normalizeFilterTree(tree)

  const visit = (current) => {
    if (!isGroupNode(current)) {
      return current
    }
    if (current.id === groupId) {
      return {
        ...current,
        children: [...current.children, cloneNode(node)]
      }
    }
    let changed = false
    const nextChildren = current.children.map((child) => {
      const updated = visit(child)
      if (updated !== child) {
        changed = true
      }
      return updated
    })
    if (!changed) {
      return current
    }
    return {
      ...current,
      children: nextChildren
    }
  }

  return visit(targetNode)
}

export const updateNodeInTree = (tree, nodeId, updater) => {
  if (!tree || !nodeId || typeof updater !== 'function') {
    return tree
  }
  const visit = (current) => {
    if (!current || typeof current !== 'object') {
      return current
    }
    if (current.id === nodeId) {
      return updater(current)
    }
    if (!isGroupNode(current)) {
      return current
    }
    let changed = false
    const nextChildren = current.children.map((child) => {
      const updated = visit(child)
      if (updated !== child) {
        changed = true
      }
      return updated
    })
    if (!changed) {
      return current
    }
    return {
      ...current,
      children: nextChildren
    }
  }

  return visit(tree)
}

export const removeNodeFromTree = (tree, nodeId) => {
  if (!tree || !nodeId) {
    return tree
  }
  if (tree.id === nodeId) {
    return tree
  }
  const visit = (current) => {
    if (!isGroupNode(current)) {
      return current
    }
    let changed = false
    const nextChildren = []
    current.children.forEach((child) => {
      if (child.id === nodeId) {
        changed = true
        return
      }
      const updated = visit(child)
      if (updated !== child) {
        changed = true
      }
      nextChildren.push(updated)
    })
    if (!changed) {
      return current
    }
    return {
      ...current,
      children: nextChildren
    }
  }

  return visit(tree)
}

export const traverseFilterTree = (tree, callback) => {
  if (!tree || typeof callback !== 'function') {
    return
  }
  const visit = (node, parent = null) => {
    if (!node || typeof node !== 'object') {
      return
    }
    callback(node, parent)
    if (isGroupNode(node) && Array.isArray(node.children)) {
      node.children.forEach((child) => visit(child, node))
    }
  }
  visit(tree, null)
}

export const countActiveConditions = (tree) => {
  let count = 0
  traverseFilterTree(tree, (node) => {
    if (node.type === FILTER_NODE_TYPES.CONDITION && node.enabled !== false && node.column) {
      count += 1
    }
  })
  return count
}

export const hasActiveFilterConditions = (tree) => countActiveConditions(tree) > 0

export const cloneFilterTree = (tree) => cloneNode(tree)

