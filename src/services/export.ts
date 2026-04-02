import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import * as fflate from "fflate";
import { ProjectWithRelations } from "../types";
import { calculateWordCount } from "./storage";

export type ExportFormat = "pdf" | "docx" | "epub" | "txt" | "json" | "html";

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

export async function exportProject(
  project: ProjectWithRelations,
  format: ExportFormat
): Promise<ExportResult> {
  const timestamp = new Date().toISOString().split("T")[0] || new Date().toISOString().slice(0, 10);
  const safeTitle = (project.title || "Untitled").replace(/[^a-zA-Z0-9]/g, "_");
  
  switch (format) {
    case "pdf":
      return exportToPDF(project, safeTitle, timestamp);
    case "docx":
      return exportToDOCX(project, safeTitle, timestamp);
    case "epub":
      return exportToEPUB(project, safeTitle, timestamp);
    case "txt":
      return exportToTXT(project, safeTitle, timestamp);
    case "json":
      return exportToJSON(project, safeTitle, timestamp);
    case "html":
      return exportToHTML(project, safeTitle, timestamp);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function exportToPDF(
  project: ProjectWithRelations,
  safeTitle: string,
  timestamp: string
): Promise<ExportResult> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 10; // Increased for professional spacing
  let yPos = margin;
  
  const addPageIfNeeded = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Standard Manuscript Format: Courier
  doc.setFont("courier", "normal");

  doc.setFontSize(24);
  doc.setFont("courier", "bold");
  const titleWidth = doc.getTextWidth(project.title);
  doc.text(project.title, (pageWidth - titleWidth) / 2, yPos);
  yPos += 15;
  
  doc.setFontSize(12);
  doc.setFont("courier", "normal");
  doc.setTextColor(100);
  doc.text(`Target: ${project.targetWordCount} words`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;
  
  doc.setTextColor(0);
  
  for (const chapter of project.chapters) {
    addPageIfNeeded(20);
    
    doc.setFontSize(18);
    doc.setFont("courier", "bold");
    doc.text(chapter.title, margin, yPos);
    yPos += 12;
    
    const chapterScenes = project.scenes
      .filter(s => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);
    
    for (const scene of chapterScenes) {
      addPageIfNeeded(10);
      
      doc.setFontSize(14);
      doc.setFont("courier", "bold");
      doc.text(scene.title, margin, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setFont("courier", "normal");
      
      const content = scene.content || "";
      const words = content.split(/\s+/);
      let line = "";
      
      for (const word of words) {
        const testLine = line + word + " ";
        const textWidth = doc.getTextWidth(testLine);
        
        if (textWidth > pageWidth - margin * 2) {
          addPageIfNeeded(lineHeight);
          doc.text(line, margin, yPos);
          yPos += lineHeight;
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        addPageIfNeeded(lineHeight);
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      }
      
      yPos += 5;
    }
    
    yPos += 10;
  }
  
  const pdfBlob = doc.output("blob");
  return {
    blob: pdfBlob,
    filename: `${safeTitle}_${timestamp}.pdf`,
    mimeType: "application/pdf"
  };
}

async function exportToDOCX(
  project: ProjectWithRelations,
  safeTitle: string,
  timestamp: string
): Promise<ExportResult> {
  const children: Paragraph[] = [];
  
  children.push(
    new Paragraph({
      text: project.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Target: ${project.targetWordCount} words | Status: ${project.status}`,
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    })
  );
  
  children.push(
    new Paragraph({
      text: "",
      spacing: { after: 400 }
    })
  );
  
  for (const chapter of project.chapters) {
    children.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );
    
    const chapterScenes = project.scenes
      .filter(s => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);
    
    for (const scene of chapterScenes) {
      children.push(
        new Paragraph({
          text: scene.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
      
      const content = scene.content || "";
      if (content) {
        const paragraphs = content.split(/\n\n+/);
        
        for (const para of paragraphs) {
          if (para.trim()) {
            children.push(
              new Paragraph({
                text: para.trim(),
                spacing: { after: 200 }
              })
            );
          }
        }
      }
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });
  
  const blob = await Packer.toBlob(doc);
  return {
    blob,
    filename: `${safeTitle}_${timestamp}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  };
}

function exportToTXT(
  project: ProjectWithRelations,
  safeTitle: string,
  timestamp: string
): ExportResult {
  let content = `${project.title}\n`;
  content += `=${"=".repeat(project.title.length)}\n\n`;
  content += `Target: ${project.targetWordCount} words | Status: ${project.status}\n`;
  content += `${"-".repeat(50)}\n\n`;
  
  for (const chapter of project.chapters) {
    content += `\n${chapter.title}\n`;
    content += `${"-".repeat(chapter.title.length)}\n\n`;
    
    const chapterScenes = project.scenes
      .filter(s => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);
    
    for (const scene of chapterScenes) {
      content += `${scene.title}\n\n`;
      content += scene.content + "\n\n";
    }
  }
  
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  return {
    blob,
    filename: `${safeTitle}_${timestamp}.txt`,
    mimeType: "text/plain"
  };
}

function exportToJSON(
  project: ProjectWithRelations,
  safeTitle: string,
  timestamp: string
): ExportResult {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  return {
    blob,
    filename: `${safeTitle}_${timestamp}.json`,
    mimeType: "application/json"
  };
}

function exportToHTML(
  project: ProjectWithRelations,
  safeTitle: string,
  timestamp: string
): ExportResult {
  const wordCount = project.scenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      max-width: 700px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.8;
      color: #333;
    }
    h1 {
      font-size: 2.5em;
      text-align: center;
      margin-bottom: 10px;
    }
    .meta {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
    }
    h2 {
      font-size: 1.8em;
      margin-top: 40px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    h3 {
      font-size: 1.4em;
      margin-top: 30px;
      color: #444;
    }
    p {
      margin-bottom: 1em;
      text-align: justify;
    }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  <p class="meta">Target: ${project.targetWordCount} words | Written: ${wordCount} words | Status: ${project.status}</p>
`;
  
  for (const chapter of project.chapters) {
    html += `  <h2>${chapter.title}</h2>\n`;
    
    const chapterScenes = project.scenes
      .filter(s => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);
    
    for (const scene of chapterScenes) {
      html += `  <h3>${scene.title}</h3>\n`;
      
      const content = scene.content || "";
      const paragraphs = content.split(/\n\n+/);
      
      for (const para of paragraphs) {
        if (para.trim()) {
          html += `  <p>${para.trim()}</p>\n`;
        }
      }
    }
  }
  
  html += `</body>\n</html>`;
  
  const blob = new Blob([html], { type: "text/html" });
  return {
    blob,
    filename: `${safeTitle}_${timestamp}.html`,
    mimeType: "text/html"
  };
}

export function downloadFile(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportToEPUB(
  project: ProjectWithRelations,
  safeTitle: string,
  timestamp: string
): ExportResult {
  const chapterData = project.chapters.map(chapter => {
    const chapterScenes = project.scenes
      .filter(s => s.chapterId === chapter.id)
      .sort((a, b) => a.order - b.order);
    
    let chapterBody = `  <h1>${escapeXML(chapter.title)}</h1>\n`;
    chapterScenes.forEach(scene => {
      chapterBody += `  <h2>${escapeXML(scene.title)}</h2>\n`;
      const paragraphs = scene.content.split(/\n\n+/);
      paragraphs.forEach(para => {
        if (para.trim()) {
          chapterBody += `  <p>${escapeXML(para.trim())}</p>\n`;
        }
      });
    });
    
    return { title: chapter.title, body: chapterBody };
  });

  const epubContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXML(project.title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Novel Studio User</dc:creator>
    <dc:identifier id="bookid">${safeTitle}_${timestamp}</dc:identifier>
    <meta name="generator">Novel Studio</meta>
  </metadata>
  <manifest>
    ${chapterData.map((_, i) => `<item id="chapter${i}" href="chapter${i}.xhtml" media-type="application/xhtml+xml"/>`).join("\n    ")}
  </manifest>
  <spine>
    ${chapterData.map((_, i) => `<itemref idref="chapter${i}"/>`).join("\n    ")}
  </spine>
</package>`;

  const epubData: Record<string, Uint8Array> = {
    "mimetype": fflate.strToU8("application/epub+zip"),
    "META-INF/container.xml": fflate.strToU8(`<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`),
    "content.opf": fflate.strToU8(epubContent),
  };

  chapterData.forEach((ch, i) => {
    const xhtmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXML(ch.title)}</title>
</head>
<body>
${ch.body}
</body>
</html>`;
    epubData[`chapter${i}.xhtml`] = fflate.strToU8(xhtmlContent);
  });

  const zipped = fflate.zipSync(epubData);
  const blob = new Blob([zipped], { type: "application/epub+zip" });

  return {
    blob,
    filename: `${safeTitle}_${timestamp}.epub`,
    mimeType: "application/epub+zip"
  };
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
