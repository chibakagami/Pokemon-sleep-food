export default function SplashScreen({ onStart }) {
  return (
    <div className="splash" onClick={onStart}>
      <div className="splash-bg" />

      <div className="splash-stars">
        <span className="star s1">✦</span>
        <span className="star s2">✦</span>
        <span className="star s3">✦</span>
        <span className="star s4">✦</span>
        <span className="star s5">✦</span>
        <span className="star s6">✦</span>
      </div>

      <div className="splash-logo">
        <div className="logo-pokemon">Pokémon</div>
        <div className="logo-sleep">Sleep</div>
        <div className="logo-sub">料理助手</div>
      </div>

      <div className="splash-snorlax">
        <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" className="snorlax-svg">
          {/* Body */}
          <ellipse cx="100" cy="155" rx="78" ry="65" fill="#5a7fc7" />
          {/* Belly */}
          <ellipse cx="100" cy="160" rx="52" ry="48" fill="#e8d5a3" />
          {/* Head */}
          <ellipse cx="100" cy="90" rx="62" ry="58" fill="#5a7fc7" />
          {/* Face - closed sleeping eyes */}
          <path d="M75 85 Q82 80 89 85" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M111 85 Q118 80 125 85" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Nose */}
          <ellipse cx="100" cy="95" rx="6" ry="4" fill="#4a6ab5" />
          {/* Mouth - smile */}
          <path d="M88 108 Q100 118 112 108" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Ears */}
          <ellipse cx="52" cy="50" rx="18" ry="14" fill="#5a7fc7" />
          <ellipse cx="148" cy="50" rx="18" ry="14" fill="#5a7fc7" />
          <ellipse cx="52" cy="50" rx="10" ry="8" fill="#8a9fd0" />
          <ellipse cx="148" cy="50" rx="10" ry="8" fill="#8a9fd0" />
          {/* Arms */}
          <ellipse cx="30" cy="160" rx="20" ry="28" fill="#5a7fc7" transform="rotate(-15 30 160)" />
          <ellipse cx="170" cy="160" rx="20" ry="28" fill="#5a7fc7" transform="rotate(15 170 160)" />
          {/* Claws left */}
          <ellipse cx="18" cy="182" rx="5" ry="7" fill="#e8d5a3" transform="rotate(-20 18 182)" />
          <ellipse cx="28" cy="188" rx="5" ry="7" fill="#e8d5a3" />
          <ellipse cx="38" cy="184" rx="5" ry="7" fill="#e8d5a3" transform="rotate(20 38 184)" />
          {/* Claws right */}
          <ellipse cx="162" cy="184" rx="5" ry="7" fill="#e8d5a3" transform="rotate(-20 162 184)" />
          <ellipse cx="172" cy="188" rx="5" ry="7" fill="#e8d5a3" />
          <ellipse cx="182" cy="182" rx="5" ry="7" fill="#e8d5a3" transform="rotate(20 182 182)" />
          {/* Feet */}
          <ellipse cx="72" cy="215" rx="28" ry="12" fill="#5a7fc7" />
          <ellipse cx="128" cy="215" rx="28" ry="12" fill="#5a7fc7" />
          {/* Belly lines */}
          <path d="M80 140 Q100 135 120 140" stroke="#d4c090" strokeWidth="2" fill="none" />
          <path d="M75 155 Q100 148 125 155" stroke="#d4c090" strokeWidth="2" fill="none" />
          {/* Zzz */}
          <text x="138" y="62" fontSize="14" fontWeight="bold" fill="#fff" opacity="0.9">z</text>
          <text x="148" y="50" fontSize="18" fontWeight="bold" fill="#fff" opacity="0.9">z</text>
          <text x="160" y="35" fontSize="22" fontWeight="bold" fill="#fff" opacity="0.9">Z</text>
        </svg>
      </div>

      <button className="splash-btn" onClick={onStart}>
        點擊來開始
      </button>

      <div className="splash-version">V1.02</div>
    </div>
  )
}
