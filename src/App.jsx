import { useState } from 'react'
import IngredientsPanel from './components/IngredientsPanel'
import RecipeList from './components/RecipeList'
import { useStorage } from './hooks/useStorage'
import ingredientsData from './data/ingredients.json'
import './App.css'

const initialInventory = Object.fromEntries(ingredientsData.map(ing => [ing.id, 0]))

export default function App() {
  const [tab, setTab] = useState('recipes')
  const [inventory, setInventory] = useStorage('psf_inventory', initialInventory)
  const [recipeLevels, setRecipeLevels] = useStorage('psf_levels', {})

  const updateIngredient = (id, value) => {
    setInventory(prev => ({ ...prev, [id]: Math.max(0, Math.min(999, value)) }))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-icon">🍲</span>
          <div>
            <h1 className="header-title">料理助手</h1>
            <p className="header-sub">Pokémon Sleep</p>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${tab === 'recipes' ? 'active' : ''}`}
          onClick={() => setTab('recipes')}
        >
          🍛 料理
        </button>
        <button
          className={`tab-btn ${tab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setTab('ingredients')}
        >
          🧺 食材
        </button>
      </nav>

      <main className="app-main">
        {tab === 'ingredients' ? (
          <IngredientsPanel inventory={inventory} onUpdate={updateIngredient} />
        ) : (
          <RecipeList
            inventory={inventory}
            recipeLevels={recipeLevels}
            setRecipeLevels={setRecipeLevels}
          />
        )}
      </main>
    </div>
  )
}
