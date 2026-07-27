// BossSilhouette.jsx — shared gothic SVG portraits for bosses, used by the
// Journal's Chronicle/Memories tabs and the Bestiary. Extracted so both can
// render the same high-quality silhouette without duplicating the artwork.

import React from 'react';

export function Silhouette({ type, dim }) {
  const c = dim ? '#5a4a32' : '#1a1208';
  const crown = '#b88830';
  const ink = '#0a0805';
  const eye = 'rgba(200,80,40,0.85)';
  let body;
  switch (type) {
    case 'vicar':
      body = (<>
        <rect x="76" y="16" width="3.5" height="104" fill="#2a1e10" />
        <path d="M76 16 L71 28 L81 28 Z" fill="#2a1e10" />
        <path d="M50 12 Q32 20 31 46 L20 124 L80 124 L69 46 Q68 20 50 12 Z" fill={c} />
        <ellipse cx="50" cy="33" rx="11" ry="13" fill={ink} />
      </>);
      break;
    case 'gascoigne':
      body = (<>
        <ellipse cx="50" cy="30" rx="33" ry="7" fill={c} />
        <path d="M37 30 Q37 13 50 13 Q63 13 63 30 Z" fill={c} />
        <path d="M40 39 L32 124 L68 124 L60 39 Z" fill={c} />
        <path d="M40 39 L50 52 L60 39" fill="none" stroke="#2a1e10" strokeWidth="2" />
      </>);
      break;
    case 'nightmare':
      body = (<>
        <path d="M22 122 Q15 96 26 80" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M38 126 Q33 100 40 84" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M62 126 Q67 100 60 84" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M78 122 Q85 96 74 80" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="58" r="28" fill={c} />
        <ellipse cx="50" cy="58" rx="10" ry="8" fill={ink} />
        <circle cx="53" cy="58" r="3.5" fill={dim ? 'none' : eye} />
      </>);
      break;
    case 'mire':
      body = (<>
        <path d="M26 124 Q22 70 34 48 Q40 32 50 32 Q60 32 66 48 Q78 70 74 124 Z" fill={c} />
        <path d="M38 112 Q36 124 41 127" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M50 116 Q48 127 53 129" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M61 112 Q59 124 64 127" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="44" rx="10" ry="8" fill={ink} />
      </>);
      break;
    case 'hollow_king':
      body = (<>
        <rect x="42" y="46" width="16" height="62" fill={c} />
        <rect x="30" y="52" width="9" height="42" fill={c} />
        <rect x="61" y="52" width="9" height="42" fill={c} />
        <rect x="65" y="18" width="3" height="44" fill="#8a8a9a" />
        <circle cx="50" cy="34" r="13" fill={c} />
        <circle cx="45" cy="34" r="3" fill={ink} />
        <circle cx="55" cy="34" r="3" fill={ink} />
        <rect x="46" y="40" width="8" height="2.5" fill={ink} />
        <path d="M38 20 L42 8 L46 20 L50 5 L54 20 L58 8 L62 20 L62 25 L38 25 Z" fill={dim ? '#6a5a3a' : crown} />
      </>);
      break;
    case 'archivist':
      body = (<>
        <path d="M28 124 Q24 60 34 42 Q40 24 50 24 Q60 24 66 42 Q76 60 72 124 Z" fill={c} />
        <ellipse cx="50" cy="37" rx="12" ry="13" fill={ink} />
        <rect x="58" y="60" width="24" height="30" fill="#5a3a1a" />
        <rect x="60" y="62" width="20" height="26" fill={dim ? '#7a6a4a' : '#d4b060'} />
        <line x1="70" y1="62" x2="70" y2="88" stroke="#5a3a1a" strokeWidth="1.5" />
      </>);
      break;
    case 'final':
      body = (<>
        <path d="M50 10 Q34 18 33 42 L24 124 L76 124 L67 42 Q66 18 50 10 Z" fill={c} />
        <ellipse cx="50" cy="32" rx="12" ry="14" fill={ink} />
        <circle cx="50" cy="32" r="3.5" fill={dim ? 'none' : 'rgba(180,200,255,0.95)'} />
        <path d="M50 16 L45 6 L55 6 Z" fill={dim ? '#6a5a3a' : '#c9c0e0'} />
        <path d="M40 124 Q50 112 60 124" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>);
      break;
    case 'pale_wraith':
      body = (<>
        <path d="M50 14 Q30 24 30 50 L24 124 L76 124 L70 50 Q70 24 50 14 Z" fill={c} />
        <ellipse cx="50" cy="36" rx="12" ry="14" fill={ink} />
        <circle cx="46" cy="36" r="3" fill={dim ? 'none' : 'rgba(200,220,255,0.9)'} />
        <circle cx="54" cy="36" r="3" fill={dim ? 'none' : 'rgba(200,220,255,0.9)'} />
        <path d="M30 124 Q50 110 70 124" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>);
      break;
    case 'hollow_castellan':
      body = (<>
        <rect x="44" y="46" width="14" height="62" fill={c} />
        <rect x="32" y="52" width="8" height="40" fill={c} />
        <rect x="62" y="52" width="8" height="40" fill={c} />
        <circle cx="51" cy="34" r="12" fill={c} />
        <rect x="45" y="38" width="12" height="3" fill={ink} />
        <rect x="34" y="10" width="3" height="58" fill="#3a2a1a" />
        <path d="M30 10 L26 24 L37 24 Z" fill={dim ? '#6a5a3a' : '#8a3a2a'} />
        <rect x="58" y="18" width="2.4" height="52" fill={dim ? '#7a6a4a' : '#c9d2e2'} />
      </>);
      break;
    case 'cliff_watcher':
      body = (<>
        <path d="M20 66 Q12 52 10 38 Q24 48 30 58 Z" fill={c} />
        <path d="M82 66 Q90 52 92 38 Q78 48 72 58 Z" fill={c} />
        <rect x="44" y="44" width="14" height="56" fill={c} />
        <circle cx="51" cy="36" r="11" fill={c} />
        <path d="M44 30 L40 18 L48 26 Z" fill={c} />
        <path d="M58 30 L62 18 L54 26 Z" fill={c} />
        <ellipse cx="47" cy="36" rx="2.4" ry="2" fill={dim ? 'none' : 'rgba(200,230,120,0.9)'} />
        <ellipse cx="55" cy="36" rx="2.4" ry="2" fill={dim ? 'none' : 'rgba(200,230,120,0.9)'} />
      </>);
      break;
    case 'celestial':
      body = (<>
        <path d="M50 12 Q30 22 30 50 L24 124 L76 124 L70 50 Q70 22 50 12 Z" fill={c} />
        <ellipse cx="50" cy="36" rx="12" ry="14" fill={ink} />
        <circle cx="50" cy="34" r="3.5" fill={dim ? 'none' : 'rgba(220,200,255,0.95)'} />
        <g fill={dim ? '#6a5a8a' : '#c0a8ff'}>
          <circle cx="50" cy="6" r="2.2" />
          <circle cx="38" cy="10" r="1.6" /><circle cx="62" cy="10" r="1.6" />
          <circle cx="30" cy="20" r="1.4" /><circle cx="70" cy="20" r="1.4" />
        </g>
      </>);
      break;
    default: // unknown — generic hooded shade with a question
      body = (<>
        <path d="M50 14 Q32 22 31 46 L22 124 L78 124 L69 46 Q68 22 50 14 Z" fill={c} />
        <ellipse cx="50" cy="34" rx="11" ry="13" fill={ink} />
        <text x="50" y="98" textAnchor="middle" fontSize="46" fill="#6a5238" fontFamily="ui-serif, Georgia, serif">?</text>
      </>);
  }
  return (
    <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
      {body}
    </svg>
  );
}

export function Portrait({ type, dim, size = 70 }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size * 86 / 70 }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, #efe2c0 0%, #cdb88a 70%, #b9a678 100%)',
        boxShadow: dim ? 'inset 0 0 14px rgba(40,30,15,0.55)' : 'inset 0 0 14px rgba(40,30,15,0.4), 0 0 0 2px rgba(160,110,40,0.35)',
      }} />
      <div className="absolute inset-0 p-1.5">
        <div style={{ filter: dim ? 'grayscale(0.5) opacity(0.7)' : 'none' }}>
          <Silhouette type={type} dim={dim} />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 18px rgba(60,40,15,0.35)' }} />
    </div>
  );
}

export default Portrait;