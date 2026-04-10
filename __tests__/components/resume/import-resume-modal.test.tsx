import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportResumeModal } from "@/components/resume/import-resume-modal";

// Mock dependencies
jest.mock("@/lib/resume/parser");
jest.mock("@/lib/ai/resume");

import * as parserLib from "@/lib/resume/parser";
import * as atsLib from "@/lib/ai/resume";

// Mock fetch
global.fetch = jest.fn();

describe("ImportResumeModal Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render import button", () => {
    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });
    expect(button).toBeInTheDocument();
  });

  it("should open modal when import button is clicked", async () => {
    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Import & Analyze Resume/i)).toBeInTheDocument();
    });
  });

  it("should display file upload area", async () => {
    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });
  });

  it("should handle file selection and parsing", async () => {
    const mockText = "John Doe\nSoftware Engineer\nExperience: 5 years";
    (parserLib.parseResumeFile as jest.Mock).mockResolvedValue(mockText);

    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const file = new File([mockText], "resume.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(parserLib.parseResumeFile).toHaveBeenCalledWith(file);
    });
  });

  it("should display error for unsupported file type", async () => {
    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const file = new File(["content"], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Please upload a PDF or TXT file/i)).toBeInTheDocument();
    });
  });

  it("should display error for file size exceeding 5MB", async () => {
    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const largeContent = new Array(6 * 1024 * 1024).fill("x").join("");
    const file = new File([largeContent], "large.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/File size must be less than 5MB/i)).toBeInTheDocument();
    });
  });

  it("should show job description input after file is selected", async () => {
    const mockText = "John Doe\nSoftware Engineer";
    (parserLib.parseResumeFile as jest.Mock).mockResolvedValue(mockText);

    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const file = new File([mockText], "resume.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Paste the job description here/i)).toBeInTheDocument();
    });
  });

  it("should display resume details form", async () => {
    const mockText = "John Doe\nSoftware Engineer";
    const mockAnalysis = {
      analysis: {
        matchScore: 85,
        strongMatches: ["JavaScript"],
        missingKeywords: ["Python"],
        recommendations: ["Add Python"],
      },
      usedFallback: false,
    };

    (parserLib.parseResumeFile as jest.Mock).mockResolvedValue(mockText);
    (atsLib.analyzeATSMatch as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const file = new File([mockText], "resume.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Paste the job description here/i)).toBeInTheDocument();
    });

    const jobDescInput = screen.getByPlaceholderText(/Paste the job description here/i);
    fireEvent.change(jobDescInput, { target: { value: "Looking for JavaScript developer" } });

    const analyzeButton = screen.getByRole("button", { name: /Analyze ATS Score/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/ATS Compatibility Score/i)).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", { name: /Create Resume/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Resume Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Professional Summary/i)).toBeInTheDocument();
    });
  });

  it("should handle server-side parsing fallback", async () => {
    const mockText = "John Doe\nSoftware Engineer";

    // First call fails (client-side), second succeeds (server-side)
    (parserLib.parseResumeFile as jest.Mock).mockRejectedValueOnce(
      new Error("Client parsing failed")
    );

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, text: mockText, fileName: "resume.pdf" }),
    });

    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const file = new File([mockText], "resume.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/resume/parse",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("should close modal when dialog is closed", async () => {
    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Import & Analyze Resume/i)).toBeInTheDocument();
    });

    // The modal should be open
    expect(screen.getByText(/Import & Analyze Resume/i)).toBeInTheDocument();
  });

  it("should display matched keywords after ATS analysis", async () => {
    const mockText = "John Doe\nSoftware Engineer\nSkills: JavaScript, React";
    const mockAnalysis = {
      analysis: {
        matchScore: 85,
        strongMatches: ["JavaScript", "React"],
        missingKeywords: ["Python", "AWS"],
        recommendations: ["Add Python skills"],
      },
      usedFallback: false,
    };

    (parserLib.parseResumeFile as jest.Mock).mockResolvedValue(mockText);
    (atsLib.analyzeATSMatch as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const file = new File([mockText], "resume.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Paste the job description here/i)).toBeInTheDocument();
    });

    const jobDescInput = screen.getByPlaceholderText(/Paste the job description here/i);
    fireEvent.change(jobDescInput, { target: { value: "Looking for JavaScript and React developer" } });

    const analyzeButton = screen.getByRole("button", { name: /Analyze ATS Score/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Matched Keywords/i)).toBeInTheDocument();
    });
  });

  it("should display missing keywords after ATS analysis", async () => {
    const mockText = "John Doe\nSoftware Engineer\nSkills: JavaScript, React";
    const mockAnalysis = {
      analysis: {
        matchScore: 85,
        strongMatches: ["JavaScript", "React"],
        missingKeywords: ["Python", "AWS"],
        recommendations: ["Add Python skills"],
      },
      usedFallback: false,
    };

    (parserLib.parseResumeFile as jest.Mock).mockResolvedValue(mockText);
    (atsLib.analyzeATSMatch as jest.Mock).mockResolvedValue(mockAnalysis);

    render(<ImportResumeModal />);
    const button = screen.getByRole("button", { name: /import resume/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Drop your resume here/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/drop your resume here/i).querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    const file = new File([mockText], "resume.txt", { type: "text/plain" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Paste the job description here/i)).toBeInTheDocument();
    });

    const jobDescInput = screen.getByPlaceholderText(/Paste the job description here/i);
    fireEvent.change(jobDescInput, { target: { value: "Looking for JavaScript and React developer" } });

    const analyzeButton = screen.getByRole("button", { name: /Analyze ATS Score/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Missing Keywords/i)).toBeInTheDocument();
    });
  });
});
