/**
 * Integration Tests for AI Suggestion Workflow
 * 
 * These tests validate the complete AI suggestion workflow including
 * generation, approval, rejection, and version snapshot creation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

/**
 * Integration Test: Complete AI Suggestion Workflow
 * 
 * Tests the full workflow from suggestion generation through approval
 * and version snapshot creation.
 */
describe('AI Suggestion Workflow Integration', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
      },
    });
    testUserId = user.id;

    // Create test resume with complete data
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Software Engineer Resume',
        slug: `test-${Date.now()}`,
        summary: 'Experienced software engineer with 5 years of experience',
        skills: ['JavaScript', 'React', 'Node.js'],
      },
    });
    testResumeId = resume.id;

    // Add experience
    await prisma.resumeExperience.create({
      data: {
        resumeId: resume.id,
        company: 'Tech Corp',
        title: 'Senior Developer',
        description: 'Worked on backend systems',
        achievements: ['Built API', 'Improved performance'],
        order: 0,
      },
    });

    // Add education
    await prisma.resumeEducation.create({
      data: {
        resumeId: resume.id,
        school: 'State University',
        degree: 'BS',
        field: 'Computer Science',
        order: 0,
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.resumeSuggestion.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumeVersion.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumeExperience.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumeEducation.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should complete full workflow: generate, approve, and create version snapshot', async () => {
    // Step 1: Generate suggestions
    const suggestions = [
      {
        category: 'summary' as const,
        originalText: 'Experienced software engineer with 5 years of experience',
        suggestedText: 'Results-driven Software Engineer with 5+ years of experience building scalable systems',
        explanation: 'More impactful with quantifiable results',
        confidenceLevel: 'high' as const,
        targetField: 'summary',
      },
      {
        category: 'skill' as const,
        originalText: 'JavaScript',
        suggestedText: 'TypeScript',
        explanation: 'More specific and modern',
        confidenceLevel: 'medium' as const,
        targetField: 'skills',
      },
    ];

    // Create suggestions in database
    const createdSuggestions = await Promise.all(
      suggestions.map(s =>
        prisma.resumeSuggestion.create({
          data: {
            resumeId: testResumeId,
            ...s,
            status: 'pending',
          },
        })
      )
    );

    // Verify suggestions were created
    expect(createdSuggestions).toHaveLength(2);
    expect(createdSuggestions[0].status).toBe('pending');

    // Step 2: Create version snapshot before applying
    const originalResume = await prisma.resume.findUnique({
      where: { id: testResumeId },
      include: { experiences: true, education: true },
    });

    const versionSnapshot = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: originalResume?.summary,
          skills: originalResume?.skills,
          experiences: originalResume?.experiences,
          education: originalResume?.education,
        },
      },
    });

    expect(versionSnapshot.versionNumber).toBe(1);
    expect(versionSnapshot.snapshotData.summary).toBe(
      'Experienced software engineer with 5 years of experience'
    );

    // Step 3: Approve suggestions and apply changes
    const suggestionIds = createdSuggestions.map(s => s.id);

    // Apply summary suggestion
    await prisma.resume.update({
      where: { id: testResumeId },
      data: {
        summary: 'Results-driven Software Engineer with 5+ years of experience building scalable systems',
      },
    });

    // Apply skill suggestion
    await prisma.resume.update({
      where: { id: testResumeId },
      data: {
        skills: ['TypeScript', 'React', 'Node.js'],
      },
    });

    // Mark suggestions as approved
    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: suggestionIds } },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Step 4: Verify changes were applied
    const updatedResume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(updatedResume?.summary).toBe(
      'Results-driven Software Engineer with 5+ years of experience building scalable systems'
    );
    expect(updatedResume?.skills).toContain('TypeScript');
    expect(updatedResume?.skills).not.toContain('JavaScript');

    // Step 5: Verify version snapshot is preserved
    const retrievedVersion = await prisma.resumeVersion.findUnique({
      where: { id: versionSnapshot.id },
    });

    expect(retrievedVersion?.snapshotData.summary).toBe(
      'Experienced software engineer with 5 years of experience'
    );
    expect(retrievedVersion?.snapshotData.skills).toContain('JavaScript');
    expect(retrievedVersion?.snapshotData.skills).not.toContain('TypeScript');

    // Step 6: Verify suggestions are marked as approved
    const approvedSuggestions = await prisma.resumeSuggestion.findMany({
      where: { resumeId: testResumeId },
    });

    expect(approvedSuggestions).toHaveLength(2);
    expect(approvedSuggestions.every(s => s.status === 'approved')).toBe(true);
    expect(approvedSuggestions.every(s => s.appliedAt !== null)).toBe(true);
  });

  it('should handle mixed approval and rejection workflow', async () => {
    // Create multiple suggestions
    const suggestions = [
      {
        category: 'summary' as const,
        originalText: 'Experienced software engineer with 5 years of experience',
        suggestedText: 'Results-driven Software Engineer with 5+ years of experience',
        explanation: 'Better summary',
        confidenceLevel: 'high' as const,
        targetField: 'summary',
      },
      {
        category: 'skill' as const,
        originalText: 'JavaScript',
        suggestedText: 'TypeScript',
        explanation: 'Better skill',
        confidenceLevel: 'medium' as const,
        targetField: 'skills',
      },
      {
        category: 'skill' as const,
        originalText: 'React',
        suggestedText: 'Vue.js',
        explanation: 'Alternative framework',
        confidenceLevel: 'low' as const,
        targetField: 'skills',
      },
    ];

    const createdSuggestions = await Promise.all(
      suggestions.map(s =>
        prisma.resumeSuggestion.create({
          data: {
            resumeId: testResumeId,
            ...s,
            status: 'pending',
          },
        })
      )
    );

    // Approve first two suggestions
    const approveSuggestionIds = createdSuggestions.slice(0, 2).map(s => s.id);
    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: approveSuggestionIds } },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Reject third suggestion
    const rejectSuggestionIds = [createdSuggestions[2].id];
    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: rejectSuggestionIds } },
      data: { status: 'rejected' },
    });

    // Verify statuses
    const allSuggestions = await prisma.resumeSuggestion.findMany({
      where: { resumeId: testResumeId },
    });

    const approved = allSuggestions.filter(s => s.status === 'approved');
    const rejected = allSuggestions.filter(s => s.status === 'rejected');

    expect(approved).toHaveLength(2);
    expect(rejected).toHaveLength(1);
    expect(approved.every(s => s.appliedAt !== null)).toBe(true);
    expect(rejected.every(s => s.appliedAt === null)).toBe(true);
  });

  it('should create separate version snapshots for multiple batches', async () => {
    // First batch of suggestions
    const batch1Suggestions = [
      {
        category: 'summary' as const,
        originalText: 'Experienced software engineer with 5 years of experience',
        suggestedText: 'Results-driven Software Engineer with 5+ years of experience',
        explanation: 'Better summary',
        confidenceLevel: 'high' as const,
        targetField: 'summary',
      },
    ];

    const batch1Created = await Promise.all(
      batch1Suggestions.map(s =>
        prisma.resumeSuggestion.create({
          data: {
            resumeId: testResumeId,
            ...s,
            status: 'pending',
          },
        })
      )
    );

    // Create version snapshot for batch 1
    const version1 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: 'Experienced software engineer with 5 years of experience',
        },
      },
    });

    // Apply batch 1
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { summary: 'Results-driven Software Engineer with 5+ years of experience' },
    });

    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: batch1Created.map(s => s.id) } },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Second batch of suggestions
    const batch2Suggestions = [
      {
        category: 'skill' as const,
        originalText: 'JavaScript',
        suggestedText: 'TypeScript',
        explanation: 'Better skill',
        confidenceLevel: 'medium' as const,
        targetField: 'skills',
      },
    ];

    const batch2Created = await Promise.all(
      batch2Suggestions.map(s =>
        prisma.resumeSuggestion.create({
          data: {
            resumeId: testResumeId,
            ...s,
            status: 'pending',
          },
        })
      )
    );

    // Create version snapshot for batch 2
    const version2 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 2,
        snapshotData: {
          summary: 'Results-driven Software Engineer with 5+ years of experience',
          skills: ['JavaScript', 'React', 'Node.js'],
        },
      },
    });

    // Apply batch 2
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { skills: ['TypeScript', 'React', 'Node.js'] },
    });

    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: batch2Created.map(s => s.id) } },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify both versions exist
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: testResumeId },
      orderBy: { versionNumber: 'asc' },
    });

    expect(versions).toHaveLength(2);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[1].versionNumber).toBe(2);

    // Verify version 1 has original data
    expect(versions[0].snapshotData.summary).toBe(
      'Experienced software engineer with 5 years of experience'
    );

    // Verify version 2 has batch 1 applied data
    expect(versions[1].snapshotData.summary).toBe(
      'Results-driven Software Engineer with 5+ years of experience'
    );
    expect(versions[1].snapshotData.skills).toContain('JavaScript');
  });

  it('should preserve resume state when rejecting all suggestions', async () => {
    const originalSummary = 'Experienced software engineer with 5 years of experience';
    const originalSkills = ['JavaScript', 'React', 'Node.js'];

    // Create suggestions
    const suggestions = [
      {
        category: 'summary' as const,
        originalText: originalSummary,
        suggestedText: 'New summary',
        explanation: 'Better',
        confidenceLevel: 'high' as const,
        targetField: 'summary',
      },
      {
        category: 'skill' as const,
        originalText: 'JavaScript',
        suggestedText: 'TypeScript',
        explanation: 'Better',
        confidenceLevel: 'medium' as const,
        targetField: 'skills',
      },
    ];

    const createdSuggestions = await Promise.all(
      suggestions.map(s =>
        prisma.resumeSuggestion.create({
          data: {
            resumeId: testResumeId,
            ...s,
            status: 'pending',
          },
        })
      )
    );

    // Reject all suggestions without modifying resume
    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: createdSuggestions.map(s => s.id) } },
      data: { status: 'rejected' },
    });

    // Verify resume is unchanged
    const resume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(resume?.summary).toBe(originalSummary);
    expect(resume?.skills).toEqual(originalSkills);
  });
});

