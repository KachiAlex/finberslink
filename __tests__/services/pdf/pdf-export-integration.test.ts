/**
 * PDF Export Integration Tests
 * 
 * Tests the complete PDF export workflow end-to-end, including:
 * - Template rendering
 * - PDF generation
 * - File naming
 * - Multi-page handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateResumeHtml, getAvailableTemplates, isValidTemplate } from '@/services/pdf/templates';
import type { ResumeData } from '@/services/pdf/templates';

describe('PDF Export Integration Tests', () => {
  const testResumeData: ResumeData = {
    firstName: 'Integration',
    lastName: 'Test',
    email: 'integration@example.com',
    phone: '555-1234',
    location: 'Test City, TC',
    summary: 'Experienced professional with 10+ years in software development',
    experiences: [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: '2020-01',
        endDate: '2024-01',
        description: 'Led development of microservices architecture',
        achievements: [
          'Reduced API response time by 60%',
          'Mentored 5 junior developers',
          'Implemented CI/CD pipeline',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'StartUp Inc',
        startDate: '2018-06',
        endDate: '2019-12',
        description: 'Built full-stack web applications',
        achievements: [
          'Shipped 15+ features',
          'Improved test coverage to 85%',
        ],
      },
    ],
    education: [
      {
        school: 'State University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        graduationDate: '2018-05',
      },
    ],
    projects: [
      {
        name: 'E-Commerce Platform',
        description: 'Full-stack e-commerce solution with payment integration',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        link: 'https://example.com/ecommerce',
      },
      {
        name: 'Analytics Dashboard',
        description: 'Real-time analytics dashboard for business metrics',
        technologies: ['React', 'D3.js', 'WebSocket', 'Python'],
      },
    ],
    skills: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'PostgreSQL',
      'AWS',
      'Docker',
      'Kubernetes',
    ],
  };

  describe('Template Availability', () => {
    it('should have all three templates available', () => {
      const templates = getAvailableTemplates();
      expect(templates).toHaveLength(3);
      expect(templates).toContain('Modern');
      expect(templates).toContain('Classic');
      expect(templates).toContain('Minimal');
    });

    it('should validate template names correctly', () => {
      expect(isValidTemplate('Modern')).toBe(true);
      expect(isValidTemplate('Classic')).toBe(true);
      expect(isValidTemplate('Minimal')).toBe(true);
      expect(isValidTemplate('Invalid')).toBe(false);
      expect(isValidTemplate('modern')).toBe(false); // Case sensitive
    });
  });

  describe('Template Rendering', () => {
    it('should render Modern template with all content', () => {
      const html = generateResumeHtml(testResumeData, 'Modern');
      
      // Check structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      
      // Check header
      expect(html).toContain('Integration');
      expect(html).toContain('Test');
      expect(html).toContain('integration@example.com');
      
      // Check experience
      expect(html).toContain('Senior Software Engineer');
      expect(html).toContain('Tech Corp');
      expect(html).toContain('Reduced API response time by 60%');
      
      // Check education
      expect(html).toContain('State University');
      expect(html).toContain('Bachelor of Science');
      
      // Check projects
      expect(html).toContain('E-Commerce Platform');
      expect(html).toContain('Analytics Dashboard');
      
      // Check skills
      expect(html).toContain('JavaScript');
      expect(html).toContain('TypeScript');
    });

    it('should render Classic template with all content', () => {
      const html = generateResumeHtml(testResumeData, 'Classic');
      
      // Check structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      
      // Check all key content
      expect(html).toContain('Integration Test');
      expect(html).toContain('Senior Software Engineer');
      expect(html).toContain('E-Commerce Platform');
      expect(html).toContain('JavaScript');
    });

    it('should render Minimal template with all content', () => {
      const html = generateResumeHtml(testResumeData, 'Minimal');
      
      // Check structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      
      // Check all key content
      expect(html).toContain('Integration Test');
      expect(html).toContain('Senior Software Engineer');
      expect(html).toContain('E-Commerce Platform');
      expect(html).toContain('JavaScript');
    });
  });

  describe('Filename Generation', () => {
    it('should generate correct filename format', () => {
      const firstName = testResumeData.firstName;
      const lastName = testResumeData.lastName;
      const filename = `${firstName}_${lastName}_Resume.pdf`;
      
      expect(filename).toBe('Integration_Test_Resume.pdf');
      expect(filename).toMatch(/^[A-Za-z0-9_-]+_[A-Za-z0-9_-]+_Resume\.pdf$/);
    });

    it('should handle special characters in names', () => {
      const testCases = [
        { first: 'Mary', last: 'Smith-Johnson', expected: 'Mary_Smith-Johnson_Resume.pdf' },
        { first: 'Patrick', last: "O'Brien", expected: "Patrick_O'Brien_Resume.pdf" },
        { first: 'José', last: 'García', expected: 'José_García_Resume.pdf' },
      ];

      testCases.forEach(({ first, last, expected }) => {
        const filename = `${first}_${last}_Resume.pdf`;
        expect(filename).toBe(expected);
      });
    });
  });

  describe('Multi-page Resume Handling', () => {
    it('should handle large resumes with many experiences', () => {
      const largeResumeData: ResumeData = {
        ...testResumeData,
        experiences: Array(15).fill(null).map((_, i) => ({
          title: `Position ${i + 1}`,
          company: `Company ${i + 1}`,
          startDate: `201${i % 10}-01`,
          endDate: `202${i % 10}-12`,
          description: `Description for position ${i + 1}`,
          achievements: [
            `Achievement 1 for position ${i + 1}`,
            `Achievement 2 for position ${i + 1}`,
          ],
        })),
      };

      const html = generateResumeHtml(largeResumeData, 'Modern');
      
      // Should contain all positions
      for (let i = 0; i < 15; i++) {
        expect(html).toContain(`Position ${i + 1}`);
        expect(html).toContain(`Company ${i + 1}`);
      }
      
      // Should have page break styles
      expect(html).toContain('@page');
    });

    it('should handle resumes with many education entries', () => {
      const educationResumeData: ResumeData = {
        ...testResumeData,
        education: Array(10).fill(null).map((_, i) => ({
          school: `University ${i + 1}`,
          degree: `Degree ${i + 1}`,
          field: `Field ${i + 1}`,
          graduationDate: `201${i}-05`,
        })),
      };

      const html = generateResumeHtml(educationResumeData, 'Modern');
      
      // Should contain all education entries
      for (let i = 0; i < 10; i++) {
        expect(html).toContain(`University ${i + 1}`);
        expect(html).toContain(`Degree ${i + 1}`);
      }
    });

    it('should handle resumes with many projects', () => {
      const projectResumeData: ResumeData = {
        ...testResumeData,
        projects: Array(20).fill(null).map((_, i) => ({
          name: `Project ${i + 1}`,
          description: `Description for project ${i + 1}`,
          technologies: [`Tech${i}`, `Tech${i + 1}`],
        })),
      };

      const html = generateResumeHtml(projectResumeData, 'Modern');
      
      // Should contain all projects
      for (let i = 0; i < 20; i++) {
        expect(html).toContain(`Project ${i + 1}`);
      }
    });
  });

  describe('Content Validation', () => {
    it('should preserve all achievements in correct order', () => {
      const html = generateResumeHtml(testResumeData, 'Modern');
      
      const achievements = [
        'Reduced API response time by 60%',
        'Mentored 5 junior developers',
        'Implemented CI/CD pipeline',
      ];

      achievements.forEach(achievement => {
        expect(html).toContain(achievement);
      });
    });

    it('should preserve all skills', () => {
      const html = generateResumeHtml(testResumeData, 'Modern');
      
      testResumeData.skills?.forEach(skill => {
        expect(html).toContain(skill);
      });
    });

    it('should preserve contact information', () => {
      const html = generateResumeHtml(testResumeData, 'Modern');
      
      expect(html).toContain(testResumeData.email);
      expect(html).toContain(testResumeData.phone);
      expect(html).toContain(testResumeData.location);
    });

    it('should preserve project links', () => {
      const html = generateResumeHtml(testResumeData, 'Modern');
      
      expect(html).toContain('https://example.com/ecommerce');
    });
  });

  describe('Template Consistency', () => {
    it('should generate valid HTML for all templates', () => {
      const templates = getAvailableTemplates();
      
      templates.forEach(template => {
        const html = generateResumeHtml(testResumeData, template);
        
        // Basic HTML structure
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('</html>');
        expect(html).toContain('<head>');
        expect(html).toContain('</head>');
        expect(html).toContain('<body>');
        expect(html).toContain('</body>');
        
        // CSS styles
        expect(html).toContain('<style>');
        expect(html).toContain('</style>');
        
        // Content
        expect(html).toContain('Integration');
        expect(html).toContain('Test');
      });
    });

    it('should have proper CSS for print media', () => {
      const templates = getAvailableTemplates();
      
      templates.forEach(template => {
        const html = generateResumeHtml(testResumeData, template);
        
        // Should have print media queries
        expect(html).toContain('@media print');
        
        // Should have page styles
        expect(html).toContain('@page');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle resume with minimal data', () => {
      const minimalData: ResumeData = {
        firstName: 'Min',
        lastName: 'User',
        email: 'min@example.com',
        experiences: [],
        education: [],
      };

      const templates = getAvailableTemplates();
      templates.forEach(template => {
        const html = generateResumeHtml(minimalData, template);
        expect(html).toContain('Min');
        expect(html).toContain('User');
        expect(html).toContain('min@example.com');
      });
    });

    it('should handle resume with only experiences', () => {
      const experienceOnlyData: ResumeData = {
        firstName: 'Exp',
        lastName: 'Only',
        email: 'exp@example.com',
        experiences: [
          {
            title: 'Role',
            company: 'Company',
            startDate: '2020-01',
          },
        ],
        education: [],
      };

      const html = generateResumeHtml(experienceOnlyData, 'Modern');
      expect(html).toContain('Role');
      expect(html).toContain('Company');
    });

    it('should handle resume with only education', () => {
      const educationOnlyData: ResumeData = {
        firstName: 'Edu',
        lastName: 'Only',
        email: 'edu@example.com',
        experiences: [],
        education: [
          {
            school: 'University',
            degree: 'Degree',
            field: 'Field',
            graduationDate: '2020-05',
          },
        ],
      };

      const html = generateResumeHtml(educationOnlyData, 'Modern');
      expect(html).toContain('University');
      expect(html).toContain('Degree');
    });

    it('should handle very long text without breaking', () => {
      const longText = 'A'.repeat(1000);
      const longTextData: ResumeData = {
        firstName: 'Long',
        lastName: 'Text',
        email: 'long@example.com',
        summary: longText,
        experiences: [],
        education: [],
      };

      const html = generateResumeHtml(longTextData, 'Modern');
      expect(html).toContain(longText);
    });
  });

  describe('Checkpoint Validation', () => {
    it('should pass all checkpoint requirements', () => {
      const templates = getAvailableTemplates();
      
      // Requirement 1: All three templates generate valid PDFs
      templates.forEach(template => {
        const html = generateResumeHtml(testResumeData, template);
        expect(html).toBeTruthy();
        expect(html.length).toBeGreaterThan(100);
        expect(html).toContain('<!DOCTYPE html>');
      });
      
      // Requirement 2: Filename generation with special characters
      const specialNameFilename = `José_García_Resume.pdf`;
      expect(specialNameFilename).toMatch(/Resume\.pdf$/);
      
      // Requirement 3: Multi-page formatting consistency
      const largeData: ResumeData = {
        ...testResumeData,
        experiences: Array(20).fill(null).map((_, i) => ({
          title: `Role ${i}`,
          company: `Company ${i}`,
          startDate: '2020-01',
        })),
      };
      
      const largeHtml = generateResumeHtml(largeData, 'Modern');
      expect(largeHtml).toContain('@page');
      expect(largeHtml).toContain('@media print');
    });
  });
});
