import { useState } from 'react'
import ingredientsData from '../data/ingredients.json'

const ingMap = Object.fromEntries(ingredientsData.map(i => [i.id, i]))

const CATEGORY_ICON = { curry: '🍛', salad: '🥗', dessert: '🍡' }
const MAX_LEVEL = 65

export default function RecipeCard({
  recipe, inventory,
  level, target, productionCount,
  onLevelChange, onTargetChange, onCook,
}) {
  const { name, category, ingredients, feasible, image, baseEnergy } = recipe
  const [recipeImgErr, setRecipeImgErr] = useState(false)
  const [ingImgErrors, setIngImgErrors] = useState({})

  const clamp = v => Math.min(MAX_LEVEL, Math.max(0, v))
  const achieved = target > 0 && level >= target
  const totalIngredients = Object.values(ingredients).reduce((s, v) => s + v, 0)

  return (
    <div className={`recipe-card ${feasible ? 'feasible' : 'infeasible'}`}>
      <div className="recipe-header">
        {image && !recipeImgErr ? (
          <img
            src={image}
            alt={name}
            className="recipe-img"
            onError={() => setRecipeImgErr(true)}
          />
        ) : (
          <span className="recipe-category-icon">{CATEGORY_ICON[category]}</span>
        )}
        <div className="recipe-title-block">
          <div className="recipe-name-row">
            <span className="recipe-name">{name}</span>
            <span className="recipe-total-ing" title="總食材數">×{totalIngredients}</span>
          </div>
          {baseEnergy != null && (
            <span className="recipe-base-energy">基本能量 {baseEnergy.toLocaleString()}</span>
          )}
        </div>
        <div className="header-badges">
          {feasible && <span className="feasible-badge">✓ 可做</span>}
          {achieved && <span className="achieved-badge">★ 達標</span>}
        </div>
      </div>

      <div className="recipe-ingredients">
        {Object.entries(ingredients).map(([id, required]) => {
          const ing = ingMap[id]
          const have = inventory[id] ?? 0
          const ok = have >= required
          return (
            <div key={id} className={`ing-row ${ok ? 'ok' : 'lacking'}`}>
              <span className="ing-label">
                {ing?.image && !ingImgErrors[id] ? (
                  <img
                    src={ing.image}
                    alt={ing?.name}
                    className="ing-img"
                    onError={() => setIngImgErrors(prev => ({ ...prev, [id]: true }))}
                  />
                ) : (
                  <span className="ing-emoji-fallback">{ing?.emoji} </span>
                )}
                {ing?.name}
              </span>
              <span className="ing-count">{have}<span className="ing-sep">/</span>{required}</span>
            </div>
          )
        })}
      </div>

      <div className="recipe-footer">
        <div className="level-row">
          <span className="footer-lbl">Lv.</span>
          <button
            className="step-btn"
            onClick={() => onLevelChange(clamp(level - 1))}
            aria-label="等級 -1"
          >−</button>
          <input
            className="lv-input"
            type="number"
            min="0"
            max={MAX_LEVEL}
            value={level}
            onChange={e => onLevelChange(clamp(parseInt(e.target.value) || 0))}
          />
          <button
            className="step-btn"
            onClick={() => onLevelChange(clamp(level + 1))}
            aria-label="等級 +1"
          >+</button>
          <span className="footer-sep">·</span>
          <span className="footer-lbl">目標</span>
          <input
            className="lv-input"
            type="number"
            min="0"
            max={MAX_LEVEL}
            value={target || ''}
            placeholder="—"
            onChange={e => onTargetChange(clamp(parseInt(e.target.value) || 0))}
          />
        </div>
        <div className="production-row">
          <span className="cook-count">製作 {productionCount} 次</span>
          <button
            className={`cook-btn ${feasible ? 'cook-ready' : 'cook-dim'}`}
            onClick={onCook}
          >已製作 +1</button>
        </div>
      </div>
    </div>
  )
}
