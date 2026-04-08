import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import TutorCourseCreatePage from "@/app/tutor/courses/new/page";

// Basic FileReader mock to support cover upload preview logic
class MockFileReader {
  public result: string | ArrayBuffer | null = null;
  public onloadend: null | (() => void) = null;

  readAsDataURL(_file: Blob) {
    this.result = "data:image/png;base64,ZmFrZS1pbWFnZQ==";
    if (this.onloadend) this.onloadend();
  }
}

describe("TutorCourseCreatePage wizard", () => {
  const originalFileReader = global.FileReader;
  const originalFetch = global.fetch;

  beforeAll(() => {
    // @ts-expect-error override for tests
    global.FileReader = MockFileReader;
  });

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://example.com/cover.png" }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.FileReader = originalFileReader;
    global.fetch = originalFetch;
  });

  it("allows completing the wizard and submits payload once requirements are met", async () => {
    render(<TutorCourseCreatePage />);

    // Basics step: fill required fields
    fireEvent.change(screen.getByPlaceholderText("e.g., Advanced SQL Bootcamp"), { target: { value: "Test Course" } });
    fireEvent.change(screen.getByPlaceholderText("One-line promise"), { target: { value: "Great tagline" } });
    fireEvent.change(screen.getByPlaceholderText("e.g., Data science"), { target: { value: "Data" } });
    fireEvent.change(screen.getByPlaceholderText("Detail what learners will accomplish."), {
      target: { value: "Comprehensive description" },
    });

    const fileInput = screen.getByLabelText(/Cover image/i);
    const file = new File(["fake"], "cover.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Next enabled after basics complete (wait for async upload state settle)
    const nextButton = screen.getByRole("button", { name: "Next" });
    await waitFor(() => expect(nextButton).not.toBeDisabled());
    fireEvent.click(nextButton);

    // Sections step: add a module to satisfy requirement
    fireEvent.change(screen.getByPlaceholderText("Lesson title"), { target: { value: "Intro" } });
    fireEvent.click(screen.getByRole("button", { name: /add module/i }));
    expect(screen.getByText("Intro")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Assessments step: final exam is optional, so proceed
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Review step: submit
    const submitButtons = screen.getAllByRole("button", { name: "Submit course for review" });
    const submitButton = submitButtons[submitButtons.length - 1];
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tutor/courses",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });
});
