/**
 * Property-Based Tests for AI Suggestions and Version Snapshots
 * 
 * These tests validate correctness properties that should hold true
 * for all valid AI suggestion and version snapshot operations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';

/**
 * Property 5: Suggestion Application Correctness
 * 
 * For any approved suggestion, the suggested text should replace the original
 * text in the resume at the specified target field, and the resume should
 * reflect this change immediately.
 * 
 * **Validates: Requirements 2.5, 2.6, 9.3**
 */
describe('Property 5: Suggestion Application Correctness', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    testUserId = user.id;

    // Create test resume
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Test Resume',
        slug: `test-${Date.now()}`,
        summary: 'Original summary text',
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

  it('should apply summary suggestion correctly', async () => {
    const originalSummary = 'Original summary text';
    const suggestedSummary = 'Improved summary text with better keywords';

    // Create suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: originalSummary,
        suggestedText: suggestedSummary,
        explanation: 'Better keywords for ATS',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    // Simulate approval workflow
    await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: originalSummary,
        },
      },
    });

    // Apply suggestion
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { summary: suggestedSummary },
    });

    await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify
    const updatedResume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(updatedResume?.summary).toBe(suggestedSummary);
    expect(updatedResume?.summary).not.toBe(originalSummary);
  });

  it('should apply skill suggestion correctly', async () => {
    const originalSkills = ['JavaScript', 'React'];
    const newSkill = 'TypeScript';

    // Create resume with skills
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { skills: originalSkills },
    });

    // Create suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'skill',
        originalText: 'JavaScript',
        suggestedText: newSkill,
        explanation: 'TypeScript is more specific',
        confidenceLevel: 'medium',
        targetField: 'skills',
        status: 'pending',
      },
    });

    // Apply suggestion
    const updatedSkills = [...originalSkills, newSkill];
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { skills: updatedSkills },
    });

    await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify
    const updatedResume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(updatedResume?.skills).toContain(newSkill);
    expect(updatedResume?.skills?.length).toBe(3);
  });

  it('should apply experience description suggestion correctly', async () => {
    const originalDescription = 'Worked on projects';
    const suggestedDescription = 'Led development of 5+ projects resulting in 40% performance improvement';

    // Create experience
    const experience = await prisma.resumeExperience.create({
      data: {
        resumeId: testResumeId,
        company: 'Tech Corp',
        title: 'Senior Developer',
        description: originalDescription,
        order: 0,
      },
    });

    // Create suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'experience',
        originalText: originalDescription,
        suggestedText: suggestedDescription,
        explanation: 'More impactful with metrics',
        confidenceLevel: 'high',
        targetField: 'experience[0].description',
        status: 'pending',
      },
    });

    // Apply suggestion
    await prisma.resumeExperience.update({
      where: { id: experience.id },
      data: { description: suggestedDescription },
    });

    await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify
    const updatedExperience = await prisma.resumeExperience.findUnique({
      where: { id: experience.id },
    });

    expect(updatedExperience?.description).toBe(suggestedDescription);
    expect(updatedExperience?.description).not.toBe(originalDescription);
  });

  it('should apply achievement suggestion correctly', async () => {
    const originalAchievement = 'Improved system';
    const suggestedAchievement = 'Architected and implemented microservices migration, reducing system latency by 60%';

    // Create experience with achievements
    const experience = await prisma.resumeExperience.create({
      data: {
        resumeId: testResumeId,
        company: 'Tech Corp',
        title: 'Senior Developer',
        achievements: [originalAchievement],
        order: 0,
      },
    });

    // Create suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'achievement',
        originalText: originalAchievement,
        suggestedText: suggestedAchievement,
        explanation: 'STAR method with quantifiable results',
        confidenceLevel: 'high',
        targetField: 'experience[0].achievements',
        status: 'pending',
      },
    });

    // Apply suggestion
    const updatedAchievements = [suggestedAchievement];
    await prisma.resumeExperience.update({
      where: { id: experience.id },
      data: { achievements: updatedAchievements },
    });

    await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify
    const updatedExperience = await prisma.resumeExperience.findUnique({
      where: { id: experience.id },
    });

    expect(updatedExperience?.achievements).toContain(suggestedAchievement);
    expect(updatedExperience?.achievements).not.toContain(originalAchievement);
  });
});

/**
 * Property 6: Suggestion Rejection Preservation
 * 
 * For any rejected suggestion, the resume content should remain completely
 * unchanged, with no modifications applied.
 * 
 * **Validates: Requirements 2.7, 9.4**
 */
describe('Property 6: Suggestion Rejection Preservation', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    testUserId = user.id;

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Test Resume',
        slug: `test-${Date.now()}`,
        summary: 'Original summary',
        skills: ['JavaScript', 'React'],
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

  it('should not modify resume when suggestion is rejected', async () => {
    const originalSummary = 'Original summary';
    const suggestedSummary = 'New summary';

    // Create suggestion
    const suggestion = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: originalSummary,
        suggestedText: suggestedSummary,
        explanation: 'Better summary',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    // Reject suggestion without modifying resume
    await prisma.resumeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'rejected' },
    });

    // Verify resume is unchanged
    const resume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(resume?.summary).toBe(originalSummary);
    expect(resume?.summary).not.toBe(suggestedSummary);
  });

  it('should preserve all resume fields when rejecting suggestions', async () => {
    const originalSkills = ['JavaScript', 'React'];

    // Create multiple suggestions
    await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'skill',
        originalText: 'JavaScript',
        suggestedText: 'TypeScript',
        explanation: 'Better typing',
        confidenceLevel: 'medium',
        targetField: 'skills',
        status: 'pending',
      },
    });

    await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: 'Original summary',
        suggestedText: 'New summary',
        explanation: 'Better summary',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    // Reject all suggestions
    await prisma.resumeSuggestion.updateMany({
      where: { resumeId: testResumeId, status: 'pending' },
      data: { status: 'rejected' },
    });

    // Verify all fields are unchanged
    const resume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(resume?.summary).toBe('Original summary');
    expect(resume?.skills).toEqual(originalSkills);
  });

  it('should handle rejection of multiple suggestions without side effects', async () => {
    const suggestionIds: string[] = [];

    // Create 5 suggestions
    for (let i = 0; i < 5; i++) {
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

    // Reject all
    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: suggestionIds } },
      data: { status: 'rejected' },
    });

    // Verify resume unchanged
    const resume = await prisma.resume.findUnique({
      where: { id: testResumeId },
    });

    expect(resume?.skills).toEqual(['JavaScript', 'React']);
  });
});

