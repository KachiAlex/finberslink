import { describe, it, expect } from "@jest/globals";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Exploratory Test: Routing Conflict Detection
 * 
 * **Validates: Requirements 2.1**
 * 
 * This test explores the routing conflict bug condition by checking if both
 * [resumeId] and [slug] dynamic segment directories exist in the resume API routes.
 * 
 * EXPECTED BEHAVIOR ON UNFIXED CODE:
 * This test MUST FAIL on unfixed code because both directories exist,
 * which causes Next.js to throw a routing conflict error.
 * 
 * EXPECTED BEHAVIOR AFTER FIX:
 * This test MUST PASS after the fix to confirm only one dynamic segment exists.
 * 
 * BUG CONDITION:
 * Both src/app/api/resumes/[resumeId]/ AND src/app/api/resumes/[slug]/ directories exist
 * 
 * EXPECTED BEHAVIOR:
 * Only ONE dynamic segment directory should exist with unified naming convention
 */
describe("Exploratory Test: Routing Conflict with Dynamic Segments", () => {
  /**
   * Test: Verify routing conflict condition exists
   * 
   * This test checks if both [resumeId] and [slug] directories exist,
   * which is the bug condition that causes dev server startup to fail.
   * 
   * On UNFIXED code: Test FAILS (both directories exist - bug confirmed)
   * On FIXED code: Test PASSES (only one directory exists - bug fixed)
   * 
   * Validates: Requirement 2.1
   */
  it("should detect routing conflict when both [resumeId] and [slug] directories exist", () => {
    const resumesDir = path.join(process.cwd(), "src/app/api/resumes");
    
    // Check if both dynamic segment directories exist
    const resumeIdDirExists = fs.existsSync(path.join(resumesDir, "[resumeId]"));
    const slugDirExists = fs.existsSync(path.join(resumesDir, "[slug]"));
    
    // BUG CONDITION: Both directories exist
    const routingConflictExists = resumeIdDirExists && slugDirExists;
    
    // CRITICAL ASSERTION:
    // On unfixed code: This should be TRUE (bug exists)
    // On fixed code: This should be FALSE (bug is fixed)
    expect(routingConflictExists).toBe(false);
  });

  /**
   * Test: Verify only one dynamic segment directory exists
   * 
   * This test verifies that after the fix, only one dynamic segment
   * directory exists with a unified naming convention.
   * 
   * On UNFIXED code: Test FAILS (both directories exist)
   * On FIXED code: Test PASSES (only [resumeId] exists)
   * 
   * Validates: Requirement 2.1
   */
  it("should have only one dynamic segment directory for resume routes", () => {
    const resumesDir = path.join(process.cwd(), "src/app/api/resumes");
    
    // Check which directories exist
    const resumeIdDirExists = fs.existsSync(path.join(resumesDir, "[resumeId]"));
    const slugDirExists = fs.existsSync(path.join(resumesDir, "[slug]"));
    
    // CRITICAL ASSERTION:
    // Exactly one of these should be true (not both, not neither)
    const exactlyOneExists = (resumeIdDirExists && !slugDirExists) || (!resumeIdDirExists && slugDirExists);
    expect(exactlyOneExists).toBe(true);
    
    // CRITICAL ASSERTION:
    // The canonical naming should be [resumeId]
    expect(resumeIdDirExists).toBe(true);
    expect(slugDirExists).toBe(false);
  });

  /**
   * Test: Verify consolidated routes exist in [resumeId] directory
   * 
   * This test verifies that all route subdirectories have been consolidated
   * into the [resumeId] directory.
   * 
   * On UNFIXED code: Test FAILS (routes may be split between directories)
   * On FIXED code: Test PASSES (all routes are in [resumeId])
   * 
   * Validates: Requirement 2.1
   */
  it("should have all route subdirectories consolidated in [resumeId]", () => {
    const resumeIdDir = path.join(process.cwd(), "src/app/api/resumes/[resumeId]");
    
    // Expected subdirectories after consolidation
    const expectedSubdirs = ["experience", "export", "template", "update"];
    
    // Check if all expected subdirectories exist
    const allSubdirsExist = expectedSubdirs.every((subdir) => {
      const subdirPath = path.join(resumeIdDir, subdir);
      return fs.existsSync(subdirPath);
    });
    
    // CRITICAL ASSERTION:
    // All expected subdirectories should exist in [resumeId]
    expect(allSubdirsExist).toBe(true);
  });

  /**
   * Test: Verify [slug] directory is empty or deleted
   * 
   * This test verifies that the legacy [slug] directory has been removed
   * or is empty after consolidation.
   * 
   * On UNFIXED code: Test FAILS ([slug] directory exists with content)
   * On FIXED code: Test PASSES ([slug] directory is deleted)
   * 
   * Validates: Requirement 2.1
   */
  it("should have deleted or emptied the legacy [slug] directory", () => {
    const resumesDir = path.join(process.cwd(), "src/app/api/resumes");
    const slugDir = path.join(resumesDir, "[slug]");
    
    // CRITICAL ASSERTION:
    // The [slug] directory should not exist
    expect(fs.existsSync(slugDir)).toBe(false);
  });
});
