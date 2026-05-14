import { useState, useRef } from 'react'
import ingredientsData from '../data/ingredients.json'

const STORAGE_KEY = 'psf_ocrspace_key'
const OCRSPACE_URL = 'https://api.ocr.space/parse/image'

function parseIngredients(text) {
  const found = {}
  ingredientsData.forEach(ing => {
    const idx = text.indexOf(ing.name)
    if (idx === -1) return
    const after = text.slice(idx + ing.name.length, idx + ing.name.length + 12)
    const match = after.match(/\d+/)
    if (match) found[ing.id] = Math.max(0, Math.min(999, parseInt(match[0], 10)))
  })
  return found
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
      const formData = new FormData()
      formData.append('apikey', apiKey.trim())
      formData.append('file', file)
      formData.append('language', 'cht')
      formData.append('isOverlayRequired', 'false')
      formData.append('OCREngine', '2')

      const res = await fetch(OCRSPACE_URL, { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage?.[0] ?? '辨識失敗')
      }

      const text = data.ParsedResults?.map(r => r.ParsedText).join('\n') ?? ''
      const found = parseIngredients(text)
      setResults(found)
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
          <span className="modal-title">📷 掃描截圖（OCR.space）</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ocr-key-row">
          <label className="ocr-key-label">OCR.space API Key</label>
          <input
            className="ocr-key-input"
            type="password"
            placeholder="免費申請：ocr.space（存於本機，不會上傳）"
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
