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
    // Try text fallback for unknown mime types (some older browsers/systems don't set mime types)
    try {
      return await parseTextFile(file);
    } catch (_fallbackErr) {
      throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
    }
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
    let pdfjsLib: any;
    let workerSrcSet = false;

    try {
      pdfjsLib = await import("pdfjs-dist");
    } catch (importErr) {
      throw new Error("PDF.js library not available. Please try uploading as TXT or contact support.");
    }

    // Try to set up a worker URL if in browser
    if (typeof window !== "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (pdfjsLib.GlobalWorkerOptions) {
          // Use a CDN URL for the worker (cdn is slow but works when bundler doesn't help)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          workerSrcSet = true;
        }
      } catch (_workerErr) {
        // Worker setup failed, we'll disable it below
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const getDocOpts: any = { data: new Uint8Array(arrayBuffer) };

    // If we couldn't set up a worker in the browser, disable it (runs on main thread)
    if (!workerSrcSet && typeof window !== "undefined") {
      getDocOpts.disableWorker = true;
    }

    let pdf;
    try {
      pdf = await pdfjsLib.getDocument(getDocOpts).promise;
    } catch (docErr) {
      // If loading failed and we haven't disabled worker yet, try disabling it
      if (!getDocOpts.disableWorker) {
        getDocOpts.disableWorker = true;
        pdf = await pdfjsLib.getDocument(getDocOpts).promise;
      } else {
        throw docErr;
      }
    }

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || "")
          .join(" ");
        fullText += pageText + "\n";
      } catch (pageErr) {
        // Skip pages with extraction errors and continue
        console.warn(`[parsePdfFile] Failed to extract page ${pageNum}:`, pageErr);
      }
    }

    if (!fullText.trim()) {
      throw new Error("PDF contains no extractable text. Try uploading as TXT or using OCR externally.");
    }

    return fullText;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}
