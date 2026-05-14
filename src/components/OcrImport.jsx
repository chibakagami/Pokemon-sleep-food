import { useState, useRef } from 'react'
import ingredientsData from '../data/ingredients.json'

const STORAGE_KEY = 'psf_gemini_key'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'

const ingList = ingredientsData.map(i => `${i.id}="${i.name}"`).join('、')

const PROMPT = `這是一張 Pokémon Sleep 的背包食材截圖。
請辨識畫面中出現的食材名稱與對應數量。
只從以下食材 ID 對應表中配對（格式為 id="遊戲名稱"）：
${ingList}
請回傳純 JSON 物件，key 為 id，value 為整數數量，例如：{"tomato":74,"milk":32}
若某食材未出現在截圖中，請勿包含在結果中。只回傳 JSON，不要任何說明文字。`

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function OcrImport({ onApply, onClose }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const [results, setResults] = useState({})
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus('idle')
    setResults({})
  }

  const saveKey = (key) => {
    setApiKey(key)
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  }

  const runOcr = async () => {
    if (!file || !apiKey.trim()) return
    setStatus('running')
    setErrorMsg('')
    try {
      const b64 = await toBase64(file)
      const mimeType = file.type || 'image/jpeg'
      const body = {
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: b64 } },
            { text: PROMPT },
          ],
        }],
      }
      const res = await fetch(`${GEMINI_URL}?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('回應格式錯誤，請重試')
      const parsed = JSON.parse(jsonMatch[0])
      const valid = {}
      ingredientsData.forEach(ing => {
        if (ing.id in parsed && typeof parsed[ing.id] === 'number') {
          valid[ing.id] = Math.max(0, Math.min(999, Math.round(parsed[ing.id])))
        }
      })
      setResults(valid)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e.message ?? '未知錯誤')
      setStatus('error')
    }
  }

  const updateResult = (id, val) => {
    setResults(prev => ({ ...prev, [id]: Math.max(0, Math.min(999, parseInt(val, 10) || 0)) }))
  }

  const handleApply = () => {
    onApply(results)
    onClose()
  }

  const detectedCount = Object.keys(results).length

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box ocr-modal">
        <div className="modal-header">
          <span className="modal-title">📷 掃描截圖（Gemini）</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ocr-key-row">
          <label className="ocr-key-label">Gemini API Key</label>
          <input
            className="ocr-key-input"
            type="password"
            placeholder="AIza…（存於本機，不會上傳）"
            value={apiKey}
            onChange={e => saveKey(e.target.value)}
          />
        </div>

        <div className="ocr-upload-area" onClick={() => fileRef.current?.click()}>
          {preview ? (
            <img src={preview} alt="預覽" className="ocr-preview-img" />
          ) : (
            <div className="ocr-placeholder">
              <span className="ocr-placeholder-icon">🖼️</span>
              <span>點擊選擇截圖</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={handleFile}
        />

        {status === 'idle' && preview && (
          <button
            className="ocr-btn primary"
            onClick={runOcr}
            disabled={!apiKey.trim()}
          >
            {apiKey.trim() ? '開始辨識' : '請先輸入 API Key'}
          </button>
        )}

        {status === 'running' && (
          <div className="ocr-running">
            <span className="ocr-spinner">⏳</span> 辨識中，請稍候…
          </div>
        )}

        {status === 'error' && (
          <div className="ocr-error-block">
            <p className="ocr-error">辨識失敗：{errorMsg}</p>
            <button className="ocr-btn secondary" onClick={runOcr}>重試</button>
          </div>
        )}

        {status === 'done' && (
          <>
            <p className="ocr-summary">
              辨識完成，找到 <strong>{detectedCount}</strong> 種食材，請確認數量後套用。
            </p>
            <div className="ocr-results">
              {ingredientsData.map(ing => (
                <div key={ing.id} className={`ocr-row ${ing.id in results ? 'detected' : 'missing'}`}>
                  <span className="ocr-ing-name">{ing.name}</span>
                  <input
                    className="ocr-qty-input"
                    type="number"
                    min="0"
                    max="999"
                    value={results[ing.id] ?? ''}
                    placeholder="—"
                    onChange={e => updateResult(ing.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="ocr-actions">
              <button className="ocr-btn secondary" onClick={onClose}>取消</button>
              <button className="ocr-btn primary" onClick={handleApply}>套用到庫存</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
