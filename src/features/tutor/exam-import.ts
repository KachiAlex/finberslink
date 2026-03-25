import { randomUUID } from "crypto";
import * as XLSX from "xlsx";

export type ImportedExamModule = {
  id: string;
  type: "MCQ" | "SHORT_ANSWER" | "UPLOAD";
  prompt: string;
  choices?: string[];
  answer?: string;
};

export type ExamImportIssue = {
  row: number;
  message: string;
};

export type ExamImportResult = {
  modules: ImportedExamModule[];
  issues: ExamImportIssue[];
};

const normalizeHeader = (raw: string) => raw.trim().toLowerCase().replace(/[^a-z]/g, "");

const LETTERS = ["A", "B", "C", "D", "E"] as const;

const gatherOptions = (row: Record<string, string>) =>
  LETTERS.map((letter) => row[`option${letter.toLowerCase()}`] || row[`choice${letter.toLowerCase()}`] || "")
    .map((value) => value.trim())
    .filter(Boolean);

const resolveQuestionType = (rawType: string) => {
  const normalized = rawType.trim().toLowerCase();
  if (!normalized) return "MCQ" as const;
  if (["mcq", "objective", "multiplechoice", "multiple choice"].includes(normalized)) return "MCQ" as const;
  if (["truefalse", "true/false", "tf", "boolean", "yesno", "yes/no"].includes(normalized)) return "TRUE_FALSE" as const;
  if (["essay", "subjective", "shortanswer", "short answer"].includes(normalized)) return "SHORT_ANSWER" as const;
  if (["upload", "file", "assignment"].includes(normalized)) return "UPLOAD" as const;
  return "MCQ" as const;
};

const letterToIndex = (raw: string) => {
  const normalized = raw.trim().toUpperCase();
  const idx = LETTERS.indexOf(normalized as typeof LETTERS[number]);
  return idx === -1 ? null : idx;
};

const normalizeAnswer = (answer: string) => answer.trim();

export function parseExamImport(buffer: ArrayBuffer): ExamImportResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No sheets found in workbook");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rows.length === 0) {
    throw new Error("Sheet is empty");
  }

  const issues: ExamImportIssue[] = [];
  const modules: ImportedExamModule[] = [];

  rows.forEach((rawRow, idx) => {
    const normalizedRow: Record<string, string> = {};

    Object.entries(rawRow).forEach(([key, value]) => {
      const normalizedKey = normalizeHeader(key);
      if (!normalizedKey) return;
      normalizedRow[normalizedKey] = String(value ?? "").trim();
    });

    const rowNumber = idx + 2; // account for header row
    const prompt = normalizedRow.question || normalizedRow.prompt || normalizedRow.stem || "";
    if (!prompt.trim()) {
      issues.push({ row: rowNumber, message: "Question/prompt is required" });
      return;
    }

    const typeRaw = normalizedRow.type || normalizedRow.questiontype || "";
    const resolved = resolveQuestionType(typeRaw);

    if (resolved === "UPLOAD") {
      modules.push({ id: randomUUID(), type: "UPLOAD", prompt: prompt.trim() });
      return;
    }

    if (resolved === "SHORT_ANSWER") {
      const answer = normalizedRow.answer || normalizedRow.correctanswer || normalizedRow.answerkey || "";
      modules.push({ id: randomUUID(), type: "SHORT_ANSWER", prompt: prompt.trim(), answer: answer.trim() || undefined });
      return;
    }

    const answerRaw =
      normalizedRow.answer ||
      normalizedRow.correctanswer ||
      normalizedRow.correctoption ||
      normalizedRow.answerkey ||
      normalizedRow.response ||
      "";

    if (resolved === "TRUE_FALSE") {
      const answerNormalized = normalizeAnswer(answerRaw).toLowerCase();
      if (!["true", "false", "t", "f", "yes", "no"].includes(answerNormalized)) {
        issues.push({ row: rowNumber, message: "True/False rows require an answer of True or False" });
        return;
      }
      const normalizedAnswer = ["true", "t", "yes"].includes(answerNormalized) ? "True" : "False";
      modules.push({
        id: randomUUID(),
        type: "MCQ",
        prompt: prompt.trim(),
        choices: ["True", "False"],
        answer: normalizedAnswer,
      });
      return;
    }

    const options = gatherOptions(normalizedRow);
    if (options.length < 2) {
      issues.push({ row: rowNumber, message: "MCQ rows require at least two options (A-D)" });
      return;
    }

    let resolvedAnswer = normalizeAnswer(answerRaw);
    if (!resolvedAnswer) {
      issues.push({ row: rowNumber, message: "MCQ rows must include a correct answer" });
      return;
    }

    const letterIndex = letterToIndex(resolvedAnswer);
    if (letterIndex !== null) {
      resolvedAnswer = options[letterIndex] ?? "";
    }

    if (!options.some((option) => option.toLowerCase() === resolvedAnswer.toLowerCase())) {
      issues.push({ row: rowNumber, message: "Correct answer must match one of the provided options" });
      return;
    }

    modules.push({
      id: randomUUID(),
      type: "MCQ",
      prompt: prompt.trim(),
      choices: options,
      answer: resolvedAnswer,
    });
  });

  return { modules, issues };
}