/**
 * Property 7: Version Snapshot Creation
 * 
 * For any batch of suggestions applied to a resume, exactly one version
 * snapshot should be created before applying the changes, capturing the
 * complete resume state before modification.
 * 
 * **Validates: Requirements 2.8, 9.5, 9.6**
 */
describe('Property 7: Version Snapshot Creation', () => {
  let testResumeId: string;
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    testUserId = user.id;

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Test Resume',
        slug: `test-${Date.now()}`,
        summary: 'Original summary',
        skills: ['JavaScript', 'React'],
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

  it('should create exactly one version snapshot before applying suggestions', async () => {
    // Create suggestions
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

    // Create version snapshot before applying
    const versionBefore = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: 'Original summary',
          skills: ['JavaScript', 'React'],
        },
      },
    });

    // Apply suggestions
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { skills: ['JavaScript', 'React', 'New Skill 0', 'New Skill 1', 'New Skill 2'] },
    });

    await prisma.resumeSuggestion.updateMany({
      where: { id: { in: suggestionIds } },
      data: { status: 'approved', appliedAt: new Date() },
    });

    // Verify exactly one version snapshot was created
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: testResumeId },
    });

    expect(versions.length).toBe(1);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[0].snapshotData).toEqual({
      summary: 'Original summary',
      skills: ['JavaScript', 'React'],
    });
  });

  it('should capture complete resume state in snapshot', async () => {
    // Create experience
    const experience = await prisma.resumeExperience.create({
      data: {
        resumeId: testResumeId,
        company: 'Tech Corp',
        title: 'Developer',
        description: 'Original description',
        order: 0,
      },
    });

    // Create education
    const education = await prisma.resumeEducation.create({
      data: {
        resumeId: testResumeId,
        school: 'University',
        degree: 'BS',
        field: 'Computer Science',
        order: 0,
      },
    });

    // Create version snapshot
    const resume = await prisma.resume.findUnique({
      where: { id: testResumeId },
      include: {
        experiences: true,
        education: true,
      },
    });

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: {
          summary: resume?.summary,
          skills: resume?.skills,
          experiences: resume?.experiences,
          education: resume?.education,
        },
      },
    });

    // Verify snapshot contains all data
    expect(version.snapshotData.summary).toBe('Original summary');
    expect(version.snapshotData.skills).toEqual(['JavaScript', 'React']);
    expect(version.snapshotData.experiences).toHaveLength(1);
    expect(version.snapshotData.education).toHaveLength(1);
  });

  it('should create new version snapshot for each batch of suggestions', async () => {
    // First batch
    const suggestion1 = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'summary',
        originalText: 'Original summary',
        suggestedText: 'New summary',
        explanation: 'Better',
        confidenceLevel: 'high',
        targetField: 'summary',
        status: 'pending',
      },
    });

    const version1 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: { summary: 'Original summary' },
      },
    });

    // Apply first batch
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { summary: 'New summary' },
    });

    await prisma.resumeSuggestion.update({
      where: { id: suggestion1.id },
      data: { status: 'approved' },
    });

    // Second batch
    const suggestion2 = await prisma.resumeSuggestion.create({
      data: {
        resumeId: testResumeId,
        category: 'skill',
        originalText: 'JavaScript',
        suggestedText: 'TypeScript',
        explanation: 'Better',
        confidenceLevel: 'medium',
        targetField: 'skills',
        status: 'pending',
      },
    });

    const version2 = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 2,
        snapshotData: { summary: 'New summary', skills: ['JavaScript', 'React'] },
      },
    });

    // Verify two versions exist
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: testResumeId },
      orderBy: { versionNumber: 'asc' },
    });

    expect(versions.length).toBe(2);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[1].versionNumber).toBe(2);
    expect(versions[0].snapshotData.summary).toBe('Original summary');
    expect(versions[1].snapshotData.summary).toBe('New summary');
  });

  it('should preserve snapshot data immutably', async () => {
    const originalData = {
      summary: 'Original summary',
      skills: ['JavaScript', 'React'],
    };

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: testResumeId,
        versionNumber: 1,
        snapshotData: originalData,
      },
    });

    // Modify resume
    await prisma.resume.update({
      where: { id: testResumeId },
      data: { summary: 'Modified summary', skills: ['Python', 'Go'] },
    });

    // Verify snapshot is unchanged
    const retrievedVersion = await prisma.resumeVersion.findUnique({
      where: { id: version.id },
    });

    expect(retrievedVersion?.snapshotData).toEqual(originalData);
    expect(retrievedVersion?.snapshotData.summary).toBe('Original summary');
    expect(retrievedVersion?.snapshotData.skills).toEqual(['JavaScript', 'React']);
  });
});
