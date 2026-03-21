/* ═══════════════════════════════════════════════
   TEMPLATE: classic
   Export: window.LetterTemplates['classic']
═══════════════════════════════════════════════ */
(function () {

  /* ── Color helpers ─────────────────────────────
     All math in HSL so saturation is preserved.
     hexDeriveStrip: drops L to 62% of original,
       scales S to 60% — produces a deep, rich band
       from any pastel envelope color.
       e.g. #ddd4f9 → #755cc2 (vs target #794fc8 ✓)
     hexMix: linear blend for the notch midtone.
  ─────────────────────────────────────────────── */
  function hexToRgb(hex) {
    const n = parseInt((hex || '#ddd4f9').replace('#', ''), 16);
    return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
  }

  function rgbToHls(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        default: h = ((r - g) / d + 4) / 6;
      }
    }
    return [h, l, s];
  }

  function hlsToRgb(h, l, s) {
    if (s === 0) return [l, l, l];
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
  }

  function toHex(r, g, b) {
    return '#' + [r, g, b].map(x => Math.min(255, Math.max(0, Math.round(x * 255))).toString(16).padStart(2, '0')).join('');
  }

  function hexDeriveStrip(envHex) {
    const [r, g, b] = hexToRgb(envHex);
    const [h, l, s] = rgbToHls(r, g, b);
    // Drop lightness to 62%, scale saturation to 60% — matches #ddd4f9 → ~#794fc8
    const newL = Math.max(0, Math.min(1, l * 0.62));
    const newS = Math.max(0, Math.min(1, s * 0.60));
    return toHex(...hlsToRgb(h, newL, newS));
  }

  function hexDeriveNotch(envHex, stripHex) {
    // 55% blend toward strip — sits clearly between envelope and strip
    const e = hexToRgb(envHex);
    const s = hexToRgb(stripHex);
    return toHex(...e.map((c, i) => c * 0.45 + s[i] * 0.55));
  }

  /* ── Render ──────────────────────────────────── */
  function render(letter, container) {
    const s = letter.style || {};
    const c = letter.content || {};
    const e = letter.envelope || {};
    const dec = c.decorations || {};

    const accentColor = s.accentColor || '#6e42bd';
    const titleColor = s.titleColor || '#5530a0';
    const bodyColor = s.bodyColor || '#3d2d5e';
    const hdrFrom = s.headerGradientFrom || '#f0ebff';
    const hdrTo = s.headerGradientTo || '#ddd4f9';
    const envColor = e.color || '#ddd4f9';
    const envBorder = e.borderColor || '#c4b4f4';

    // Auto-derive strip and notch from envelope color
    const stripColor = hexDeriveStrip(envColor);
    const stripDeep = hexDeriveStrip(stripColor); // one more level for gradient depth
    const notchColor = hexDeriveNotch(envColor, stripColor);

    const cornerFlowers = dec.cornerFlowers || ['🌸', '🪻', '✨', '💜'];
    const topFlowers = dec.topFlowers || ['🪻', '💜', '🌸'];
    const bottomFlowers = dec.bottomFlowers || ['🌷', '🪻', '🌷'];
    const dividerFlower = dec.dividerFlower || '🪻';

    const paragraphsHTML = (c.paragraphs || []).map(p =>
      `<p>${p.replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>`
    ).join('\n');

    const topRow = topFlowers.map(f => `<span class="ornament" data-sparkle="${f}">${f}</span>`).join('');
    const botRow = bottomFlowers.map(f => `<span class="ornament" data-sparkle="${f}">${f}</span>`).join('');
    const corners = cornerFlowers.map(f => `<span class="corner-flower" data-sparkle="${f}">${f}</span>`).join('');

    const dateStr = c.date === 'auto'
      ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : (c.date || '');

    container.innerHTML = `
      <style>
        #${letter.id}-card .letter-header { background: linear-gradient(135deg, ${hdrFrom}, ${hdrTo}); }
        #${letter.id}-card .letter-title  { color: ${titleColor}; }
        #${letter.id}-card .letter-body   { color: ${bodyColor}; }
        #${letter.id}-card .salutation    { color: ${accentColor}; }
        #${letter.id}-card .sign-off      { color: ${accentColor}; }
        #${letter.id}-card .sig-name      { color: ${titleColor}; }

        #${letter.id}-env .env-back       { background: ${envColor}; }
        #${letter.id}-env                 { border-color: ${envBorder}; }
        #${letter.id}-env .ps-cover       { background: ${envColor}; }

        /* Strip: deep gradient from envelope's own hue, much darker */
        #${letter.id}-env .ps-inner {
          background: linear-gradient(90deg, ${stripDeep} 0%, ${stripColor} 55%, ${notchColor} 100%);
        }

        /* Notch tab: midpoint — clearly distinct from both envelope and strip */
        #${letter.id}-env .ps-notch { background: ${notchColor}; }

        /* Perforation dots in white for contrast against dark strip */
        #${letter.id}-env .ps-perf {
          background: repeating-linear-gradient(
            90deg,
            transparent 0px, transparent 4px,
            rgba(255,255,255,0.6) 4px, rgba(255,255,255,0.6) 7px,
            transparent 7px, transparent 8px
          );
        }

        #${letter.id}-env .env-text h3 {
          font-family: '${s.font || 'Dancing Script'}', cursive, serif;
          font-size: 1.15rem; color: ${titleColor}; font-weight: 600;
        }
        #${letter.id}-env .env-text p  { color: ${accentColor}; font-size: .85rem; }
        #${letter.id}-env .env-icon    { font-size: 2.2rem; }
      </style>

      <div class="env-seal" id="${letter.id}-env" data-letter="${letter.id}">
        <div class="env-back" style="padding-bottom:1.2rem;padding-top:1rem;">
          <div class="env-icon">${e.icon || '🌸'}</div>
          <div class="env-text">
            <h3>${e.title || 'A Letter'}</h3>
            <p>${e.subtitle || ''}</p>
          </div>
        </div>
      </div>

      <div class="letter-card" id="${letter.id}-card">
        <div class="letter-header">
          ${corners}
          <p class="letter-date">${dateStr}</p>
          <h2 class="letter-title">${c.title || ''}</h2>
        </div>
        <div class="letter-body">
          <div class="flower-row">${topRow}</div>
          <p class="salutation">${c.salutation || ''}</p>
          ${paragraphsHTML}
          <div class="letter-divider">
            <span class="ornament" data-sparkle="${dividerFlower}">${dividerFlower}</span>
          </div>
          <div class="flower-row">${botRow}</div>
          <p class="sign-off">${c.signOff || ''}</p>
          <p class="sig-name">${c.name || ''}</p>
        </div>
        <div class="letter-footer">
          <button class="close-letter-btn" onclick="window.closeLetter('${letter.id}')">✕ Close</button>
          <button class="download-btn" onclick="window.downloadLetter('${letter.id}')">⬇ Save Letter</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.ornament, .corner-flower').forEach(el => {
      el.addEventListener('click', ev => {
        ev.stopPropagation();
        window.sparkle && window.sparkle(ev, el.dataset.sparkle || '✨');
      });
    });

    const envEl = container.querySelector(`#${letter.id}-env`);
    if (envEl && window.setupTear) window.setupTear(envEl);
  }

  window.LetterTemplates = window.LetterTemplates || {};
  window.LetterTemplates['classic'] = { render };

})();