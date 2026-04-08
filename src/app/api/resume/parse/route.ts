import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side resume parsing fallback
 * POST /api/resume/parse
 * 
 * Accepts multipart/form-data with 'file' field
 * Returns { text: string } - extracted resume text
 * 
 * Used when client-side parsing fails due to worker/import issues
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const fileType = file.type;
    let text = "";

    if (fileType === "text/plain") {
      text = await file.text();
    } else if (fileType === "application/pdf") {
      text = await parsePdfServer(file);
    } else {
      // Try text parse as fallback for unknown types
      try {
        text = await file.text();
        if (!text.trim()) {
          throw new Error("File appears to be empty");
        }
      } catch {
        return NextResponse.json(
          { error: "Unsupported file type or empty file. Please upload a PDF or TXT file." },
          { status: 400 }
        );
      }
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "File is empty or contains no readable text" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[resume/parse] Error:", msg);
    return NextResponse.json(
      { error: `Resume parsing failed: ${msg}` },
      { status: 500 }
    );
  }
}

/**
 * Server-side PDF parsing using pdfjs-dist
 * Disables worker and runs parsing on the main thread for compatibility
 */
async function parsePdfServer(file: File): Promise<string> {
  try {
    // Minimal DOMMatrix polyfill for Node environments
    if (typeof (global as any).DOMMatrix === "undefined") {
      (global as any).DOMMatrix = class DOMMatrix {
        constructor() {}
      };
    }

    // Import pdfjs (prefer legacy build for Node)
    let pdfjsLib: any;
    try {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");
    } catch (e) {
      try {
        pdfjsLib = await import("pdfjs-dist");
      } catch (err) {
        throw new Error("PDF.js library not available on server");
      }
    }

    const arrayBuffer = await file.arrayBuffer();

    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableWorker: true,
    }).promise;

    let fullText = "";
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      try {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str || "").join(" ");
        fullText += pageText + "\n";
      } catch (pageErr) {
        console.warn(`[resume/parse] Failed to extract text from page ${pageNum}:`, pageErr);
      }
    }

    if (!fullText.trim()) {
      throw new Error("PDF contains no extractable text. Try uploading as TXT or using OCR externally.");
    }

    return fullText;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${(error as Error).message}`);
  }
}
