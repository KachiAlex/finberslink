/**
 * Resume Template Registry
 * Exports all available resume templates
 */

export { generateModernTemplate } from './modern';
export { generateClassicTemplate } from './classic';
export { generateMinimalTemplate } from './minimal';

export type TemplateType = 'Modern' | 'Classic' | 'Minimal';

export interface ResumeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  experiences: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    link?: string;
  }>;
  skills?: string[];
}

/**
 * Get template generator function by template name
 */
export function getTemplateGenerator(template: TemplateType) {
  switch (template) {
    case 'Modern':
      return require('./modern').generateModernTemplate;
    case 'Classic':
      return require('./classic').generateClassicTemplate;
    case 'Minimal':
      return require('./minimal').generateMinimalTemplate;
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

/**
 * Generate HTML from resume data using specified template
 */
export function generateResumeHtml(data: ResumeData, template: TemplateType): string {
  const generator = getTemplateGenerator(template);
  return generator(data);
}

/**
 * Get list of available templates
 */
export function getAvailableTemplates(): TemplateType[] {
  return ['Modern', 'Classic', 'Minimal'];
}

/**
 * Validate template name
 */
export function isValidTemplate(template: string): template is TemplateType {
  return ['Modern', 'Classic', 'Minimal'].includes(template);
}
