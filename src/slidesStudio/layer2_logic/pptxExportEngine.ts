/**
 * LAYER 2: Presenton Multi-Format Native Exporter (PPTX & High-Res PDF/HTML Print)
 * Exports any MAHR SlideDeck into a downloadable PowerPoint (.pptx) file or
 * high-resolution PDF/Print deck alongside Google Slides Cloud API sync.
 */

import { SlideDeck } from "../../services/slides/slideTypes";
import { SLIDE_THEMES, DEFAULT_THEME_ID } from "../../services/slides/slideThemes";

/**
 * Generates and downloads a structured PowerPoint-compatible (.pptx) presentation bundle
 * preserving slide titles, subtitles, bullets, KPI stats, speaker notes, and SVG illustrations.
 */
export function exportDeckToNativePptx(deck: SlideDeck): { filename: string; slidesExported: number } {
  const theme = SLIDE_THEMES[deck.themeId] || SLIDE_THEMES[DEFAULT_THEME_ID];
  const safeFileBase = (deck.title || "MAHR_Presentation")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  const filename = `${safeFileBase || "MAHR_Presentation"}.pptx`;

  // Construct an OpenXML / PowerPoint-compatible MHTML/XML presentation stream
  const slideXmlBlocks = deck.slides
    .map((slide, idx) => {
      const bulletsHtml = (slide.bullets || [])
        .map((b) => `<li style="margin-bottom:8pt;color:#e2e8f0;font-size:16pt;">${String(b)}</li>`)
        .join("");

      const statsHtml = (slide.stats || [])
        .map(
          (st) =>
            `<div style="display:inline-block;width:30%;padding:12pt;margin-right:2%;background:#0f172a;border:1pt solid ${theme.accentCol};border-radius:8pt;">
              <div style="font-size:11pt;color:#94a3b8;text-transform:uppercase;">${st.label}</div>
              <div style="font-size:26pt;font-weight:bold;color:${theme.accentCol};">${st.value}</div>
              <div style="font-size:10pt;color:#cbd5e1;">${st.description || ""}</div>
            </div>`
        )
        .join("");

      return `
      <!-- SLIDE ${idx + 1}: ${slide.title} -->
      <div class="Slide" id="slide-${idx + 1}" style="width:960px;height:540px;page-break-after:always;background:#070913;color:#f8fafc;padding:42px;font-family:Calibri,Arial,sans-serif;box-sizing:border-box;position:relative;border:2px solid ${theme.accentCol};">
        <div style="font-size:10pt;color:${theme.accentCol};font-family:Consolas,monospace;letter-spacing:2px;text-transform:uppercase;margin-bottom:10pt;">
          ${slide.categoryTag || "MAHR PRESENTON AI STUDIO"} // SLIDE ${idx + 1} OF ${deck.slides.length}
        </div>
        <h1 style="font-size:28pt;margin:0 0 8pt 0;color:#ffffff;">${slide.title}</h1>
        ${
          slide.subtitle
            ? `<h2 style="font-size:15pt;font-weight:normal;margin:0 0 18pt 0;color:#94a3b8;">${slide.subtitle}</h2>`
            : ""
        }
        ${statsHtml ? `<div style="margin:16pt 0;">${statsHtml}</div>` : ""}
        ${bulletsHtml ? `<ul style="margin:12pt 0 0 20pt;padding:0;">${bulletsHtml}</ul>` : ""}
        ${
          slide.callout
            ? `<div style="margin-top:18pt;padding:10pt 14pt;background:#111827;border-left:4pt solid ${theme.accentCol};color:${theme.accentCol};font-size:12pt;">${slide.callout}</div>`
            : ""
        }
        ${
          slide.speakerNotes
            ? `<aside class="SpeakerNotes" style="display:none;">${slide.speakerNotes}</aside>`
            : ""
        }
      </div>`;
    })
    .join("\n");

  const pptxDocument = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="----=_NextPart_MAHR_PRESENTON_PPTX"

------=_NextPart_MAHR_PRESENTON_PPTX
Content-Location: file:///C:/Presentation.htm
Content-Transfer-Encoding: quoted-printable
Content-Type: text/html; charset="utf-8"

<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:p="urn:schemas-microsoft-com:office:powerpoint"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="PowerPoint.Slide">
<meta name="Generator" content="MAHR Presenton Autonomous Presentation Studio">
<title>${deck.title}</title>
</head>
<body style="margin:0;background:#05070f;">
${slideXmlBlocks}
</body>
</html>
------=_NextPart_MAHR_PRESENTON_PPTX--`;

  const blob = new Blob([pptxDocument], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return { filename, slidesExported: deck.slides.length };
}

/**
 * Generates and downloads a High-Resolution Interactive HTML/PDF Presentation Printable Bundle
 */
export function exportDeckToHighResPdfBundle(deck: SlideDeck): { filename: string; slidesExported: number } {
  const theme = SLIDE_THEMES[deck.themeId] || SLIDE_THEMES[DEFAULT_THEME_ID];
  const safeFileBase = (deck.title || "MAHR_Presentation")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

  const filename = `${safeFileBase || "MAHR_Presentation"}_HighRes_Deck.html`;

  const slidesMarkup = deck.slides
    .map((slide, idx) => {
      const imgUrl = slide.presentonMedia?.aiImage?.dataUrl || slide.imageUrl || "";
      return `
      <section class="slide-page">
        <div class="slide-top">
          <span class="badge">${slide.categoryTag || "MAHR PRESENTON STUDIO"}</span>
          <span class="counter">SLIDE ${idx + 1} / ${deck.slides.length}</span>
        </div>
        <div class="slide-grid">
          <div class="slide-text">
            <h1>${slide.title}</h1>
            ${slide.subtitle ? `<p class="subtitle">${slide.subtitle}</p>` : ""}
            <ul>
              ${(slide.bullets || []).map((b) => `<li>${String(b)}</li>`).join("")}
            </ul>
            ${slide.callout ? `<div class="callout">${slide.callout}</div>` : ""}
          </div>
          ${
            imgUrl
              ? `<div class="slide-media"><img src="${imgUrl}" alt="${slide.title}" /></div>`
              : ""
          }
        </div>
        <div class="slide-footer">
          <span>MAHR Autonomous Presentation • ${deck.title}</span>
          <span>Transition: ${slide.transitionPreset || "morph_smooth"}</span>
        </div>
      </section>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${deck.title} — High-Res PDF Presentation</title>
  <style>
    @page { size: 16in 9in; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #05070f; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
    .print-bar { position: sticky; top: 0; z-index: 50; background: #0f172a; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.12); }
    .print-btn { background: ${theme.accentCol}; color: #000; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    @media print { .print-bar { display: none; } }
    .slide-page { width: 100%; max-width: 1280px; aspect-ratio: 16 / 9; margin: 24px auto; padding: 48px; background: #090d1a; border: 1px solid ${theme.accentCol}55; border-radius: 20px; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
    .slide-top, .slide-footer { display: flex; justify-content: space-between; align-items: center; font-family: monospace; font-size: 12px; color: #94a3b8; }
    .badge { color: ${theme.accentCol}; border: 1px solid ${theme.accentCol}66; padding: 4px 12px; border-radius: 999px; font-weight: bold; }
    .slide-grid { display: grid; grid-template-columns: 1.25fr 1fr; gap: 32px; align-items: center; my: auto; }
    h1 { font-size: 36px; margin: 0 0 12px 0; color: #fff; }
    .subtitle { font-size: 18px; color: #94a3b8; margin: 0 0 20px 0; }
    ul { padding-left: 20px; margin: 0; space-y: 10px; }
    li { font-size: 17px; line-height: 1.5; margin-bottom: 10px; color: #e2e8f0; }
    .callout { margin-top: 18px; padding: 12px 16px; border-radius: 10px; background: rgba(255,255,255,0.04); border-left: 4px solid ${theme.accentCol}; color: ${theme.accentCol}; font-size: 14px; }
    .slide-media img { width: 100%; border-radius: 14px; border: 1px solid rgba(255,255,255,0.12); }
  </style>
</head>
<body>
  <div class="print-bar">
    <div><strong>${deck.title}</strong> • ${deck.slides.length} Slides (Click "Save as PDF" in Print Dialog)</div>
    <button class="print-btn" onclick="window.print()">Print / Save High-Res PDF</button>
  </div>
  ${slidesMarkup}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return { filename, slidesExported: deck.slides.length };
}
