import { useState } from 'react'
import IngredientsPanel from './components/IngredientsPanel'
import RecipeList from './components/RecipeList'
import GapPanel from './components/GapPanel'
import SplashScreen from './components/SplashScreen'
import SettingsModal from './components/SettingsModal'
import { useStorage } from './hooks/useStorage'
import ingredientsData from './data/ingredients.json'
import './App.css'

const initialInventory = Object.fromEntries(ingredientsData.map(ing => [ing.id, 0]))

export default function App() {
  const [started, setStarted] = useState(false)
  const [tab, setTab] = useState('recipes')
  const [showSettings, setShowSettings] = useState(false)
  const [inventory, setInventory] = useStorage('psf_inventory', initialInventory)
  const [recipeLevels, setRecipeLevels] = useStorage('psf_levels', {})
  const [recipeTargets, setRecipeTargets] = useStorage('psf_targets', {})
  const [productionCounts, setProductionCounts] = useStorage('psf_production', {})
  const [potConfig, setPotConfig] = useStorage('psf_pot', { weekday: 81, sunday: 122 })
  const [isSunday, setIsSunday] = useStorage('psf_is_sunday', false)
  const [stockpileList, setStockpileList] = useStorage('psf_stockpile', [])
  const [ingMax, setIngMax] = useStorage('psf_ing_max', 800)

  const updateIngredient = (id, value) => {
    setInventory(prev => ({ ...prev, [id]: Math.max(0, Math.min(999, value)) }))
  }

  const applyInventory = (partial) => {
    setInventory(prev => {
      const next = { ...prev }
      Object.entries(partial).forEach(([id, val]) => {
        if (id in next) next[id] = Math.max(0, Math.min(999, val))
      })
      return next
    })
  }

  const handleCook = (recipe, extras = {}) => {
    setProductionCounts(prev => ({ ...prev, [recipe.id]: (prev[recipe.id] ?? 0) + 1 }))
    setInventory(prev => {
      const next = { ...prev }
      Object.entries(recipe.ingredients).forEach(([id, req]) => {
        next[id] = Math.max(0, (next[id] ?? 0) - req)
      })
      Object.entries(extras).forEach(([id, amt]) => {
        next[id] = Math.max(0, (next[id] ?? 0) - amt)
      })
      return next
    })
  }

  if (!started) {
    return <SplashScreen onStart={() => setStarted(true)} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-icon">🍲</span>
          <div className="header-text">
            <h1 className="header-title">料理助手</h1>
            <p className="header-sub">Pokémon Sleep</p>
          </div>
          <button className="header-settings-btn" onClick={() => setShowSettings(true)}>
            ⚙️ 設定
          </button>
        </div>
      </header>

      <nav className="tab-nav">
        <button className={`tab-btn ${tab === 'recipes' ? 'active' : ''}`} onClick={() => setTab('recipes')}>
          🍛 料理
        </button>
        <button className={`tab-btn ${tab === 'ingredients' ? 'active' : ''}`} onClick={() => setTab('ingredients')}>
          🧵 食材
        </button>
        <button className={`tab-btn ${tab === 'gap' ? 'active' : ''}`} onClick={() => setTab('gap')}>
          🔍 缺口
        </button>
      </nav>

      <main className="app-main">
        {tab === 'ingredients' && (
          <IngredientsPanel
            inventory={inventory}
            onUpdate={updateIngredient}
            onApplyInventory={applyInventory}
            ingMax={ingMax}
          />
        )}
        {tab === 'recipes' && (
          <RecipeList
            inventory={inventory}
            recipeLevels={recipeLevels}
            setRecipeLevels={setRecipeLevels}
            recipeTargets={recipeTargets}
            setRecipeTargets={setRecipeTargets}
            productionCounts={productionCounts}
            onCook={handleCook}
            potConfig={potConfig}
            isSunday={isSunday}
            setIsSunday={setIsSunday}
            stockpileList={stockpileList}
            setStockpileList={setStockpileList}
          />
        )}
        {tab === 'gap' && (
          <GapPanel
            inventory={inventory}
            potConfig={potConfig}
            isSunday={isSunday}
          />
        )}
      </main>

      {showSettings && (
        <SettingsModal
          potConfig={potConfig}
          ingMax={ingMax}
          onSavePot={setPotConfig}
          onSaveIngMax={setIngMax}
          onResetProduction={() => setProductionCounts({})}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
