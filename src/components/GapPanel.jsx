import { useState } from 'react'
import ingredientsData from '../data/ingredients.json'
import recipesData from '../data/recipes.json'

const ingMap = Object.fromEntries(ingredientsData.map(i => [i.id, i]))
const CATEGORY_LABEL = { curry: '🍛 咖哩・濃湯', salad: '🥗 沙拉', dessert: '🍡 點心・飲品' }
const CATEGORIES = ['curry', 'salad', 'dessert']

function ingTotal(recipe) {
  return Object.values(recipe.ingredients).reduce((s, v) => s + v, 0)
}

function getMissing(recipe, inventory) {
  return Object.entries(recipe.ingredients)
    .filter(([id, req]) => (inventory[id] ?? 0) < req)
    .map(([id, req]) => ({ id, req, have: inventory[id] ?? 0, short: req - (inventory[id] ?? 0) }))
}

function RecipeGapRow({ recipe, inventory }) {
  const missing = getMissing(recipe, inventory)
  return (
    <div className="gap-recipe-row">
      <span className="gap-recipe-name">{recipe.name}</span>
      <div className="gap-ings">
        {missing.map(({ id, req, have, short }) => {
          const ing = ingMap[id]
          return (
            <span key={id} className="gap-ing-chip">
              {ing?.emoji}
              <span className="gap-ing-short">-{short}</span>
              <span className="gap-ing-ratio">（{have}/{req}）</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function CategoryBlock({ label, recipes, inventory }) {
  if (recipes.length === 0) return null
  return (
    <div className="gap-category-block">
      <div className="gap-category-label">{label}</div>
      {recipes.map(r => <RecipeGapRow key={r.id} recipe={r} inventory={inventory} />)}
    </div>
  )
}

export default function GapPanel({ inventory, potConfig, isSunday }) {
  const [showAll, setShowAll] = useState(false)
  const currentPot = isSunday ? potConfig.sunday : potConfig.weekday

  const infeasible = recipesData.filter(r => {
    if (ingTotal(r) > currentPot) return false
    return getMissing(r, inventory).length > 0
  })

  const almostThere = infeasible.filter(r => getMissing(r, inventory).length <= 2)
  const needMore = infeasible.filter(r => getMissing(r, inventory).length > 2)

  if (infeasible.length === 0) {
    return (
      <div className="gap-panel">
        <div className="gap-all-clear">🎉 目前食材可製作所有鍋子容量內的料理！</div>
      </div>
    )
  }

  return (
    <div className="gap-panel">
      {almostThere.length > 0 && (
        <div className="gap-section">
          <div className="gap-section-title">🔥 差一點（缺 1–2 種）</div>
          {CATEGORIES.map(cat => (
            <CategoryBlock
              key={cat}
              label={CATEGORY_LABEL[cat]}
              recipes={almostThere.filter(r => r.category === cat)}
              inventory={inventory}
            />
          ))}
        </div>
      )}

      {needMore.length > 0 && (
        <div className="gap-section">
          <div className="gap-section-title">📋 全部缺口（缺 3 種以上）</div>
          {CATEGORIES.map(cat => (
            <CategoryBlock
              key={cat}
              label={CATEGORY_LABEL[cat]}
              recipes={needMore.filter(r => r.category === cat)}
              inventory={inventory}
            />
          ))}
        </div>
      )}
    </div>
  )
}
