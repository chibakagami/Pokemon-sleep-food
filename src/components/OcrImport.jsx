import { useState, useRef } from 'react'
import ingredientsData from '../data/ingredients.json'

const STORAGE_KEY = 'psf_claude_key'
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

const ING_MAP_TEXT = ingredientsData.map(i => `${i.id}=${i.name}`).join(', ')

const PROMPT = `這是 Pokémon Sleep 的背包食材截圖。
請辨識每種食材的數量，回傳純 JSON 物件（key 為 id，value 為整數數量）。
只列出截圖中有出現的食材，沒出現的不要列。
不要加任何說明文字，只回傳 JSON。

食材 id 對照（id=遊戲名稱）：
${ING_MAP_TEXT}`

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getMimeType(file) {
  const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (file.type && supported.includes(file.type)) return file.type
  const ext = file.name.split('.').pop().toLowerCase()
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] ?? 'image/jpeg'
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
      const [b64, mimeType] = await Promise.all([toBase64(file), Promise.resolve(getMimeType(file))])

      const body = {
        model: MODEL,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }

      const res = await fetch(CLAUDE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = err?.error?.message ?? `HTTP ${res.status}`
        if (res.status === 401) throw new Error('API Key 無效，請確認後重新輸入')
        if (res.status === 400) throw new Error(`請求錯誤：${msg}`)
        if (res.status === 429) throw new Error('請求過於頻繁，請稍後再試')
        if (res.status === 529) throw new Error('Claude 服務繁忙，請稍後再試')
        throw new Error(msg)
      }

      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''

      let parsed
      try {
        const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
        parsed = JSON.parse(clean)
      } catch {
        throw new Error('回傳格式異常，請重試一次')
      }

      const valid = {}
      ingredientsData.forEach(ing => {
        const val = parsed[ing.id]
        if (typeof val === 'number' && val >= 0) {
          valid[ing.id] = Math.min(999, Math.round(val))
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
          <span className="modal-title">📷 掃描截圖（Claude Vision）</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ocr-key-row">
          <label className="ocr-key-label">Anthropic API Key</label>
          <input
            className="ocr-key-input"
            type="password"
            placeholder="sk-ant-…（console.anthropic.com）"
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
          accept="image/jpeg,image/png,image/gif,image/webp"
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
