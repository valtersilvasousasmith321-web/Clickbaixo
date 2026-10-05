'use strict';

const PATHS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 17-5.2-5.2',
  logo: 'M4 4h16v4H8v3h10v4H8v5H4z',
  bolt: 'M13 2 4 14h6l-1 8 10-14h-6z',
  shield: 'M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z',
  clock: 'M12 7v5l4 2 M12 2a10 10 0 1 0 .001 0z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chart: 'M4 20V10 M11 20V4 M18 20v-7',
  copy: 'M9 9h10v10H9z M5 5h10v4H9v6H5z',
  share: 'M7 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10-6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8.6 11l6.8-4M8.6 13l6.8 4',
  close: 'M6 6l12 12M18 6 6 18',
  megaphone: 'M3 10v4h4l6 4V6l-6 4z M17 9a4 4 0 0 1 0 6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  external: 'M14 4h6v6M20 4l-9 9M6 6h4v0H6v12h12v-4',
  check: 'M4 12l5 5 11-11',
  filter: 'M4 5h16M7 12h10M10 19h4',
  tag: 'M3 12 12 3h7v7l-9 9z M15.5 7.5h.01',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  audio: 'M3 10v4h4l5 4V6l-5 4z M16 9a4 4 0 0 1 0 6',
  tv: 'M3 5h18v12H3z M8 21h8 M12 17v4',
  phone: 'M7 2h10v20H7z M11 19h2',
  laptop: 'M4 5h16v10H4z M2 19h20',
  monitor: 'M4 4h16v11H4z M9 19h6 M12 15v4',
  game: 'M6 9h4m-2-2v4 M15 10h.01M18 12h.01 M3 9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3l1 7a2 2 0 0 1-3.3 1.5L16 15H8l-2.7 2.5A2 2 0 0 1 2 16z',
  install: 'M12 3v12 M7 10l5 5 5-5 M4 19h16',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 8h.01 M11 11h1.5v5.5h-1.5',
  moon: 'M20 12.5A8.5 8.5 0 1 1 11.5 4a6.5 6.5 0 0 0 8.5 8.5z',
  contrast: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 2v20',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.6v.5h5.2v-.5c0-.6.3-1.2.9-1.6A6 6 0 0 0 12 3z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  lock: 'M6 11V7a6 6 0 0 1 12 0v4 M5 11h14v10H5z',
  package: 'M3 8l9-5 9 5-9 5-9-5z M3 8v9l9 5 9-5V8 M12 13v9',
  alert: 'M12 3 2 20h20z M12 10v4 M12 17h.01',
};

