/* ═══════════════════════════════════════════════
   TEMPLATE: classic
   The original lavender letter with tear-open
   envelope, interactive flowers, sparkle effects.
   
   Export: window.LetterTemplates['classic']
═══════════════════════════════════════════════ */
(function () {

    function render(letter, container) {
        const s = letter.style || {};
        const c = letter.content || {};
        const e = letter.envelope || {};
        const dec = c.decorations || {};

        const accentColor = s.accentColor || '#6e42bd';
        const titleColor = s.titleColor || '#5530a0';
        const bodyColor = s.bodyColor || '#3d2d5e';
        const tearColor = s.tearColor || '#c4b4f4';
        const hdrFrom = s.headerGradientFrom || '#f0ebff';
        const hdrTo = s.headerGradientTo || '#ddd4f9';
        const envColor = e.color || '#ddd4f9';
        const envBorder = e.borderColor || '#c4b4f4';
        const cornerFlowers = dec.cornerFlowers || ['🌸', '🪻', '✨', '💜'];
        const topFlowers = dec.topFlowers || ['🪻', '💜', '🌸'];
        const bottomFlowers = dec.bottomFlowers || ['🌷', '🪻', '🌷'];
        const dividerFlower = dec.dividerFlower || '🪻';

        // Build paragraphs HTML
        const paragraphsHTML = (c.paragraphs || []).map(p => {
            // *italic* support
            const html = p.replace(/\*(.*?)\*/g, '<em>$1</em>');
            return `<p>${html}</p>`;
        }).join('\n');

        // Flower rows
        const topRow = topFlowers.map(f =>
            `<span class="ornament" data-sparkle="${f}">${f}</span>`).join('');
        const botRow = bottomFlowers.map(f =>
            `<span class="ornament" data-sparkle="${f}">${f}</span>`).join('');
        const corners = cornerFlowers.map(f =>
            `<span class="corner-flower" data-sparkle="${f}">${f}</span>`).join('');

        // Date
        const dateStr = c.date === 'auto'
            ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : (c.date || '');

        container.innerHTML = `
      <style>
        #${letter.id}-card .letter-header {
          background: linear-gradient(135deg, ${hdrFrom}, ${hdrTo});
        }
        #${letter.id}-card .letter-title { color: ${titleColor}; }
        #${letter.id}-card .letter-body  { color: ${bodyColor}; }
        #${letter.id}-card .salutation   { color: ${accentColor}; }
        #${letter.id}-card .sign-off     { color: ${accentColor}; }
        #${letter.id}-card .sig-name     { color: ${titleColor}; }
        #${letter.id}-env .env-back     { background: ${envColor}; }
        #${letter.id}-env              { border-color: ${envBorder}; }
        #${letter.id}-env .ps-cover    { background: ${envColor}; }
        #${letter.id}-env .ps-perf     {
          background: repeating-linear-gradient(
            90deg,
            transparent 0px, transparent 4px,
            ${envBorder} 4px, ${envBorder} 7px,
            transparent 7px, transparent 8px
          );
        }
        #${letter.id}-env .env-text h3 {
          font-family: '${s.font || "Dancing Script"}', cursive, serif;
          font-size: 1.15rem; color: ${titleColor}; font-weight: 600;
        }
        #${letter.id}-env .env-text p  { color: ${accentColor}; font-size: .85rem; }
        #${letter.id}-env .env-icon    { font-size: 2.2rem; }
      </style>

      <!-- Envelope -->
      <div class="env-seal" id="${letter.id}-env" data-letter="${letter.id}">
        <div class="env-back" style="padding-bottom:1.2rem; padding-top:1rem;">
          <div class="env-icon">${e.icon || '🌸'}</div>
          <div class="env-text">
            <h3>${e.title || 'A Letter'}</h3>
            <p>${e.subtitle || ''}</p>
          </div>
        </div>
        <!-- peel strip injected by setupTear -->
      </div>

      <!-- Letter card -->
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

        // Wire up ornament sparkles
        container.querySelectorAll('.ornament, .corner-flower').forEach(el => {
            el.addEventListener('click', ev => {
                ev.stopPropagation();
                window.sparkle && window.sparkle(ev, el.dataset.sparkle || '✨');
            });
        });

        // Init tear
        const envEl = container.querySelector(`#${letter.id}-env`);
        if (envEl && window.setupTear) window.setupTear(envEl);
    }

    // Register template
    window.LetterTemplates = window.LetterTemplates || {};
    window.LetterTemplates['classic'] = { render };

})();