import { parse } from "node-html-parser";

function getInlineRuns(node, flags = {}) {
  let runs = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const text = child.rawText;
      if (text) runs.push({ text, ...flags });
    } else if (child.nodeType === 1) {
      const tag = child.rawTagName ? child.rawTagName.toLowerCase() : "";
      const newFlags = { ...flags };
      if (tag === "strong" || tag === "b") newFlags.bold = true;
      if (tag === "em" || tag === "i") newFlags.italic = true;
      if (tag === "u") newFlags.underline = true;
      if (tag === "s") newFlags.strike = true;
      if (tag === "br") {
        runs.push({ text: "\n", ...flags });
        continue;
      }
      runs = runs.concat(getInlineRuns(child, newFlags));
    }
  }
  return runs;
}

export function htmlToDocxParagraphs(TextRun, Paragraph, html, fontFamily, fontSizeHalfPoints) {
  const root = parse(html);
  const paragraphs = [];
  const blocks = root.childNodes.filter((n) => n.nodeType === 1);

  const makeRun = (r, sizeOverride) =>
    new TextRun({
      text: r.text,
      bold: !!r.bold,
      italics: !!r.italic,
      underline: r.underline ? {} : undefined,
      strike: !!r.strike,
      font: fontFamily,
      size: sizeOverride || fontSizeHalfPoints
    });

  for (const block of blocks) {
    const tag = block.rawTagName ? block.rawTagName.toLowerCase() : "";

    if (tag === "ul" || tag === "ol") {
      const items = block.querySelectorAll("li");
      items.forEach((li, idx) => {
        const prefix = tag === "ul" ? "\u2022 " : `${idx + 1}. `;
        const runs = getInlineRuns(li, {});
        const textRuns = [new TextRun({ text: prefix, font: fontFamily, size: fontSizeHalfPoints })];
        if (runs.length > 0) runs.forEach((r) => textRuns.push(makeRun(r)));
        paragraphs.push(new Paragraph({ children: textRuns }));
      });
      continue;
    }

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      const runs = getInlineRuns(block, { bold: true });
      const textRuns =
        runs.length > 0
          ? runs.map((r) => makeRun({ ...r, bold: true }, fontSizeHalfPoints + 4))
          : [new TextRun({ text: block.text || "", bold: true, font: fontFamily, size: fontSizeHalfPoints + 4 })];
      paragraphs.push(new Paragraph({ children: textRuns, spacing: { before: 200, after: 100 } }));
      continue;
    }

    const flags = tag === "blockquote" ? { italic: true } : {};
    const runs = getInlineRuns(block, flags);
    const textRuns =
      runs.length > 0
        ? runs.map((r) => makeRun(r))
        : [new TextRun({ text: block.text || "", font: fontFamily, size: fontSizeHalfPoints })];
    paragraphs.push(new Paragraph({ children: textRuns }));
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: root.text || "", font: fontFamily, size: fontSizeHalfPoints })] }));
  }

  return paragraphs;
}

export function renderHtmlToPdf(doc, html, pdfFont, bodyFontSize) {
  const root = parse(html);
  const blocks = root.childNodes.filter((n) => n.nodeType === 1);

  const pdfFontBold = pdfFont === "Helvetica" ? "Helvetica-Bold" : "Times-Bold";
  const pdfFontItalic = pdfFont === "Helvetica" ? "Helvetica-Oblique" : "Times-Italic";

  function renderRuns(runs, size) {
    runs.forEach((r, idx) => {
      let font = pdfFont;
      if (r.bold) font = pdfFontBold;
      else if (r.italic) font = pdfFontItalic;
      doc.font(font).fontSize(size).text(r.text, { continued: idx < runs.length - 1 });
    });
  }

  if (blocks.length === 0) {
    doc.font(pdfFont).fontSize(bodyFontSize).text(root.text || "", { align: "justify" });
    return;
  }

  for (const block of blocks) {
    const tag = block.rawTagName ? block.rawTagName.toLowerCase() : "";

    if (tag === "ul" || tag === "ol") {
      const items = block.querySelectorAll("li");
      items.forEach((li, idx) => {
        const prefix = tag === "ul" ? "\u2022 " : `${idx + 1}. `;
        const runs = getInlineRuns(li, {});
        doc.font(pdfFont).fontSize(bodyFontSize).text(prefix, { continued: runs.length > 0 });
        if (runs.length > 0) renderRuns(runs, bodyFontSize);
        doc.moveDown(0.3);
      });
      continue;
    }

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      const runs = getInlineRuns(block, { bold: true });
      if (runs.length > 0) renderRuns(runs, bodyFontSize + 2);
      else doc.font(pdfFontBold).fontSize(bodyFontSize + 2).text(block.text || "");
      doc.moveDown(0.5);
      continue;
    }

    const flags = tag === "blockquote" ? { italic: true } : {};
    const runs = getInlineRuns(block, flags);
    if (runs.length > 0) renderRuns(runs, bodyFontSize);
    else doc.font(pdfFont).fontSize(bodyFontSize).text(block.text || "", { align: "justify" });
    doc.moveDown(0.5);
  }
}
