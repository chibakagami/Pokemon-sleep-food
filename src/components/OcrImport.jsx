import { useState, useRef } from 'react'
import ingredientsData from '../data/ingredients.json'

const STORAGE_KEY = 'psf_ocrspace_key'
const OCRSPACE_URL = 'https://api.ocr.space/parse/image'

// 從 OCR overlay 資料用空間邏輯配對食材名稱與右上方數量
function extractQuantities(ocrData) {
  const lines = ocrData.ParsedResults?.[0]?.TextOverlay?.Lines ?? []

  // 收集所有文字 token 及位置
  const allWords = lines.flatMap(line =>
    (line.Words ?? []).map(w => ({
      text: (w.WordText ?? '').trim(),
      left: w.Left ?? 0,
      top: w.Top ?? 0,
      width: w.Width ?? 0,
      height: w.Height ?? 0,
    }))
  )

  // 數字 token：允許 ×/x 前綴（遊戲 UI 顯示 ×88 形式）
  const numbers = allWords.filter(w => /^[×xX]?\d+$/.test(w.text))

  // 模糊名稱配對：2+ 個連續字元出現在行文字中即視為符合
  function nameMatchesLine(lineText, ingName) {
    if (lineText.includes(ingName)) return true
    const minLen = ingName.length >= 4 ? 3 : 2
    for (let i = 0; i <= ingName.length - minLen; i++) {
      if (lineText.includes(ingName.slice(i, i + minLen))) return true
    }
    return false
  }

  const result = {}

  for (const line of lines) {
    if (!line.Words?.length) continue

    const lineText = line.Words.map(w => w.WordText ?? '').join('')
    const lineLeft = Math.min(...line.Words.map(w => w.Left ?? 0))
    const lineRight = Math.max(...line.Words.map(w => (w.Left ?? 0) + (w.Width ?? 0)))
    const lineTop = line.MinTop ?? (line.Words[0]?.Top ?? 0)
    const lineHeight = line.MaxHeight ?? (line.Words[0]?.Height ?? 20)

    for (const ing of ingredientsData) {
      if (ing.id in result) continue
      if (!nameMatchesLine(lineText, ing.name)) continue

      const lineWidth = lineRight - lineLeft
      const cardHalfWidth = Math.max(lineWidth * 1.5, 80)
      const lineCenterX = (lineLeft + lineRight) / 2

      // 找名稱上方、水平範圍內的數字 token
      const candidates = numbers.filter(n => {
        const numCenterX = n.left + n.width / 2
        const isAbove = n.top < lineTop + lineHeight
        const isNearby = Math.abs(numCenterX - lineCenterX) <= cardHalfWidth
        return isAbove && isNearby
      })

      if (!candidates.length) continue

      // 選距離名稱右上角最近的數字
      const best = candidates.reduce((a, b) => {
        const da = Math.hypot((a.left + a.width) - lineRight, a.top - lineTop)
        const db = Math.hypot((b.left + b.width) - lineRight, b.top - lineTop)
        return da < db ? a : b
      })

      const val = parseInt(best.text.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(val) && val > 0 && val <= 999) {
        result[ing.id] = val
      }
    }
  }

  return result
}

export default function OcrImport({ onApply, onClose }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle')
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
    key ? localStorage.setItem(STORAGE_KEY, key) : localStorage.removeItem(STORAGE_KEY)
  }

  const runOcr = async () => {
    if (!file || !apiKey.trim()) return
    setStatus('running')
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('apikey', apiKey.trim())
      formData.append('language', 'cht')
      formData.append('isOverlayRequired', 'true')
      formData.append('scale', 'true')
      formData.append('OCREngine', '2')

      const res = await fetch(OCRSPACE_URL, { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage?.[0] ?? '辨識失敗')
      }

      const valid = extractQuantities(data)
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
          <span className="modal-title">📷 掃描截圖（OCR.space）</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ocr-key-row">
          <label className="ocr-key-label">OCR.space API Key</label>
          <input
            className="ocr-key-input"
            type="password"
            placeholder="K_…（ocr.space 免費申請）"
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
          <button className="ocr-btn primary" onClick={runOcr} disabled={!apiKey.trim()}>
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
            <p className="ocr-error">{errorMsg}</p>
            <button className="ocr-btn secondary" onClick={runOcr}>重試</button>
          </div>
        )}

        {status === 'done' && (
          <>
            <p className="ocr-summary">
              辨識完成，找到 <strong>{detectedCount}</strong> 種食材，確認後套用。
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
