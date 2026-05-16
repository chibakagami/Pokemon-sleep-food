export default function SplashScreen({ onStart }) {
  return (
    <div className="splash" onClick={onStart}>
      <img src="/Pokemon-sleep-food/splash.png" alt="Pokémon Sleep 料理助手" className="splash-bg-img" />
      <div className="splash-overlay">
        <div className="splash-logo">
          <div className="logo-pokemon">Pokémon</div>
          <div className="logo-sleep">Sleep</div>
          <div className="logo-sub">料理助手</div>
        </div>
        <button className="splash-btn" onClick={onStart}>點擊來開始</button>
      </div>
      <div className="splash-version">V1.04</div>
    </div>
  )
}
