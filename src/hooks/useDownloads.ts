import type { JobResultResponse } from "@/types/aurascript";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function safeFilename(jobId: string): string {
  return `aurascript_${jobId.slice(0, 8)}`;
}

export function useDownloads(result: JobResultResponse | null) {
  const filename = result ? safeFilename(result.job_id) : "transcript";

  async function downloadTxt() {
    if (!result) return;
    triggerDownload(
      new Blob([result.transcript], { type: "text/plain;charset=utf-8" }),
      `${filename}.txt`
    );
  }

  async function downloadJson() {
    if (!result) return;
    triggerDownload(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
      `${filename}.json`
    );
  }

  async function downloadDocx() {
    if (!result) return;
    const { Document, Paragraph, TextRun, Packer } = await import("docx");
    const lines = result.transcript.split("\n").filter(Boolean);
    const doc = new Document({
      sections: [{
        properties: {},
        children: lines.map(line =>
          new Paragraph({
            children: [new TextRun({ text: line, font: "Calibri", size: 24 })],
            spacing: { after: 120 },
          })
        ),
      }],
    });
    triggerDownload(await Packer.toBlob(doc), `${filename}.docx`);
  }

  async function downloadPdf() {
    if (!result) return;
    const { default: jsPDF } = await import("jspdf");
    const doc   = new jsPDF({ unit: "mm", format: "a4" });
    const lines = doc.splitTextToSize(result.transcript, 170) as string[];
    doc.setFont("helvetica").setFontSize(10);
    let y = 20;
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 20, y);
      y += 6;
    }
    doc.save(`${filename}.pdf`);
  }

  function copyToClipboard(): Promise<void> {
    if (!result) return Promise.resolve();
    return navigator.clipboard.writeText(result.transcript);
  }

  return { downloadTxt, downloadJson, downloadDocx, downloadPdf, copyToClipboard };
}
