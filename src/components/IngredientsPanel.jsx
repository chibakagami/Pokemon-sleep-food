import { useState } from 'react'
import ingredientsData from '../data/ingredients.json'
import OcrImport from './OcrImport'

export default function IngredientsPanel({ inventory, onUpdate, onApplyInventory }) {
  const [imgErrors, setImgErrors] = useState({})
  const [showOcr, setShowOcr] = useState(false)

  const handleInput = (id, raw) => {
    const val = Math.max(0, Math.min(999, parseInt(raw, 10) || 0))
    onUpdate(id, val)
  }

  return (
    <div className="ingredients-panel">
      <div className="panel-top-bar">
        <p className="panel-hint">輸入你目前擁有的食材數量</p>
        <button className="ocr-scan-btn" onClick={() => setShowOcr(true)}>
          📷 掃描截圖
        </button>
      </div>
      <div className="ingredients-grid">
        {ingredientsData.map(ing => {
          const count = inventory[ing.id] ?? 0
          return (
            <div key={ing.id} className="ingredient-card">
              {ing.image && !imgErrors[ing.id] ? (
                <img
                  src={ing.image}
                  alt={ing.name}
                  className="ingredient-img"
                  onError={() => setImgErrors(prev => ({ ...prev, [ing.id]: true }))}
                />
              ) : (
                <div className="ingredient-emoji">{ing.emoji}</div>
              )}
              <div className="ingredient-name">{ing.name}</div>
              <div className="ingredient-controls">
                <button
                  className="ctrl-btn"
                  onClick={() => handleInput(ing.id, count - 1)}
                  aria-label={`減少 ${ing.name}`}
                >−</button>
                <input
                  className="count-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="999"
                  value={count}
                  onChange={e => handleInput(ing.id, e.target.value)}
                />
                <button
                  className="ctrl-btn"
                  onClick={() => handleInput(ing.id, count + 1)}
                  aria-label={`增加 ${ing.name}`}
                >+</button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="reset-row">
        <button className="reset-btn" onClick={() => {
          ingredientsData.forEach(ing => onUpdate(ing.id, 0))
        }}>
          全部清零
        </button>
      </div>

      {showOcr && (
        <OcrImport
          onApply={onApplyInventory}
          onClose={() => setShowOcr(false)}
        />
      )}
    </div>
  )
}
