import { useState } from 'react'
import RecipeCard from './RecipeCard'
import StockpilePanel from './StockpilePanel'
import recipesData from '../data/recipes.json'

const CATEGORIES = [
  { id: 'curry',   label: '咖哩・濃湯', icon: '/Pokemon-sleep-food/cat-curry.webp' },
  { id: 'salad',   label: '沙拉',       icon: '/Pokemon-sleep-food/cat-salad.webp' },
  { id: 'dessert', label: '點心・飲品', icon: '/Pokemon-sleep-food/cat-dessert.webp' },
]

const SORT_OPTIONS = [
  { id: 'level',       label: '等級' },
  { id: 'ingredients', label: '食材數量' },
  { id: 'energy',      label: '基礎能量' },
  { id: 'feasible',    label: '可製作' },
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
  const [category, setCategory] = useState('curry')
  const [sortKey, setSortKey] = useState('level')
  const [sortDir, setSortDir] = useState('desc')

  const currentPot = isSunday ? potConfig.sunday : potConfig.weekday

  const processed = recipesData
    .filter(r => r.category === category)
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
      const d = sortDir === 'desc' ? 1 : -1
      let diff = 0
      if (sortKey === 'level')       diff = (b.level - a.level) * d
      else if (sortKey === 'ingredients') diff = (b.ingTotal - a.ingTotal) * d
      else if (sortKey === 'energy') diff = ((b.baseEnergy ?? 0) - (a.baseEnergy ?? 0)) * d
      else if (sortKey === 'feasible') diff = (b.feasible - a.feasible) * d
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'zh-TW')
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
            <img src={cat.icon} alt={cat.label} className="cat-icon" />
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
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <button
            className="sort-dir-btn"
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            title={sortDir === 'desc' ? '多到少' : '少到多'}
          >
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
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
            stockpileList={stockpileList}
          />
        ))}
      </div>

      {processed.length === 0 && (
        <div className="empty-state">沒有符合的料理</div>
      )}
    </div>
  )
}