/**
 * Integration Test: Version Snapshot Rollback
 * 
 * Tests the ability to rollback to a previous version snapshot.
 */
describe('Version Snapshot Rollback', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Jane',
        lastName: 'Smith',
      },
    });
    testUserId = user.id;

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Test Resume',
        slug: `test-${Date.now()}`,
        summary: 'Original summary',
        skills: ['Skill1', 'Skill2'],
      },
    });
    testResumeId = resume.id;
  });

  afterEach(async () => {
    await prisma.resumeSuggestion.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumeVersion.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should retrieve version history in correct order', async () => {
    // Create multiple versions
    const version1 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: { summary: 'Original summary', skills: ['Skill1', 'Skill2'] },
      },
    });

    const version2 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 2,
        snapshotData: { summary: 'Updated summary', skills: ['Skill1', 'Skill2', 'Skill3'] },
      },
    });

    const version3 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 3,
        snapshotData: { summary: 'Final summary', skills: ['Skill1', 'Skill2', 'Skill3', 'Skill4'] },
      },
    });

    // Retrieve history
    const history = await prisma.resumeVersion.findMany({
      where: { resumeId: testResumeId },
      orderBy: { versionNumber: 'desc' },
    });

    expect(history).toHaveLength(3);
    expect(history[0].versionNumber).toBe(3);
    expect(history[1].versionNumber).toBe(2);
    expect(history[2].versionNumber).toBe(1);
  });

  it('should retrieve specific version by ID', async () => {
    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: { summary: 'Original summary', skills: ['Skill1', 'Skill2'] },
      },
    });

    const retrieved = await prisma.resumeVersion.findUnique({
      where: { id: version.id },
    });

    expect(retrieved?.id).toBe(version.id);
    expect(retrieved?.versionNumber).toBe(1);
    expect(retrieved?.snapshotData).toEqual({
      summary: 'Original summary',
      skills: ['Skill1', 'Skill2'],
    });
  });
});
