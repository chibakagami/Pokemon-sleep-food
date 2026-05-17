import { useState } from 'react'
import ingredientsData from '../data/ingredients.json'
import recipesData from '../data/recipes.json'

const ingMap = Object.fromEntries(ingredientsData.map(i => [i.id, i]))

function IngIcon({ ing }) {
  const [imgErr, setImgErr] = useState(false)
  if (ing?.image && !imgErr) {
    return <img src={ing.image} alt={ing.name} className="cook-ing-icon" onError={() => setImgErr(true)} />
  }
  return <span className="cook-ing-emoji">{ing?.emoji}</span>
}

function buildCategoryMaxReq(category) {
  const max = {}
  recipesData
    .filter(r => r.category === category)
    .forEach(r => {
      Object.entries(r.ingredients).forEach(([id, amt]) => {
        max[id] = Math.max(max[id] ?? 0, amt)
      })
    })
  return max
}

function buildStockpileMaxReq(stockpileList) {
  const max = {}
  stockpileList.forEach(({ recipeId, meals }) => {
    const r = recipesData.find(r => r.id === recipeId)
    if (!r) return
    Object.entries(r.ingredients).forEach(([id, amt]) => {
      max[id] = Math.max(max[id] ?? 0, amt * meals)
    })
  })
  return max
}

export default function CookModal({ recipe, inventory, potRemain, stockpileList = [], onConfirm, onClose }) {
  const [extras, setExtras] = useState({})
  const categoryMaxReq = buildCategoryMaxReq(recipe.category)
  const stockpileMaxReq = buildStockpileMaxReq(stockpileList)

  const totalExtras = Object.values(extras).reduce((s, v) => s + v, 0)
  const remaining = potRemain - totalExtras

  const changeExtra = (id, delta) => {
    setExtras(prev => {
      const current = prev[id] ?? 0
      const maxAdd = Math.min(inventory[id] ?? 0, current + remaining)
      const next = Math.max(0, delta > 0 ? Math.min(maxAdd, current + 1) : current - 1)
      if (next === 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const handleConfirm = () => {
    onConfirm(extras)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box cook-modal">
        <div className="modal-header">
          <span className="modal-title">🍳 開始烹飪</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="cook-recipe-name">{recipe.name}</p>

        <div className="cook-section-title">料理食材</div>
        <div className="cook-ing-list">
          {Object.entries(recipe.ingredients).map(([id, req]) => {
            const ing = ingMap[id]
            return (
              <div key={id} className="cook-ing-row">
                <span className="cook-ing-label"><IngIcon ing={ing} />{ing?.name}</span>
                <span className="cook-ing-qty">×{req}</span>
              </div>
            )
          })}
        </div>

        <div className="cook-pot-remain">
          鍋子剩餘空間：<strong>{remaining}</strong> / {potRemain}
        </div>

        <div className="cook-section-title">補料選擇（可選）</div>
        <div className="cook-extras-list">
          {ingredientsData.map(ing => {
            const have = inventory[ing.id] ?? 0
            const chosen = extras[ing.id] ?? 0
            const catMax = categoryMaxReq[ing.id] ?? 0
            const spMax = stockpileMaxReq[ing.id] ?? 0
            const limit = Math.max(catMax, spMax)
            const excess = limit > 0 ? Math.max(0, have - limit) : 0
            return (
              <div key={ing.id} className="cook-extra-row">
                <span className="cook-extra-name"><IngIcon ing={ing} />{ing.name}</span>
                <div className="cook-extra-info">
                  <span className="cook-extra-have">庫存 {have}</span>
                  {limit > 0 && (
                    <span className={`cook-extra-max ${excess > 0 ? 'has-excess' : ''}`}>
                      上限 {limit}{spMax > catMax ? ' 囤' : ''}{excess > 0 ? `（多 ${excess}）` : ''}
                    </span>
                  )}
                </div>
                <div className="cook-extra-ctrl">
                  <button
                    className="step-btn"
                    onClick={() => changeExtra(ing.id, -1)}
                    disabled={chosen === 0}
                  >−</button>
                  <span className="cook-extra-chosen">{chosen}</span>
                  <button
                    className="step-btn"
                    onClick={() => changeExtra(ing.id, 1)}
                    disabled={remaining === 0 || chosen >= have}
                  >+</button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="cook-actions">
          <button className="ocr-btn secondary" onClick={onClose}>取消</button>
          <button className="ocr-btn primary" onClick={handleConfirm}>確認烹飪</button>
        </div>
      </div>
    </div>
  )
}
