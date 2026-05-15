import { useState } from 'react'

export default function SettingsModal({ potConfig, ingMax, onSavePot, onSaveIngMax, onResetProduction, onClose }) {
  const [weekday, setWeekday] = useState(potConfig.weekday)
  const [sunday, setSunday] = useState(potConfig.sunday)
  const [maxVal, setMaxVal] = useState(ingMax)
  const [confirmReset, setConfirmReset] = useState(false)

  const clampPot = v => Math.max(1, Math.min(200, parseInt(v, 10) || 1))
  const clampMax = v => Math.max(1, Math.min(9999, parseInt(v, 10) || 1))

  const handleSave = () => {
    onSavePot({ weekday: clampPot(weekday), sunday: clampPot(sunday) })
    onSaveIngMax(clampMax(maxVal))
    onClose()
  }

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    onResetProduction()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box pot-modal">
        <div className="modal-header">
          <span className="modal-title">⚙️ 設定</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-section-title">鍋子容量</div>
        <div className="pot-form">
          <label className="pot-label">
            <span>平日容量</span>
            <input className="pot-input" type="number" min="1" max="200" value={weekday} onChange={e => setWeekday(e.target.value)} />
          </label>
          <label className="pot-label">
            <span>週日容量</span>
            <input className="pot-input" type="number" min="1" max="200" value={sunday} onChange={e => setSunday(e.target.value)} />
          </label>
        </div>

        <div className="settings-section-title">食材庫存</div>
        <div className="pot-form">
          <label className="pot-label">
            <span>庫存上限顯示</span>
            <input className="pot-input" type="number" min="1" max="9999" value={maxVal} onChange={e => setMaxVal(e.target.value)} />
          </label>
        </div>

        <div className="settings-section-title">製作紀錄</div>
        <div className="pot-form">
          <div className="reset-production-row">
            <span className="reset-production-hint">
              {confirmReset ? '⚠️ 再按一次確認重置' : '清除所有料理的製作次數'}
            </span>
            <button
              className={`reset-production-btn ${confirmReset ? 'confirm' : ''}`}
              onClick={handleReset}
              onBlur={() => setConfirmReset(false)}
            >
              {confirmReset ? '確定重置' : '重置'}
            </button>
          </div>
        </div>

        <div className="pot-actions">
          <button className="ocr-btn secondary" onClick={onClose}>取消</button>
          <button className="ocr-btn primary" onClick={handleSave}>儲存</button>
        </div>
      </div>
    </div>
  )
}
