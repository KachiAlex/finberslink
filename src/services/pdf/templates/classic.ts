/**
 * Classic Resume Template
 * Traditional resume format with top-aligned header and conservative styling
 */

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

export function generateClassicTemplate(data: ResumeData): string {
  const skills = data.skills || [];
  const projects = data.projects || [];
  const experiences = data.experiences || [];
  const education = data.education || [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.firstName} ${data.lastName} - Resume</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      color: #000;
      background: white;
      line-height: 1.5;
      font-size: 11pt;
    }

    .container {
      max-width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 0.3in;
      padding-bottom: 0.2in;
      border-bottom: 2px solid #000;
    }

    .name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .contact-info {
      font-size: 10pt;
      line-height: 1.4;
    }

    .contact-info span {
      margin: 0 8px;
    }

    .contact-info span:first-child {
      margin-left: 0;
    }

    .section {
      margin-bottom: 0.25in;
    }

    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #999;
      text-transform: uppercase;
    }

    .summary {
      font-size: 11pt;
      line-height: 1.5;
      margin-bottom: 0.15in;
      text-align: justify;
    }

    .experience-item,
    .education-item,
    .project-item {
      margin-bottom: 0.15in;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .item-title {
      font-weight: bold;
      font-size: 11pt;
    }

    .item-subtitle {
      font-style: italic;
      font-size: 10pt;
      color: #333;
    }

    .item-date {
      font-size: 10pt;
      color: #333;
    }

    .item-description {
      font-size: 10pt;
      line-height: 1.4;
      margin-top: 2px;
    }

    .achievements {
      font-size: 10pt;
      margin-top: 4px;
      margin-left: 0.2in;
      line-height: 1.4;
    }

    .achievements li {
      margin: 2px 0;
    }

    .skills-list {
      font-size: 10pt;
      line-height: 1.5;
    }

    .skills-list span {
      margin-right: 12px;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .container {
        margin: 0;
        padding: 0.5in;
        height: auto;
      }
    }

    @page {
      size: A4;
      margin: 0.5in;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="name">${data.firstName} ${data.lastName}</div>
      <div class="contact-info">
        ${data.email ? `<span>${data.email}</span>` : ''}
        ${data.phone ? `<span>${data.phone}</span>` : ''}
        ${data.location ? `<span>${data.location}</span>` : ''}
      </div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary">${data.summary}</div>
    </div>
    ` : ''}

    ${experiences.length > 0 ? `
    <div class="section">
      <div class="section-title">Professional Experience</div>
      ${experiences.map(exp => `
        <div class="experience-item">
          <div class="item-header">
            <div>
              <div class="item-title">${exp.title}</div>
              <div class="item-subtitle">${exp.company}</div>
            </div>
            <div class="item-date">${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : ' - Present'}</div>
          </div>
          ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
          ${exp.achievements && exp.achievements.length > 0 ? `
            <ul class="achievements">
              ${exp.achievements.map(ach => `<li>${ach}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${education.length > 0 ? `
    <div class="section">
      <div class="section-title">Education</div>
      ${education.map(edu => `
        <div class="education-item">
          <div class="item-header">
            <div>
              <div class="item-title">${edu.degree} in ${edu.field}</div>
              <div class="item-subtitle">${edu.school}</div>
            </div>
            <div class="item-date">${edu.graduationDate}</div>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${skills.length > 0 ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-list">
        ${skills.map(skill => `<span>${skill}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${projects.length > 0 ? `
    <div class="section">
      <div class="section-title">Projects</div>
      ${projects.map(proj => `
        <div class="project-item">
          <div class="item-title">${proj.name}</div>
          ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
          ${proj.technologies && proj.technologies.length > 0 ? `
            <div class="item-description"><strong>Technologies:</strong> ${proj.technologies.join(', ')}</div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
