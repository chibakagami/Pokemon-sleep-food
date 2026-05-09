import ingredientsData from '../data/ingredients.json'

const ingMap = Object.fromEntries(ingredientsData.map(i => [i.id, i]))

const CATEGORY_ICON = { curry: '🍛', salad: '🥗', dessert: '🍰' }
const MAX_LEVEL = 6

export default function RecipeCard({ recipe, inventory, level, onLevelChange }) {
  const { name, category, ingredients, feasible } = recipe

  return (
    <div className={`recipe-card ${feasible ? 'feasible' : 'infeasible'}`}>
      <div className="recipe-header">
        <span className="recipe-category-icon">{CATEGORY_ICON[category]}</span>
        <span className="recipe-name">{name}</span>
        {feasible && <span className="feasible-badge">✓ 可做</span>}
      </div>

      <div className="recipe-ingredients">
        {Object.entries(ingredients).map(([id, required]) => {
          const ing = ingMap[id]
          const have = inventory[id] ?? 0
          const ok = have >= required
          return (
            <div key={id} className={`ing-row ${ok ? 'ok' : 'lacking'}`}>
              <span className="ing-label">{ing?.emoji} {ing?.name}</span>
              <span className="ing-count">{have}<span className="ing-sep">/</span>{required}</span>
            </div>
          )
        })}
      </div>

      <div className="recipe-footer">
        <label className="level-label">等級</label>
        <div className="level-dots">
          {Array.from({ length: MAX_LEVEL }, (_, i) => (
            <button
              key={i}
              className={`level-dot ${i < level ? 'filled' : ''}`}
              onClick={() => onLevelChange(i + 1 === level ? i : i + 1)}
              aria-label={`設為 Lv.${i + 1}`}
            />
          ))}
        </div>
        <span className="level-text">Lv.{level}</span>
      </div>
    </div>
  )
}
