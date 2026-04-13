/**
 * Modern Resume Template
 * Contemporary design with sidebar layout, accent colors, and modern typography
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

export function generateModernTemplate(data: ResumeData): string {
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1a1a1a;
      background: white;
      line-height: 1.6;
    }

    .container {
      display: flex;
      min-height: 100vh;
      background: white;
    }

    .sidebar {
      width: 280px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      flex-shrink: 0;
    }

    .main-content {
      flex: 1;
      padding: 40px 50px;
      overflow: hidden;
    }

    .header {
      margin-bottom: 30px;
    }

    .name {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .contact-info {
      font-size: 11px;
      color: #666;
      line-height: 1.8;
      margin-bottom: 20px;
    }

    .contact-info p {
      margin: 4px 0;
    }

    .summary {
      font-size: 13px;
      line-height: 1.7;
      color: #333;
      margin-bottom: 25px;
    }

    .section {
      margin-bottom: 25px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #667eea;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #667eea;
    }

    .sidebar .section-title {
      color: white;
      border-bottom-color: rgba(255, 255, 255, 0.3);
    }

    .experience-item,
    .education-item,
    .project-item {
      margin-bottom: 16px;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .item-title {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .item-subtitle {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .item-date {
      font-size: 11px;
      color: #999;
    }

    .item-description {
      font-size: 12px;
      color: #555;
      line-height: 1.6;
      margin-top: 6px;
    }

    .achievements {
      font-size: 12px;
      color: #555;
      margin-top: 6px;
      margin-left: 16px;
    }

    .achievements li {
      margin: 4px 0;
      list-style-position: inside;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .skill-tag {
      display: inline-block;
      background: #f0f0f0;
      color: #333;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }

    .sidebar .skill-tag {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .sidebar .section {
      margin-bottom: 30px;
    }

    .sidebar .section-title {
      font-size: 11px;
    }

    .sidebar .item-title {
      font-size: 12px;
      color: white;
    }

    .sidebar .item-subtitle {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.8);
    }

    .sidebar .item-description {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.9);
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .container {
        min-height: auto;
      }
    }

    @page {
      size: A4;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="section">
        <div class="section-title">Contact</div>
        <div class="contact-info">
          ${data.email ? `<p>${data.email}</p>` : ''}
          ${data.phone ? `<p>${data.phone}</p>` : ''}
          ${data.location ? `<p>${data.location}</p>` : ''}
        </div>
      </div>

      ${skills.length > 0 ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-list">
          ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    <div class="main-content">
      <div class="header">
        <div class="name">${data.firstName} ${data.lastName}</div>
      </div>

      ${data.summary ? `
      <div class="summary">
        ${data.summary}
      </div>
      ` : ''}

      ${experiences.length > 0 ? `
      <div class="section">
        <div class="section-title">Experience</div>
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

      ${projects.length > 0 ? `
      <div class="section">
        <div class="section-title">Projects</div>
        ${projects.map(proj => `
          <div class="project-item">
            <div class="item-title">${proj.name}</div>
            ${proj.description ? `<div class="item-description">${proj.description}</div>` : ''}
            ${proj.technologies && proj.technologies.length > 0 ? `
              <div class="skills-list">
                ${proj.technologies.map(tech => `<span class="skill-tag">${tech}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
