import { useState } from 'react'
import RecipeCard from './RecipeCard'
import StockpilePanel from './StockpilePanel'
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
  potConfig,
  isSunday, setIsSunday,
  stockpileList, setStockpileList,
}) {
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('feasible')

  const currentPot = isSunday ? potConfig.sunday : potConfig.weekday

  const processed = recipesData
    .filter(r => category === 'all' || r.category === category)
    .map(r => {
      const total = ingTotal(r)
      const feasible = canMake(r, inventory) && total <= currentPot
      const sundayOnly = total > potConfig.weekday && total <= potConfig.sunday
      const tooBig = total > potConfig.sunday
      return {
        ...r,
        feasible,
        sundayOnly,
        tooBig,
        ingTotal: total,
        potRemain: currentPot - total,
        level: recipeLevels[r.id] ?? 0,
        target: recipeTargets[r.id] ?? 0,
        productionCount: productionCounts[r.id] ?? 0,
      }
    })
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
        const diff = b.ingTotal - a.ingTotal
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

  const toggleStockpile = (recipeId) => {
    setStockpileList(prev => {
      const exists = prev.find(s => s.recipeId === recipeId)
      if (exists) return prev.filter(s => s.recipeId !== recipeId)
      return [...prev, { recipeId, meals: 3 }]
    })
  }

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
        <div className="list-controls-right">
          <button
            className={`sunday-toggle ${isSunday ? 'active' : ''}`}
            onClick={() => setIsSunday(v => !v)}
          >
            🌞 週日
          </button>
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
      </div>

      <div className="pot-info-bar">
        鍋子容量：<strong>{currentPot}</strong>
        {isSunday && <span className="sunday-badge">🌞 週日模式</span>}
      </div>

      <StockpilePanel
        stockpileList={stockpileList}
        setStockpileList={setStockpileList}
        inventory={inventory}
      />

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
            onCook={(extras) => onCook(recipe, extras)}
            currentPot={currentPot}
            inStockpile={!!stockpileList.find(s => s.recipeId === recipe.id)}
            onToggleStockpile={() => toggleStockpile(recipe.id)}
          />
        ))}
      </div>

      {processed.length === 0 && (
        <div className="empty-state">沒有符合的料理</div>
      )}
    </div>
  )
}
