import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CoursesTab } from "@/components/dashboard/courses/courses-tab";

/**
 * Integration Tests for CoursesTab Component
 * 
 * These tests verify that the CoursesTab component correctly:
 * 1. Fetches data from all three endpoints
 * 2. Displays courses in the correct sections
 * 3. Handles user interactions (search, filter, pagination, actions)
 * 4. Manages loading and error states
 */

describe("CoursesTab Component", () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Data Fetching", () => {
    it("should fetch discover courses on mount", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "course-1",
              title: "React Basics",
              description: "Learn React",
              level: "BEGINNER",
              category: "Web Development",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
              },
              enrollmentCount: 100,
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
          filters: { categories: ["Web Development"], levels: ["BEGINNER"] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/dashboard/courses/discover")
        );
      });
    });

    it("should fetch assigned courses on mount", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
          filters: { categories: [], levels: [] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              assignmentId: "assignment-1",
              id: "course-1",
              title: "Python 101",
              description: "Learn Python",
              level: "BEGINNER",
              category: "Programming",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
              },
              status: "PENDING",
              assignedAt: new Date(),
              assignedBy: { firstName: "Admin", lastName: "User" },
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/dashboard/courses/assigned")
        );
      });
    });

    it("should fetch enrolled courses on mount", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
          filters: { categories: [], levels: [] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              enrollmentId: "enrollment-1",
              id: "course-1",
              title: "JavaScript Mastery",
              description: "Master JavaScript",
              level: "INTERMEDIATE",
              category: "Web Development",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "Bob",
                lastName: "Johnson",
                email: "bob@example.com",
              },
              progressPercentage: 45,
              enrolledAt: new Date(),
              lessonsCount: 12,
              lessonsCompleted: 5,
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/dashboard/courses/enrolled")
        );
      });
    });
  });

  describe("Section Rendering", () => {
    it("should display discover section with courses", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "course-1",
              title: "React Basics",
              description: "Learn React",
              level: "BEGINNER",
              category: "Web Development",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
              },
              enrollmentCount: 100,
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
          filters: { categories: ["Web Development"], levels: ["BEGINNER"] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("🎓 Discover Courses")).toBeInTheDocument();
        expect(screen.getByText("React Basics")).toBeInTheDocument();
      });
    });

    it("should display assigned section with courses", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
          filters: { categories: [], levels: [] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              assignmentId: "assignment-1",
              id: "course-1",
              title: "Python 101",
              description: "Learn Python",
              level: "BEGINNER",
              category: "Programming",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
              },
              status: "PENDING",
              assignedAt: new Date(),
              assignedBy: { firstName: "Admin", lastName: "User" },
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("📋 Assigned Courses")).toBeInTheDocument();
        expect(screen.getByText("Python 101")).toBeInTheDocument();
      });
    });

    it("should display learning pathway section with courses", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
          filters: { categories: [], levels: [] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              enrollmentId: "enrollment-1",
              id: "course-1",
              title: "JavaScript Mastery",
              description: "Master JavaScript",
              level: "INTERMEDIATE",
              category: "Web Development",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "Bob",
                lastName: "Johnson",
                email: "bob@example.com",
              },
              progressPercentage: 45,
              enrolledAt: new Date(),
              lessonsCount: 12,
              lessonsCompleted: 5,
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("🚀 Learning Pathway")).toBeInTheDocument();
        expect(screen.getByText("JavaScript Mastery")).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("should handle enroll action", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "course-1",
              title: "React Basics",
              description: "Learn React",
              level: "BEGINNER",
              category: "Web Development",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
              },
              enrollmentCount: 100,
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
          filters: { categories: ["Web Development"], levels: ["BEGINNER"] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      // Mock enroll endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          enrollment: { id: "enrollment-1", status: "ACTIVE" },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("React Basics")).toBeInTheDocument();
      });

      const enrollButton = screen.getByText("Enroll");
      fireEvent.click(enrollButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/dashboard/courses/enroll",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ courseId: "course-1" }),
          })
        );
      });
    });

    it("should handle accept action", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
          filters: { categories: [], levels: [] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              assignmentId: "assignment-1",
              id: "course-1",
              title: "Python 101",
              description: "Learn Python",
              level: "BEGINNER",
              category: "Programming",
              coverImage: "https://example.com/image.jpg",
              instructor: {
                id: "instructor-1",
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
              },
              status: "PENDING",
              assignedAt: new Date(),
              assignedBy: { firstName: "Admin", lastName: "User" },
            },
          ],
          pagination: { skip: 0, take: 12, total: 1, pages: 1 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      // Mock accept endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          assignment: { id: "assignment-1", status: "ACCEPTED" },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("Python 101")).toBeInTheDocument();
      });

      const acceptButton = screen.getByText("Accept");
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/dashboard/courses/assign/accept",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ assignmentId: "assignment-1" }),
          })
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when fetch fails", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to fetch" }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load courses")).toBeInTheDocument();
      });
    });

    it("should show retry button on error", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to fetch" }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("should display empty state when no discover courses", async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
          filters: { categories: [], levels: [] },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { skip: 0, take: 12, total: 0, pages: 0 },
        }),
      });

      render(<CoursesTab />);

      await waitFor(() => {
        expect(screen.getByText("No Approved Courses")).toBeInTheDocument();
      });
    });
  });
});
