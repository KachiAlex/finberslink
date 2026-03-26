/**
 * Resume file parser
 * Extracts text content from PDF and TXT files
 */

export async function parseResumeFile(file: File): Promise<string> {
  const fileType = file.type;

  if (fileType === "text/plain") {
    return await parseTextFile(file);
  } else if (fileType === "application/pdf") {
    return await parsePdfFile(file);
  } else {
    throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
  }
}

async function parseTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        reject(new Error("Failed to read text file"));
      }
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read text file"));
    };
    reader.readAsText(file);
  });
}

async function parsePdfFile(file: File): Promise<string> {
  try {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist");
    
    // Set up the worker
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}
