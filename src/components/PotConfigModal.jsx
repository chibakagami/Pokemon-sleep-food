import { useState } from 'react'

export default function PotConfigModal({ potConfig, onSave, onClose }) {
  const [weekday, setWeekday] = useState(potConfig.weekday)
  const [sunday, setSunday] = useState(potConfig.sunday)

  const clamp = v => Math.max(1, Math.min(200, parseInt(v, 10) || 1))

  const handleSave = () => {
    onSave({ weekday: clamp(weekday), sunday: clamp(sunday) })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box pot-modal">
        <div className="modal-header">
          <span className="modal-title">⚙️ 鍋子容量設定</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="pot-form">
          <label className="pot-label">
            <span>平日鍋子容量</span>
            <input
              className="pot-input"
              type="number"
              min="1"
              max="200"
              value={weekday}
              onChange={e => setWeekday(e.target.value)}
            />
          </label>
          <label className="pot-label">
            <span>週日鍋子容量</span>
            <input
              className="pot-input"
              type="number"
              min="1"
              max="200"
              value={sunday}
              onChange={e => setSunday(e.target.value)}
            />
          </label>
        </div>
        <div className="pot-actions">
          <button className="ocr-btn secondary" onClick={onClose}>取消</button>
          <button className="ocr-btn primary" onClick={handleSave}>儲存</button>
        </div>
      </div>
    </div>
  )
}
