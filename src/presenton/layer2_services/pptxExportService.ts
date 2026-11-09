/**
 * Layer 2 — Native Editable OpenXML PowerPoint (.pptx) Generator
 * Uses JSZip to build a standards-compliant 16:9 .pptx presentation with editable text boxes,
 * KPI cards, comparison columns, and themed backgrounds.
 */

import JSZip from "jszip";
import { PresentonDeck, PresentonSlide } from "../layer1_data/presentonTypes";
import { PRESENTON_THEMES, DEFAULT_PRESENTON_THEME_ID } from "../layer1_data/presentonThemes";

function escapeXml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildTextShapeXml(params: {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  paragraphs: Array<{
    text: string;
    fontSizePt: number;
    colorHex: string;
    bold?: boolean;
    bullet?: boolean;
  }>;
  fillHex?: string;
  borderHex?: string;
}): string {
  const { id, name, x, y, w, h, paragraphs, fillHex, borderHex } = params;

  const fillXml = fillHex
    ? `<a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill>`
    : `<a:noFill/>`;

  const lineXml = borderHex
    ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${borderHex}"/></a:solidFill></a:ln>`
    : "";

  const parasXml = paragraphs
    .map((p) => {
      const sz = Math.round(p.fontSizePt * 100);
      const bAttr = p.bold ? ` b="1"` : "";
      const bulletPrefix = p.bullet ? "•  " : "";
      return `<a:p>
        <a:pPr algn="l"><a:lnSpc><a:spcPct val="125000"/></a:lnSpc></a:pPr>
        <a:r>
          <a:rPr lang="en-US" sz="${sz}"${bAttr} dirty="0">
            <a:solidFill><a:srgbClr val="${p.colorHex}"/></a:solidFill>
            <a:latin typeface="Arial"/>
          </a:rPr>
          <a:t>${escapeXml(bulletPrefix + p.text)}</a:t>
        </a:r>
      </a:p>`;
    })
    .join("\n");

  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${id}" name="${escapeXml(name)}"/>
      <p:cNvSpPr txBox="1"/>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm>
        <a:off x="${x}" y="${y}"/>
        <a:ext cx="${w}" cy="${h}"/>
      </a:xfrm>
      <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 4000"/></a:avLst></a:prstGeom>
      ${fillXml}
      ${lineXml}
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="square" lIns="180000" tIns="140000" rIns="180000" bIns="140000">
        <a:spAutoFit/>
      </a:bodyPr>
      <a:lstStyle/>
      ${parasXml}
    </p:txBody>
  </p:sp>`;
}

function buildSlideXml(slide: PresentonSlide, themeId: string): string {
  const theme = PRESENTON_THEMES[themeId] || PRESENTON_THEMES[DEFAULT_PRESENTON_THEME_ID];
  const colors = theme.pptxColors;

  const shapes: string[] = [];

  // 1. Category / Slide Number Tag
  shapes.push(
    buildTextShapeXml({
      id: 2,
      name: "CategoryTag",
      x: 685800,
      y: 420000,
      w: 10800000,
      h: 400000,
      paragraphs: [
        {
          text: slide.categoryTag || `SLIDE ${slide.slideNumber}`,
          fontSizePt: 10,
          colorHex: colors.accent,
          bold: true
        }
      ]
    })
  );

  // 2. Slide Title
  shapes.push(
    buildTextShapeXml({
      id: 3,
      name: "SlideTitle",
      x: 685800,
      y: 820000,
      w: 10800000,
      h: 950000,
      paragraphs: [
        {
          text: slide.title,
          fontSizePt: slide.layout === "hero-cover" ? 30 : 24,
          colorHex: colors.title,
          bold: true
        }
      ]
    })
  );

  // 3. Subtitle
  if (slide.subtitle) {
    shapes.push(
      buildTextShapeXml({
        id: 4,
        name: "SlideSubtitle",
        x: 685800,
        y: 1750000,
        w: 10800000,
        h: 550000,
        paragraphs: [
          {
            text: slide.subtitle,
            fontSizePt: 13,
            colorHex: colors.body
          }
        ]
      })
    );
  }

  // 4. Layout-Specific Primary Content
  if (slide.layout === "kpi-metrics" && slide.metrics.length > 0) {
    const cols = slide.metrics.slice(0, 3);
    const cardW = 3450000;
    const gap = 220000;
    cols.forEach((m, idx) => {
      shapes.push(
        buildTextShapeXml({
          id: 10 + idx,
          name: `MetricCard_${idx + 1}`,
          x: 685800 + idx * (cardW + gap),
          y: 2500000,
          w: cardW,
          h: 2800000,
          fillHex: colors.cardBg,
          borderHex: colors.border,
          paragraphs: [
            { text: m.label.toUpperCase(), fontSizePt: 10, colorHex: colors.accent, bold: true },
            { text: m.value, fontSizePt: 28, colorHex: colors.title, bold: true },
            { text: m.delta || "", fontSizePt: 11, colorHex: colors.accent, bold: true },
            { text: m.description || "", fontSizePt: 11, colorHex: colors.body }
          ]
        })
      );
    });
  } else if (slide.layout === "comparison-grid" && slide.comparisonColumns.length >= 2) {
    slide.comparisonColumns.slice(0, 2).forEach((col, idx) => {
      const colW = 5250000;
      shapes.push(
        buildTextShapeXml({
          id: 20 + idx,
          name: `ComparisonCol_${idx + 1}`,
          x: 685800 + idx * (colW + 300000),
          y: 2450000,
          w: colW,
          h: 3100000,
          fillHex: colors.cardBg,
          borderHex: colors.border,
          paragraphs: [
            { text: `${col.heading} (${col.badge || ""})`, fontSizePt: 15, colorHex: colors.title, bold: true },
            ...col.points.map((pt) => ({
              text: pt,
              fontSizePt: 12,
              colorHex: colors.body,
              bullet: true
            }))
          ]
        })
      );
    });
  } else {
    // Bullets + Right Insight Card
    shapes.push(
      buildTextShapeXml({
        id: 30,
        name: "PrimaryBulletsCard",
        x: 685800,
        y: 2450000,
        w: 6800000,
        h: 3100000,
        fillHex: colors.cardBg,
        borderHex: colors.border,
        paragraphs: slide.bullets.map((b) => ({
          text: b,
          fontSizePt: 13,
          colorHex: colors.body,
          bullet: true
        }))
      })
    );

    const sideItems =
      slide.metrics.slice(0, 2).map((m) => `${m.label}: ${m.value} (${m.delta || ""})`) || [];
    shapes.push(
      buildTextShapeXml({
        id: 31,
        name: "SideSummaryCard",
        x: 7750000,
        y: 2450000,
        w: 3730000,
        h: 3100000,
        fillHex: colors.cardBg,
        borderHex: colors.border,
        paragraphs: [
          { text: "KEY BENCHMARKS & INSIGHTS", fontSizePt: 10, colorHex: colors.accent, bold: true },
          ...sideItems.map((line) => ({
            text: line,
            fontSizePt: 13,
            colorHex: colors.title,
            bold: true
          })),
          {
            text: slide.quote?.text || slide.callout || "",
            fontSizePt: 11,
            colorHex: colors.body
          }
        ]
      })
    );
  }

  // 5. Bottom Executive Callout Banner
  if (slide.callout) {
    shapes.push(
      buildTextShapeXml({
        id: 40,
        name: "BottomCallout",
        x: 685800,
        y: 5750000,
        w: 10800000,
        h: 620000,
        fillHex: colors.cardBg,
        borderHex: colors.accent,
        paragraphs: [
          {
            text: `KEY TAKEAWAY: ${slide.callout}`,
            fontSizePt: 11,
            colorHex: colors.title,
            bold: true
          }
        ]
      })
    );
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="${colors.background}"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/><a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${shapes.join("\n")}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

export async function exportPresentonDeckToPptx(deck: PresentonDeck): Promise<void> {
  const zip = new JSZip();
  const slides = deck.slides || [];

  // 1. [Content_Types].xml
  const slideContentTypes = slides
    .map(
      (_, idx) =>
        `<Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join("\n  ");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideContentTypes}
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  // 3. ppt/_rels/presentation.xml.rels
  const presRels = slides
    .map(
      (_, idx) =>
        `<Relationship Id="rIdSlide${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>`
    )
    .join("\n  ");

  zip.file(
    "ppt/_rels/presentation.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rIdTheme1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  ${presRels}
</Relationships>`
  );

  // 4. ppt/presentation.xml (16:9 Widescreen 12192000 x 6858000 EMUs)
  const sldIdLst = slides
    .map((_, idx) => `<p:sldId id="${256 + idx}" r:id="rIdSlide${idx + 1}"/>`)
    .join("\n    ");

  zip.file(
    "ppt/presentation.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rIdMaster1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${sldIdLst}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
  );

  // 5. Minimal SlideMaster, SlideLayout & Theme
  zip.file(
    "ppt/slideMasters/slideMaster1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rIdLayout1"/></p:sldLayoutIdLst>
</p:sldMaster>`
  );

  zip.file(
    "ppt/slideMasters/_rels/slideMaster1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rIdTheme1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
  );

  zip.file(
    "ppt/slideLayouts/slideLayout1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`
  );

  zip.file(
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
  );

  zip.file(
    "ppt/theme/theme1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="PresentonTheme">
  <a:themeElements>
    <a:clrScheme name="Presenton">
      <a:dk1><a:srgbClr val="0F172A"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
      <a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>
      <a:accent1><a:srgbClr val="6366F1"/></a:accent1>
      <a:accent2><a:srgbClr val="38BDF8"/></a:accent2>
      <a:accent3><a:srgbClr val="10B981"/></a:accent3>
      <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
      <a:accent5><a:srgbClr val="F43F5E"/></a:accent5>
      <a:accent6><a:srgbClr val="8B5CF6"/></a:accent6>
      <a:hlink><a:srgbClr val="38BDF8"/></a:hlink>
      <a:folHlink><a:srgbClr val="8B5CF6"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="PresentonFonts">
      <a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="PresentonFmt">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`
  );

  // 6. Generate each slide XML & relationship file
  slides.forEach((slide, idx) => {
    const slideNum = idx + 1;
    zip.file(`ppt/slides/slide${slideNum}.xml`, buildSlideXml(slide, deck.themeId));
    zip.file(
      `ppt/slides/_rels/slide${slideNum}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
    );
  });

  // 7. Trigger browser download
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  });

  const safeFilename =
    (deck.title || deck.topic || "presenton-deck")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "presenton-deck";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename}.pptx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
