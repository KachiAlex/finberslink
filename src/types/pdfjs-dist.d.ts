// Stub for pdfjs-dist types to satisfy tsc during dynamic imports
declare module 'pdfjs-dist/legacy/build/pdf' {
  const lib: any;
  export = lib;
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const workerCode: any;
  export = workerCode;
}
