import { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import ingredientsData from '../data/ingredients.json'

export default function OcrImport({ onApply, onClose }) {
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState({})
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('idle')
    setResults({})
  }

  const runOcr = async () => {
    if (!preview) return
    setStatus('running')
    setProgress(0)
    try {
      const worker = await createWorker('chi_tra', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })
      const { data: { text } } = await worker.recognize(preview)
      await worker.terminate()

      const found = {}
      ingredientsData.forEach(ing => {
        const idx = text.indexOf(ing.name)
        if (idx === -1) return
        const after = text.slice(idx + ing.name.length, idx + ing.name.length + 10)
        const match = after.match(/\d+/)
        found[ing.id] = match ? parseInt(match[0], 10) : 0
      })
      setResults(found)
      setStatus('done')
    } catch {
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
          <span className="modal-title">📷 掃描截圖</span>
          <button className="modal-close" onClick={onClose}>✕</button>
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
          <button className="ocr-btn primary" onClick={runOcr}>開始辨識</button>
        )}

        {status === 'running' && (
          <div className="ocr-progress-wrap">
            <div className="ocr-progress-bar" style={{ width: `${progress}%` }} />
            <span className="ocr-progress-label">辨識中… {progress}%</span>
          </div>
        )}

        {status === 'error' && (
          <p className="ocr-error">辨識失敗，請確認圖片格式正確後再試。</p>
        )}

        {status === 'done' && (
          <>
            <p className="ocr-summary">辨識完成，找到 <strong>{detectedCount}</strong> 種食材，請確認數量後套用。</p>
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
