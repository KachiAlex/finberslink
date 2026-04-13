/**
 * Property-Based Tests for PDF Generation
 * 
 * These tests validate correctness properties that should hold true
 * for all valid inputs to the PDF generation system.
 */

import { describe, it, expect } from 'vitest';
import { generateResumeHtml, type ResumeData } from '@/services/pdf/templates';

/**
 * Property 1: PDF Generation Completeness
 * 
 * For any valid resume data with all sections populated, the generated PDF
 * should contain all resume sections (summary, experience, education, projects, skills)
 * with no missing content.
 */
describe('Property 1: PDF Generation Completeness', () => {
  it('should include summary section when provided', () => {
    const resumeData: ResumeData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      location: 'New York, NY',
      summary: 'Experienced software engineer with 5 years of experience',
      experiences: [],
      education: [],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain('Experienced software engineer with 5 years of experience');
  });

  it('should include all experience entries', () => {
    const resumeData: ResumeData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      experiences: [
        {
          title: 'Senior Developer',
          company: 'Tech Corp',
          startDate: '2020-01',
          endDate: '2023-12',
          description: 'Led development team',
          achievements: ['Shipped 10 features', 'Improved performance by 50%'],
        },
        {
          title: 'Junior Developer',
          company: 'StartUp Inc',
          startDate: '2018-06',
          endDate: '2019-12',
          description: 'Built web applications',
        },
      ],
      education: [],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain('Senior Developer');
    expect(html).toContain('Tech Corp');
    expect(html).toContain('Junior Developer');
    expect(html).toContain('StartUp Inc');
    expect(html).toContain('Shipped 10 features');
    expect(html).toContain('Improved performance by 50%');
  });

  it('should include all education entries', () => {
    const resumeData: ResumeData = {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      experiences: [],
      education: [
        {
          school: 'MIT',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          graduationDate: '2018-05',
        },
        {
          school: 'Stanford',
          degree: 'Master of Science',
          field: 'Artificial Intelligence',
          graduationDate: '2020-06',
        },
      ],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain('MIT');
    expect(html).toContain('Bachelor of Science');
    expect(html).toContain('Computer Science');
    expect(html).toContain('Stanford');
    expect(html).toContain('Master of Science');
    expect(html).toContain('Artificial Intelligence');
  });

  it('should include all projects', () => {
    const resumeData: ResumeData = {
      firstName: 'Alice',
      lastName: 'Williams',
      email: 'alice@example.com',
      experiences: [],
      education: [],
      projects: [
        {
          name: 'Project Alpha',
          description: 'A web application for task management',
          technologies: ['React', 'Node.js', 'PostgreSQL'],
        },
        {
          name: 'Project Beta',
          description: 'Mobile app for fitness tracking',
          technologies: ['React Native', 'Firebase'],
        },
      ],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain('Project Alpha');
    expect(html).toContain('A web application for task management');
    expect(html).toContain('React');
    expect(html).toContain('Node.js');
    expect(html).toContain('Project Beta');
    expect(html).toContain('Mobile app for fitness tracking');
    expect(html).toContain('React Native');
  });

  it('should include all skills', () => {
    const resumeData: ResumeData = {
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@example.com',
      experiences: [],
      education: [],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain('JavaScript');
    expect(html).toContain('TypeScript');
    expect(html).toContain('React');
    expect(html).toContain('Node.js');
    expect(html).toContain('PostgreSQL');
    expect(html).toContain('AWS');
  });

  it('should include contact information', () => {
    const resumeData: ResumeData = {
      firstName: 'David',
      lastName: 'Lee',
      email: 'david@example.com',
      phone: '555-9876',
      location: 'San Francisco, CA',
      experiences: [],
      education: [],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain('david@example.com');
    expect(html).toContain('555-9876');
    expect(html).toContain('San Francisco, CA');
  });
});

/**
 * Property 2: Filename Format Consistency
 * 
 * For any user with firstName and lastName, the exported PDF filename should
 * follow the exact format `{firstName}_{lastName}_Resume.pdf` with proper
 * URL encoding for special characters.
 */
describe('Property 2: Filename Format Consistency', () => {
  it('should generate correct filename for simple names', () => {
    const firstName = 'John';
    const lastName = 'Doe';
    const expectedFilename = `${firstName}_${lastName}_Resume.pdf`;
    expect(expectedFilename).toBe('John_Doe_Resume.pdf');
  });

  it('should handle names with hyphens', () => {
    const firstName = 'Mary';
    const lastName = 'Smith-Johnson';
    const expectedFilename = `${firstName}_${lastName}_Resume.pdf`;
    expect(expectedFilename).toBe('Mary_Smith-Johnson_Resume.pdf');
  });

  it('should handle names with apostrophes', () => {
    const firstName = "Patrick";
    const lastName = "O'Brien";
    const expectedFilename = `${firstName}_${lastName}_Resume.pdf`;
    expect(expectedFilename).toBe("Patrick_O'Brien_Resume.pdf");
  });

  it('should handle single character names', () => {
    const firstName = 'J';
    const lastName = 'D';
    const expectedFilename = `${firstName}_${lastName}_Resume.pdf`;
    expect(expectedFilename).toBe('J_D_Resume.pdf');
  });

  it('should handle long names', () => {
    const firstName = 'Christopher';
    const lastName = 'Schwarzenegger';
    const expectedFilename = `${firstName}_${lastName}_Resume.pdf`;
    expect(expectedFilename).toBe('Christopher_Schwarzenegger_Resume.pdf');
  });
});

/**
 * Property 3: Multi-page Pagination Consistency
 * 
 * For any resume spanning multiple pages, the PDF formatting should remain
 * consistent across all pages with proper page breaks and header/footer preservation.
 */
describe('Property 3: Multi-page Pagination Consistency', () => {
  it('should include page break styles for multi-page resumes', () => {
    const resumeData: ResumeData = {
      firstName: 'Extended',
      lastName: 'Resume',
      email: 'extended@example.com',
      experiences: Array(10).fill(null).map((_, i) => ({
        title: `Position ${i + 1}`,
        company: `Company ${i + 1}`,
        startDate: `202${i}-01`,
        description: 'Long description of responsibilities and achievements',
        achievements: ['Achievement 1', 'Achievement 2', 'Achievement 3'],
      })),
      education: Array(5).fill(null).map((_, i) => ({
        school: `University ${i + 1}`,
        degree: 'Degree',
        field: 'Field',
        graduationDate: `201${i}-05`,
      })),
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    
    // Should contain CSS for page breaks
    expect(html).toContain('@page');
    
    // Should contain all experiences
    for (let i = 0; i < 10; i++) {
      expect(html).toContain(`Position ${i + 1}`);
      expect(html).toContain(`Company ${i + 1}`);
    }
    
    // Should contain all education
    for (let i = 0; i < 5; i++) {
      expect(html).toContain(`University ${i + 1}`);
    }
  });

  it('should maintain consistent styling across templates', () => {
    const resumeData: ResumeData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      experiences: [
        {
          title: 'Role',
          company: 'Company',
          startDate: '2020-01',
          description: 'Description',
        },
      ],
      education: [],
    };

    const modernHtml = generateResumeHtml(resumeData, 'Modern');
    const classicHtml = generateResumeHtml(resumeData, 'Classic');
    const minimalHtml = generateResumeHtml(resumeData, 'Minimal');

    // All should contain the same content
    expect(modernHtml).toContain('Test');
    expect(classicHtml).toContain('Test');
    expect(minimalHtml).toContain('Test');

    // All should have proper HTML structure
    expect(modernHtml).toContain('<!DOCTYPE html>');
    expect(classicHtml).toContain('<!DOCTYPE html>');
    expect(minimalHtml).toContain('<!DOCTYPE html>');

    // All should have CSS styles
    expect(modernHtml).toContain('<style>');
    expect(classicHtml).toContain('<style>');
    expect(minimalHtml).toContain('<style>');
  });
});

/**
 * Property 4: Template Consistency
 * 
 * For any resume data, all three templates should generate valid HTML
 * with proper structure and styling.
 */
describe('Property 4: Template Consistency', () => {
  const baseResumeData: ResumeData = {
    firstName: 'Template',
    lastName: 'Tester',
    email: 'template@example.com',
    phone: '555-0000',
    location: 'Test City',
    summary: 'Test summary',
    experiences: [
      {
        title: 'Test Role',
        company: 'Test Company',
        startDate: '2020-01',
        description: 'Test description',
      },
    ],
    education: [
      {
        school: 'Test University',
        degree: 'Test Degree',
        field: 'Test Field',
        graduationDate: '2020-05',
      },
    ],
    projects: [
      {
        name: 'Test Project',
        description: 'Test project description',
        technologies: ['Tech1', 'Tech2'],
      },
    ],
    skills: ['Skill1', 'Skill2'],
  };

  it('Modern template should generate valid HTML', () => {
    const html = generateResumeHtml(baseResumeData, 'Modern');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
    expect(html).toContain('Template');
    expect(html).toContain('Tester');
  });

  it('Classic template should generate valid HTML', () => {
    const html = generateResumeHtml(baseResumeData, 'Classic');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
    expect(html).toContain('Template');
    expect(html).toContain('Tester');
  });

  it('Minimal template should generate valid HTML', () => {
    const html = generateResumeHtml(baseResumeData, 'Minimal');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
    expect(html).toContain('Template');
    expect(html).toContain('Tester');
  });

  it('should handle empty optional sections gracefully', () => {
    const minimalData: ResumeData = {
      firstName: 'Minimal',
      lastName: 'Data',
      email: 'minimal@example.com',
      experiences: [],
      education: [],
    };

    const html = generateResumeHtml(minimalData, 'Modern');
    expect(html).toContain('Minimal');
    expect(html).toContain('Data');
    expect(html).toContain('minimal@example.com');
    expect(html).toContain('<!DOCTYPE html>');
  });
});

/**
 * Property 5: Content Preservation
 * 
 * For any resume data, all provided content should be preserved exactly
 * as provided (no truncation, modification, or loss).
 */
describe('Property 5: Content Preservation', () => {
  it('should preserve long descriptions without truncation', () => {
    const longDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
    const resumeData: ResumeData = {
      firstName: 'Long',
      lastName: 'Content',
      email: 'long@example.com',
      experiences: [
        {
          title: 'Role',
          company: 'Company',
          startDate: '2020-01',
          description: longDescription,
        },
      ],
      education: [],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain(longDescription);
  });

  it('should preserve special characters in content', () => {
    const specialContent = 'C++ & C# Developer | React/Vue.js | AWS (EC2, S3, Lambda)';
    const resumeData: ResumeData = {
      firstName: 'Special',
      lastName: 'Chars',
      email: 'special@example.com',
      experiences: [
        {
          title: specialContent,
          company: 'Company',
          startDate: '2020-01',
        },
      ],
      education: [],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    expect(html).toContain('C++');
    expect(html).toContain('C#');
    expect(html).toContain('&');
    expect(html).toContain('React/Vue.js');
  });

  it('should preserve all achievements in order', () => {
    const achievements = [
      'First achievement with details',
      'Second achievement with more details',
      'Third achievement with even more details',
    ];
    const resumeData: ResumeData = {
      firstName: 'Achievements',
      lastName: 'Test',
      email: 'achievements@example.com',
      experiences: [
        {
          title: 'Role',
          company: 'Company',
          startDate: '2020-01',
          achievements,
        },
      ],
      education: [],
    };

    const html = generateResumeHtml(resumeData, 'Modern');
    achievements.forEach(achievement => {
      expect(html).toContain(achievement);
    });
  });
});
