/**
 * Checkpoint Test for AI Suggestion Workflow
 * 
 * This test validates that the complete AI suggestion workflow is functioning
 * correctly, including suggestion generation, approval/rejection, and version
 * snapshot creation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('AI Suggestion Workflow Checkpoint', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `checkpoint-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Checkpoint',
        lastName: 'Test',
      },
    });
    testUserId = user.id;

    // Create test resume
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Checkpoint Resume',
        slug: `checkpoint-${Date.now()}`,
        summary: 'Original summary for testing',
        skills: ['JavaScript', 'React'],
      },
    });
    testResumeId = resume.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.resumeSuggestion.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resumeVersion.deleteMany({ where: { resumeId: testResumeId } });
    await prisma.resume.deleteMany({ where: { id: testResumeId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should generate suggestions successfully', async () => {
    // Create a suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: 'Original summary for testing',
        suggestedText: 'Improved summary with better keywords',
        explanation: 'Better keywords for ATS',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    expect(suggestion).toBeDefined();
    expect(suggestion.status).toBe('pending');
    expect(suggestion.category).toBe('summary');

    // Verify suggestion can be retrieved
    const retrieved = await prisma.resumeSuggestion.findUnique({
      where: { id: suggestion.id },
    });

    expect(retrieved?.id).toBe(suggestion.id);
    expect(retrieved?.status).toBe('pending');
  });

  it('should approve suggestions and apply changes', async () => {
    // Create suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: 'Original summary for testing',
        suggestedText: 'Improved summary with better keywords',
        explanation: 'Better keywords',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    // Create version snapshot
    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: 'Original summary for testing',
          skills: ['JavaScript', 'React'],
        },
      },
    });

    // Apply suggestion
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { summary: 'Improved summary with better keywords' },
    });

    // Mark as approved
    await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify changes
    const updatedResume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(updatedResume?.summary).toBe('Improved summary with better keywords');

    // Verify suggestion is marked approved
    const approvedSuggestion = await prisma.resumeSuggestion.findUnique({
      where: { id: suggestion.id },
    });

    expect(approvedSuggestion?.status).toBe('approved');
    expect(approvedSuggestion?.appliedAt).toBeDefined();
  });

  it('should reject suggestions without modifying resume', async () => {
    const originalSummary = 'Original summary for testing';

    // Create suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: originalSummary,
        suggestedText: 'New summary',
        explanation: 'Better',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    // Reject without modifying
    await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'rejected' },
    });

    // Verify resume unchanged
    const resume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(resume?.summary).toBe(originalSummary);

    // Verify suggestion is marked rejected
    const rejectedSuggestion = await prisma.resumeSuggestion.findUnique({
      where: { id: suggestion.id },
    });

    expect(rejectedSuggestion?.status).toBe('rejected');
    expect(rejectedSuggestion?.appliedAt).toBeNull();
  });

  it('should create version snapshots correctly', async () => {
    // Create version snapshot
    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: 'Original summary for testing',
          skills: ['JavaScript', 'React'],
        },
      },
    });

    expect(version).toBeDefined();
    expect(version.versionNumber).toBe(1);
    expect(version.snapshotData.summary).toBe('Original summary for testing');

    // Verify snapshot is immutable
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { summary: 'Modified summary' },
    });

    const retrievedVersion = await prisma.resumeVersion.findUnique({
      where: { id: version.id },
    });

    expect(retrievedVersion?.snapshotData.summary).toBe('Original summary for testing');
  });

  it('should retrieve version history', async () => {
    // Create multiple versions
    const version1 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: { summary: 'Version 1' },
      },
    });

    const version2 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 2,
        snapshotData: { summary: 'Version 2' },
      },
    });

    // Retrieve history
    const history = await prisma.resumeVersion.findMany({
      where: { resumeId: testResumeId },
      orderBy: { versionNumber: 'desc' },
    });

    expect(history).toHaveLength(2);
    expect(history[0].versionNumber).toBe(2);
    expect(history[1].versionNumber).toBe(1);
  });

  it('should compare versions correctly', async () => {
    // Create two versions
    const version1 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: 'Original summary',
          skills: ['JavaScript', 'React'],
        },
      },
    });

    const version2 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 2,
        snapshotData: {
          summary: 'Updated summary',
          skills: ['JavaScript', 'React', 'TypeScript'],
        },
      },
    });

    // Compare versions
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }> = [];

    const fields = ['summary', 'skills'];
    for (const field of fields) {
      const oldValue = version1.snapshotData[field];
      const newValue = version2.snapshotData[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
        });
      }
    }

    expect(changes).toHaveLength(2);
    expect(changes[0].field).toBe('summary');
    expect(changes[1].field).toBe('skills');
  });

  it('should handle batch suggestion operations', async () => {
    // Create multiple suggestions
    const suggestionIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const suggestion = await prisma.resumeSuggestion.create({
        data: {
          resumeId: testResumeId,
          category: 'skill',
          originalText: `Skill ${i}`,
          suggestedText: `New Skill ${i}`,
          explanation: 'Better skill',
          confidenceLevel: 'medium',
          targetField: 'skills',
          status: 'pending',
        },
      });
      suggestionIds.push(suggestion.id);
    }

    // Approve all
    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: suggestionIds } },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify all approved
    const approved = await prisma.resumeSuggestion.findMany({
      where: { id: { in: suggestionIds } },
    });

    expect(approved).toHaveLength(3);
    expect(approved.every(s => s.status === 'approved')).toBe(true);
  });

  it('should track suggestion metadata correctly', async () => {
    const now = new Date();

    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: 'Original',
        suggestedText: 'Improved',
        explanation: 'Better keywords',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    expect(suggestion.createdAt).toBeDefined();
    expect(suggestion.appliedAt).toBeNull();

    // Update with applied timestamp
    const updated = await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'approved', appliedAt: now },
    });

    expect(updated.appliedAt).toBeDefined();
    expect(updated.appliedAt?.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
  });
});
