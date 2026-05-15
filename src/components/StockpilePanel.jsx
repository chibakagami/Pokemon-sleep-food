import { useState } from 'react'
import ingredientsData from '../data/ingredients.json'
import recipesData from '../data/recipes.json'

const ingMap = Object.fromEntries(ingredientsData.map(i => [i.id, i]))
const recipeMap = Object.fromEntries(recipesData.map(r => [r.id, r]))

function IngBar({ name, required, have }) {
  const ratio = required === 0 ? 1 : Math.min(1, have / required)
  const ok = have >= required
  return (
    <div className="sp-ing-row">
      <span className="sp-ing-name">{name}</span>
      <div className="sp-bar-wrap">
        <div className={`sp-bar-fill ${ok ? 'ok' : 'lacking'}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
      <span className={`sp-ing-count ${ok ? 'ok' : 'lacking'}`}>
        {have}/{required}
        {!ok && <span className="sp-diff"> 差{required - have}</span>}
      </span>
    </div>
  )
}

export default function StockpilePanel({ stockpileList, setStockpileList, inventory }) {
  const [expanded, setExpanded] = useState(true)

  if (stockpileList.length === 0) return null

  const updateMeals = (recipeId, meals) => {
    setStockpileList(prev => prev.map(s => s.recipeId === recipeId ? { ...s, meals } : s))
  }

  const remove = (recipeId) => {
    setStockpileList(prev => prev.filter(s => s.recipeId !== recipeId))
  }

  const allMet = stockpileList.every(({ recipeId, meals }) => {
    const recipe = recipeMap[recipeId]
    if (!recipe) return true
    return Object.entries(recipe.ingredients).every(([id, req]) => (inventory[id] ?? 0) >= req * meals)
  })

  return (
    <div className={`stockpile-panel ${allMet ? 'all-met' : ''}`}>
      {allMet && (
        <div className="sp-complete-banner">
          🎉 本週備料全部完成！
        </div>
      )}

      <button className="sp-toggle" onClick={() => setExpanded(v => !v)}>
        <span>囤積目標</span>
        <span className="sp-count-badge">{stockpileList.length}</span>
        <span className="sp-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="sp-body">
          {stockpileList.map(({ recipeId, meals }) => {
            const recipe = recipeMap[recipeId]
            if (!recipe) return null

            const allIngMet = Object.entries(recipe.ingredients).every(
              ([id, req]) => (inventory[id] ?? 0) >= req * meals
            )

            return (
              <div key={recipeId} className="sp-recipe-block">
                <div className="sp-recipe-header">
                  <span className="sp-recipe-name">{recipe.name}</span>
                  <div className="sp-recipe-ctrl">
                    <span className="sp-meals-label">目標餐數</span>
                    <select
                      className="sp-meals-select"
                      value={meals}
                      onChange={e => updateMeals(recipeId, parseInt(e.target.value, 10))}
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n} 餐</option>
                      ))}
                    </select>
                    <button className="sp-remove" onClick={() => remove(recipeId)}>✕</button>
                  </div>
                </div>
                <div className="sp-ings">
                  {Object.entries(recipe.ingredients).map(([id, req]) => {
                    const ing = ingMap[id]
                    return (
                      <IngBar key={id} name={ing?.name ?? id} required={req * meals} have={inventory[id] ?? 0} />
                    )
                  })}
                </div>
                <div className={`sp-status ${allIngMet ? 'met' : 'unmet'}`}>
                  {allIngMet ? '✅ 全部達標' : '❌ 食材不足'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
