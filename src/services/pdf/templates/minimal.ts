/**
 * Minimal Resume Template
 * Clean, simple layout with centered header and black/white design
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

export function generateMinimalTemplate(data: ResumeData): string {
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
      font-family: 'Helvetica Neue', 'Roboto', sans-serif;
      color: #000;
      background: white;
      line-height: 1.6;
      font-size: 10pt;
    }

    .container {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 0.4in;
    }

    .name {
      font-size: 18pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 9pt;
      letter-spacing: 0.5px;
      line-height: 1.4;
    }

    .contact-info span {
      margin: 0 6px;
    }

    .contact-info span:first-child {
      margin-left: 0;
    }

    .section {
      margin-bottom: 0.3in;
    }

    .section-title {
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #000;
      text-transform: uppercase;
    }

    .summary {
      font-size: 10pt;
      line-height: 1.6;
      margin-bottom: 0.15in;
      text-align: justify;
    }

    .experience-item,
    .education-item,
    .project-item {
      margin-bottom: 0.12in;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }

    .item-title {
      font-weight: bold;
      font-size: 10pt;
    }

    .item-subtitle {
      font-size: 9pt;
      margin-left: 4px;
    }

    .item-date {
      font-size: 9pt;
      text-align: right;
    }

    .item-description {
      font-size: 9pt;
      line-height: 1.5;
      margin-top: 2px;
    }

    .achievements {
      font-size: 9pt;
      margin-top: 4px;
      margin-left: 0.15in;
      line-height: 1.5;
    }

    .achievements li {
      margin: 2px 0;
    }

    .skills-list {
      font-size: 9pt;
      line-height: 1.6;
    }

    .skills-list span {
      margin-right: 10px;
    }

    .skills-list span::before {
      content: '• ';
      margin-right: 4px;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .container {
        margin: 0;
        padding: 0.75in;
      }
    }

    @page {
      size: A4;
      margin: 0.75in;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="name">${data.firstName} ${data.lastName}</div>
      <div class="contact-info">
        ${data.email ? `<span>${data.email}</span>` : ''}
        ${data.phone ? `<span>|</span><span>${data.phone}</span>` : ''}
        ${data.location ? `<span>|</span><span>${data.location}</span>` : ''}
      </div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">Summary</div>
      <div class="summary">${data.summary}</div>
    </div>
    ` : ''}

    ${experiences.length > 0 ? `
    <div class="section">
      <div class="section-title">Experience</div>
      ${experiences.map(exp => `
        <div class="experience-item">
          <div class="item-header">
            <div>
              <span class="item-title">${exp.title}</span>
              <span class="item-subtitle">${exp.company}</span>
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
              <span class="item-title">${edu.degree} in ${edu.field}</span>
              <span class="item-subtitle">${edu.school}</span>
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
            <div class="item-description"><strong>Tech:</strong> ${proj.technologies.join(', ')}</div>
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
