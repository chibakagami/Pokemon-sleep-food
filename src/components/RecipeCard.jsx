import { useState } from 'react'
import ingredientsData from '../data/ingredients.json'
import recipeLevels from '../data/recipeLevels.json'
import CookModal from './CookModal'

const ingMap = Object.fromEntries(ingredientsData.map(i => [i.id, i]))
const levelBonusMap = Object.fromEntries(recipeLevels.map(l => [l.level, l.bonusPercent]))
const CATEGORY_ICON = { curry: '🍛', salad: '🥗', dessert: '🍡' }
const MAX_LEVEL = 65

function calcEnergy(baseEnergy, level) {
  if (!baseEnergy) return null
  const bonus = levelBonusMap[level] ?? 0
  return Math.round(baseEnergy * (1 + bonus / 100))
}

export default function RecipeCard({
  recipe, inventory,
  level, target, productionCount,
  onLevelChange, onTargetChange, onCook,
  currentPot,
  inStockpile, onToggleStockpile,
  stockpileList,
}) {
  const { name, category, ingredients, feasible, sundayOnly, tooBig, ingTotal, potRemain, image, baseEnergy } = recipe
  const [collapsed, setCollapsed] = useState(true)
  const [recipeImgErr, setRecipeImgErr] = useState(false)
  const [ingImgErrors, setIngImgErrors] = useState({})
  const [showCookModal, setShowCookModal] = useState(false)

  const clamp = v => Math.min(MAX_LEVEL, Math.max(0, v))
  const achieved = target > 0 && level >= target

  const handleCookClick = (e) => {
    e.stopPropagation()
    if (!feasible) return
    if (potRemain > 0) setShowCookModal(true)
    else onCook({})
  }

  const RecipeImage = ({ className }) =>
    image && !recipeImgErr ? (
      <img src={image} alt={name} className={className} onError={() => setRecipeImgErr(true)} />
    ) : (
      <span className="compact-cat-icon">{CATEGORY_ICON[category]}</span>
    )

  if (collapsed) {
    return (
      <div
        className={`recipe-card compact-card ${feasible ? 'feasible' : 'infeasible'} ${tooBig ? 'too-big' : ''}`}
        onClick={() => setCollapsed(false)}
        role="button"
        aria-expanded="false"
      >
        <div className="compact-img-wrap">
          {level > 0 && <span className="compact-lv-badge">Lv.{level}</span>}
          <RecipeImage className="compact-recipe-img" />
        </div>

        <div className="compact-body">
          <div className="compact-top-row">
            <span className="compact-name">{name}</span>
            <div className="compact-right">
              {feasible && <span className="compact-feasible-dot" title="可製作" />}
              {achieved && <span className="compact-achieved-dot" title="已達標" />}
              {sundayOnly && !tooBig && <span className="compact-badge sunday">🌞</span>}
              {tooBig && <span className="compact-badge toobig">🚫</span>}
              {baseEnergy != null && (
                <span className="compact-energy">▲{calcEnergy(baseEnergy, level || 1).toLocaleString()}</span>
              )}
            </div>
          </div>

          {(level > 0 || target > 0) && (
            <div className="compact-level-row">
              <span className="compact-lv-text">Lv.{level}</span>
              {target > 0 && (
                <span className={`compact-target-text ${achieved ? 'achieved' : ''}`}>
                  目標 {target}
                </span>
              )}
            </div>
          )}

          <div className="compact-ings-row">
            {Object.entries(ingredients).map(([id, req]) => {
              const ing = ingMap[id]
              const ok = (inventory[id] ?? 0) >= req
              return (
                <span key={id} className={`compact-ing-chip ${ok ? 'ok' : 'lack'}`}>
                  {ing?.image && !ingImgErrors[id] ? (
                    <img
                      src={ing.image}
                      alt={ing?.name}
                      className="compact-ing-icon"
                      onError={() => setIngImgErrors(prev => ({ ...prev, [id]: true }))}
                    />
                  ) : (
                    <span className="compact-ing-emoji">{ing?.emoji}</span>
                  )}
                  <span>×{req}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`recipe-card ${feasible ? 'feasible' : 'infeasible'} ${tooBig ? 'too-big' : ''}`}>
      <div
        className="recipe-header clickable-header"
        onClick={() => setCollapsed(true)}
        role="button"
        aria-label="收合"
      >
        <RecipeImage className="recipe-img" />
        <div className="recipe-title-block">
          <div className="recipe-name-row">
            <span className="recipe-name">{name}</span>
            <span className="recipe-total-ing" title="總食材數">×{ingTotal}</span>
          </div>
          {baseEnergy != null && (
            <div className="recipe-energy-block">
              {level > 1
                ? <span className="recipe-base-energy">Lv.{level} 能量 <strong>{calcEnergy(baseEnergy, level).toLocaleString()}</strong>　基礎 {baseEnergy.toLocaleString()}</span>
                : <span className="recipe-base-energy">基礎能量 {baseEnergy.toLocaleString()}</span>
              }
            </div>
          )}
        </div>
        <div className="header-badges">
          {feasible && <span className="feasible-badge">✓ 可做</span>}
          {achieved && <span className="achieved-badge">★ 達標</span>}
          {sundayOnly && !tooBig && <span className="sunday-only-badge">🌞 週日</span>}
          {tooBig && <span className="too-big-badge">🚫 鍋子太小</span>}
          <span className="collapse-hint">▲</span>
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

      {!tooBig && potRemain !== undefined && (
        <div className={`pot-remain-tag ${potRemain > 0 ? 'has-room' : 'exact-fit'}`}>
          {potRemain > 0 ? `+${potRemain} 空位可補料` : '恰好填滿鍋子'}
        </div>
      )}

      <div className="recipe-footer">
        <div className="level-row">
          <span className="footer-lbl">Lv.</span>
          <button className="step-btn" onClick={() => onLevelChange(clamp(level - 1))} aria-label="等級 -1">−</button>
          <input
            className="lv-input"
            type="number"
            min="0"
            max={MAX_LEVEL}
            value={level}
            onChange={e => onLevelChange(clamp(parseInt(e.target.value) || 0))}
          />
          <button className="step-btn" onClick={() => onLevelChange(clamp(level + 1))} aria-label="等級 +1">+</button>
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
          <div className="production-actions">
            <button
              className={`stockpile-btn ${inStockpile ? 'in-list' : ''}`}
              onClick={e => { e.stopPropagation(); onToggleStockpile() }}
            >
              {inStockpile ? '✓ 囤積中' : '＋囤積'}
            </button>
            <button
              className={`cook-btn ${feasible ? 'cook-ready' : 'cook-dim'}`}
              onClick={handleCookClick}
            >🍳 烹飪</button>
          </div>
        </div>
      </div>

      {showCookModal && (
        <CookModal
          recipe={recipe}
          inventory={inventory}
          potRemain={potRemain}
          stockpileList={stockpileList}
          onConfirm={(extras) => onCook(extras)}
          onClose={() => setShowCookModal(false)}
        />
      )}
    </div>
  )
}
