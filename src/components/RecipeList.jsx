import { useState } from 'react'
import RecipeCard from './RecipeCard'
import recipesData from '../data/recipes.json'

const CATEGORIES = [
  { id: 'all',     label: '全部' },
  { id: 'curry',   label: '🍛 咖哩・濃湯' },
  { id: 'salad',   label: '🥗 沙拉' },
  { id: 'dessert', label: '🍡 點心・飲品' },
]

const SORT_OPTIONS = [
  { id: 'feasible',    label: '可製作優先' },
  { id: 'name',        label: '名稱' },
  { id: 'level',       label: '等級（高→低）' },
  { id: 'ingredients', label: '食材數量（多→少）' },
  { id: 'energy',      label: '基礎能量（高→低）' },
]

function canMake(recipe, inventory) {
  return Object.entries(recipe.ingredients).every(
    ([id, amount]) => (inventory[id] ?? 0) >= amount
  )
}

function ingTotal(recipe) {
  return Object.values(recipe.ingredients).reduce((s, v) => s + v, 0)
}

export default function RecipeList({
  inventory,
  recipeLevels, setRecipeLevels,
  recipeTargets, setRecipeTargets,
  productionCounts, onCook,
}) {
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('feasible')

  const processed = recipesData
    .filter(r => category === 'all' || r.category === category)
    .map(r => ({
      ...r,
      feasible: canMake(r, inventory),
      level: recipeLevels[r.id] ?? 0,
      target: recipeTargets[r.id] ?? 0,
      productionCount: productionCounts[r.id] ?? 0,
    }))
    .sort((a, b) => {
      if (sortBy === 'feasible') {
        if (a.feasible !== b.feasible) return b.feasible - a.feasible
        return a.name.localeCompare(b.name, 'zh-TW')
      }
      if (sortBy === 'level') {
        if (a.level !== b.level) return b.level - a.level
        return a.name.localeCompare(b.name, 'zh-TW')
      }
      if (sortBy === 'ingredients') {
        const diff = ingTotal(b) - ingTotal(a)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name, 'zh-TW')
      }
      if (sortBy === 'energy') {
        const diff = (b.baseEnergy ?? 0) - (a.baseEnergy ?? 0)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name, 'zh-TW')
      }
      return a.name.localeCompare(b.name, 'zh-TW')
    })

  const feasibleCount = processed.filter(r => r.feasible).length

  return (
    <div className="recipe-list">
      <div className="filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`filter-btn ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="list-controls">
        <span className="feasible-count">
          可製作：<strong>{feasibleCount}</strong> / {processed.length}
        </span>
        <select
          className="sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="recipes-grid">
        {processed.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            inventory={inventory}
            level={recipe.level}
            target={recipe.target}
            productionCount={recipe.productionCount}
            onLevelChange={lv => setRecipeLevels(prev => ({ ...prev, [recipe.id]: lv }))}
            onTargetChange={tg => setRecipeTargets(prev => ({ ...prev, [recipe.id]: tg }))}
            onCook={() => onCook(recipe)}
          />
        ))}
      </div>

      {processed.length === 0 && (
        <div className="empty-state">沒有符合的料理</div>
      )}
    </div>
  )
}