function icon(name, size = 20) {
  const d = PATHS[name] || PATHS.tag;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d.split(' M').map((seg, i) => `<path d="${i === 0 ? seg : 'M' + seg}"/>`).join('')}</svg>`;
}

function kindOf(cat) {
  const em = (cat && cat.emoji) || '';
  const name = ((cat && cat.name) || '').toLowerCase();
  if (/📺/.test(em) || /tv/.test(name)) return 'tv';
  if (/📱/.test(em) || /celular|phone/.test(name)) return 'phone';
  if (/💻/.test(em) || /notebook|laptop/.test(name)) return 'laptop';
  if (/🖥️|🖥/.test(em) || /inform[aá]tica|monitor|pc/.test(name)) return 'monitor';
  if (/🏠/.test(em) || /casa|eletrodom/.test(name)) return 'home';
  if (/🎧/.test(em) || /[aá]udio|som|fone/.test(name)) return 'audio';
  if (/🎮/.test(em) || /jogo|game|console|playstation|xbox|nintendo/.test(name)) return 'game';
  return 'tag';
}

function catIcon(cat, size = 20) {
  if (cat && cat.emoji) return `<span class="cat-emoji" aria-hidden="true">${cat.emoji}</span>`;
  return icon(kindOf(cat), size);
}

const HUES = { tv: 220, phone: 160, laptop: 210, monitor: 200, home: 30, audio: 280, game: 140, tag: 45 };

// Ilustrações decorativas (estilo "adesivo") de aparelhos eletrônicos — usadas
// tanto no hero da home quanto como imagem de cada categoria/oferta sem foto
// própria, pra deixar o site mais bonito e ilustrado. Puramente ilustrativo,
// não substitui foto de produto nenhuma.
function deviceInner(kind, id) {
  const u = id || kind;
  const shadow = `<filter id="sh${u}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity="0.28"/></filter>`;
  if (kind === 'tv') {
    return `<defs>${shadow}
      <linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5b7bff"/><stop offset="100%" stop-color="#2541c9"/></linearGradient>
      </defs><g filter="url(#sh${u})">
      <rect x="3" y="8" width="58" height="32" rx="3" fill="#17223f"/>
      <rect x="6" y="11" width="52" height="26" rx="1" fill="url(#g${u})"/>
      <path d="M13 46l7-7M51 46l-7-7" stroke="#17223f" stroke-width="4" stroke-linecap="round"/>
      </g>`;
  }
  if (kind === 'phone') {
    return `<defs>${shadow}
      <linearGradient id="g${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd45e"/><stop offset="100%" stop-color="#ff9f1c"/></linearGradient>
      </defs><g filter="url(#sh${u})">
      <rect x="18" y="4" width="28" height="56" rx="7" fill="#17223f"/>
      <rect x="21" y="10" width="22" height="40" rx="2" fill="url(#g${u})"/>
      <circle cx="32" cy="54" r="2.4" fill="#cdd3e8"/>
      </g>`;
  }
  if (kind === 'audio') {
    return `<defs>${shadow}</defs><g filter="url(#sh${u})">
      <path d="M12 34v-4a20 20 0 0 1 40 0v4" fill="none" stroke="#17223f" stroke-width="5" stroke-linecap="round"/>
      <rect x="6" y="30" width="13" height="20" rx="6" fill="#e31b54"/>
      <rect x="45" y="30" width="13" height="20" rx="6" fill="#3758f9"/>
      </g>`;
  }
  if (kind === 'laptop') {
    return `<defs>${shadow}
      <linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2fd4ca"/><stop offset="100%" stop-color="#078f89"/></linearGradient>
      </defs><g filter="url(#sh${u})">
      <rect x="10" y="8" width="44" height="30" rx="3" fill="#17223f"/>
      <rect x="13" y="11" width="38" height="24" rx="1" fill="url(#g${u})"/>
      <path d="M4 44h56l-6 9H10z" fill="#17223f"/>
      <rect x="4" y="44" width="56" height="3.5" fill="#324169"/>
      </g>`;
  }
  if (kind === 'home') {
    return `<defs>${shadow}
      <linearGradient id="g${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd36e"/><stop offset="100%" stop-color="#ff9f1c"/></linearGradient>
      </defs><g filter="url(#sh${u})">
      <path d="M6 29 32 8 58 29" fill="none" stroke="#17223f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="13" y="27" width="38" height="27" rx="4" fill="url(#g${u})"/>
      <rect x="27" y="37" width="10" height="17" rx="2" fill="#17223f"/>
      <rect x="18" y="32" width="7" height="7" rx="1.5" fill="#fff6ea"/>
      <rect x="39" y="32" width="7" height="7" rx="1.5" fill="#fff6ea"/>
      </g>`;
  }
  if (kind === 'monitor') {
    return `<defs>${shadow}
      <linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6fc3ff"/><stop offset="100%" stop-color="#1f7dd4"/></linearGradient>
      </defs><g filter="url(#sh${u})">
      <rect x="6" y="8" width="52" height="34" rx="4" fill="#17223f"/>
      <rect x="10" y="12" width="44" height="26" rx="2" fill="url(#g${u})"/>
      <rect x="27" y="42" width="10" height="9" fill="#17223f"/>
      <rect x="16" y="51" width="32" height="4" rx="2" fill="#17223f"/>
      </g>`;
  }
  if (kind === 'game') {
    return `<defs>${shadow}
      <linearGradient id="g${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8ce58a"/><stop offset="100%" stop-color="#2fa84f"/></linearGradient>
      </defs><g filter="url(#sh${u})">
      <path d="M14 22h36a10 10 0 0 1 10 12l1 8a7 7 0 0 1-12 5l-5-5H30l-5 5a7 7 0 0 1-12-5l1-8a10 10 0 0 1 10-12z" fill="url(#g${u})"/>
      <path d="M21 29v8M17 33h8" stroke="#17223f" stroke-width="3" stroke-linecap="round"/>
      <circle cx="43" cy="30" r="2.6" fill="#17223f"/>
      <circle cx="49" cy="36" r="2.6" fill="#17223f"/>
      </g>`;
  }
  // 'tag' e qualquer outro: etiqueta de oferta genérica
  return `<defs>${shadow}
    <linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff8a5c"/><stop offset="100%" stop-color="#e8482e"/></linearGradient>
    </defs><g filter="url(#sh${u})">
    <path d="M6 30 30 6h20a8 8 0 0 1 8 8v20L34 58z" fill="url(#g${u})"/>
    <circle cx="42" cy="22" r="4.5" fill="#fff6ea"/>
    </g>`;
}

function heroDeviceArt(kind, id) {
  const inner = deviceInner(kind, id);
  if (!inner) return '';
  return `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">${inner}</svg>`;
}

function art(kind, hue) {
  const h = hue || HUES[kind] || 220;
  const inner = deviceInner(kind, 'art-' + kind);
  return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="300" fill="hsl(${h} 50% 97%)"/>
    <circle cx="150" cy="150" r="120" fill="hsl(${h} 70% 92%)"/>
    <g transform="translate(28,28) scale(3.8)">${inner}</g>
  </svg>`;
}

function heroDecoCluster() {
  const items = [
    ['phone', 'hd-phone', 'hero-deco-a'],
    ['audio', 'hd-audio', 'hero-deco-b'],
    ['tv', 'hd-tv', 'hero-deco-c'],
    ['laptop', 'hd-laptop', 'hero-deco-d'],
    ['home', 'hd-home', 'hero-deco-e'],
  ];
  return `<div class="hero-deco" aria-hidden="true">${items.map(([kind, id, cls]) => `<span class="${cls}">${heroDeviceArt(kind, id)}</span>`).join('')}</div>`;
}

module.exports = { icon, kindOf, catIcon, art, heroDeviceArt, heroDecoCluster, PATHS };
