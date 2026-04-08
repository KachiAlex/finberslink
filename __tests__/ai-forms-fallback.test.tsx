import { render, screen } from "@testing-library/react";
import { useFormState } from "react-dom";

import {
  ATSAnalysisForm,
  CoverLetterAIForm,
  SkillAnalysisForm,
} from "@/app/resume/[slug]/edit/ai-forms";

jest.mock("react-dom", () => {
  const actual = jest.requireActual("react-dom");
  return {
    ...actual,
    useFormState: jest.fn(),
  };
});

const mockUseFormState = useFormState as unknown as jest.Mock;

describe("AI form fallback banners", () => {
  beforeEach(() => {
    mockUseFormState.mockReset();
  });

  it("shows heuristic banner for ATS analysis fallback", () => {
    mockUseFormState.mockReturnValue([
      {
        status: "success",
        message: "Quota hit—showing heuristic ATS insights. Verify keywords manually.",
        usedFallback: true,
        analysis: {
          matchScore: 52,
          missingKeywords: ["Product Strategy"],
          strongMatches: ["Execution"],
          recommendations: ["Tailor keywords"],
          improvements: ["Add metrics"],
        },
      },
      jest.fn(),
    ]);

    render(<ATSAnalysisForm slug="demo" action={jest.fn()} />);

    expect(
      screen.getByText(/Quota hit—showing heuristic ATS insights\. Verify keywords manually\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Heuristic mode/i)).toBeInTheDocument();
  });

  it("shows template warning for cover letter fallback", () => {
    mockUseFormState.mockReturnValue([
      {
        status: "success",
        message: "Quota hit—using local template. Personalize before sending.",
        usedFallback: true,
        coverLetter: "Fallback cover letter body.",
      },
      jest.fn(),
    ]);

    render(<CoverLetterAIForm slug="demo" action={jest.fn()} />);

    expect(
      screen.getByText(/Quota hit—using local template\. Personalize before sending\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Generated from our local template—personalize before sending\./i),
    ).toBeInTheDocument();
  });

  it("shows offline suggestion warning for skill analysis fallback", () => {
    mockUseFormState.mockReturnValue([
      {
        status: "success",
        message: "Quota hit—showing offline skill suggestions. Review before applying.",
        usedFallback: true,
        analysis: {
          hardSkills: ["SQL"],
          softSkills: ["Leadership"],
          suggestedSkills: ["Stakeholder Management"],
          prioritySkills: ["SQL"],
        },
      },
      jest.fn(),
    ]);

    const onApply = jest.fn().mockResolvedValue(undefined);

    render(<SkillAnalysisForm slug="demo" action={jest.fn()} onApply={onApply} />);

    expect(
      screen.getByText(/Quota hit—showing offline skill suggestions\. Review before applying\./i),
    ).toBeInTheDocument();
  });
});
