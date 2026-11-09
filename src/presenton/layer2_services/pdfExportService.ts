/**
 * Layer 2 — High-Resolution 16:9 Multi-Page PDF Deck Exporter
 * Renders all slides into a dedicated widescreen print/PDF iframe so it works inside sandboxed environments
 * without calling window.open.
 */

import { PresentonDeck } from "../layer1_data/presentonTypes";
import { PRESENTON_THEMES, DEFAULT_PRESENTON_THEME_ID } from "../layer1_data/presentonThemes";

export function exportPresentonDeckToPdf(deck: PresentonDeck): void {
  const theme = PRESENTON_THEMES[deck.themeId] || PRESENTON_THEMES[DEFAULT_PRESENTON_THEME_ID];

  const existingIframe = document.getElementById("presenton-pdf-print-frame");
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "presenton-pdf-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const slidesHtml = deck.slides
    .map((s) => {
      const metricsHtml =
        s.metrics && s.metrics.length > 0
          ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px;">
              ${s.metrics
                .slice(0, 3)
                .map(
                  (m) => `<div style="padding:18px;border-radius:14px;background:${theme.cardSurface};border:1px solid ${theme.cardBorder};">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${theme.accentHex};font-weight:700;">${m.label}</div>
                    <div style="font-size:28px;font-weight:800;color:${theme.textPrimary};margin:6px 0;">${m.value}</div>
                    <div style="font-size:12px;color:${theme.textSecondary};">${m.description || m.delta || ""}</div>
                  </div>`
                )
                .join("")}
            </div>`
          : "";

      const bulletsHtml =
        s.bullets && s.bullets.length > 0
          ? `<ul style="margin:20px 0 0 0;padding-left:20px;display:flex;flex-direction:column;gap:12px;">
              ${s.bullets
                .map(
                  (b) =>
                    `<li style="font-size:16px;line-height:1.55;color:${theme.textSecondary};">${b}</li>`
                )
                .join("")}
            </ul>`
          : "";

      return `<section class="slide-page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${theme.accentHex};">${s.categoryTag || `SLIDE 0${s.slideNumber}`}</span>
          <span style="font-size:11px;color:${theme.textMuted};">${deck.title} • ${s.slideNumber}/${deck.slides.length}</span>
        </div>
        <h1 style="font-size:32px;font-weight:800;color:${theme.textPrimary};margin:0 0 10px 0;line-height:1.2;">${s.title}</h1>
        <p style="font-size:16px;color:${theme.textSecondary};margin:0 0 18px 0;">${s.subtitle || ""}</p>
        ${bulletsHtml}
        ${metricsHtml}
        ${
          s.callout
            ? `<div style="margin-top:auto;padding:14px 18px;border-radius:12px;background:${theme.badgeBg};color:${theme.badgeText};font-size:13px;font-weight:600;">
                ${s.callout}
              </div>`
            : ""
        }
      </section>`;
    })
    .join("\n");

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <title>${deck.title || "Presenton Presentation"}</title>
  <style>
    @page { size: 11in 6.1875in; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${theme.fontBody}; background: ${theme.canvasBg}; }
    .slide-page {
      width: 11in;
      height: 6.1875in;
      padding: 0.55in 0.65in;
      background: ${theme.slideSurface};
      color: ${theme.textPrimary};
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
    }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 350);
}
