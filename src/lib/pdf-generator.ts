import jsPDF from 'jspdf';
import { exportResumeAsJSON } from '@/features/resume/export-service';

interface ResumeData {
  id: string;
  title: string;
  summary: string;
  skills: string[];
  user: {
    email: string;
    firstName: string;
    lastName: string;
    profile?: any;
  };
  experiences?: any[];
  education?: any[];
  projects?: any[];
  createdAt: string;
  updatedAt: string;
}

export async function generateResumePDF(resumeId: string): Promise<Buffer> {
  try {
    console.log("Starting PDF generation for resume:", resumeId);
    
    // Get resume data
    const resumeData = await exportResumeAsJSON(resumeId) as ResumeData;
    console.log("Resume data retrieved successfully");
    
    if (!resumeData) {
      throw new Error("No resume data found");
    }
    
    // Create PDF document with error handling
    let pdf: jsPDF;
    try {
      pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    } catch (error) {
      console.error("Error creating jsPDF instance:", error);
      throw new Error("Failed to initialize PDF generator");
    }

    // PDF dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number = 12, fontStyle: string = 'normal') => {
      if (!text) return yPosition;
      
      try {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        for (const line of lines) {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        }
      } catch (error) {
        console.error("Error adding text to PDF:", error);
        // Continue without this text
      }
      return yPosition;
    };

    // Header - Name and Title
    const fullName = `${resumeData.user?.firstName || ''} ${resumeData.user?.lastName || ''}`.trim();
    if (fullName) {
      yPosition = addText(fullName, 20, 'bold');
    }
    
    if (resumeData.title) {
      yPosition = addText(resumeData.title, 16, 'bold');
    }
    yPosition += 10;

    // Contact Info
    if (resumeData.user?.email) {
      yPosition = addText(resumeData.user.email, 12, 'normal');
      yPosition += 10;
    }

    // Draw line separator
    try {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    } catch (error) {
      console.error("Error drawing line:", error);
    }
    yPosition += 15;

    // Summary Section
    if (resumeData.summary) {
      yPosition = addText('Professional Summary', 14, 'bold');
      yPosition += 5;
      yPosition = addText(resumeData.summary, 11, 'normal');
      yPosition += 15;
    }

    // Skills Section
    if (resumeData.skills && resumeData.skills.length > 0) {
      yPosition = addText('Skills', 14, 'bold');
      yPosition += 5;
      const skillsText = resumeData.skills.join(' • ');
      yPosition = addText(skillsText, 11, 'normal');
      yPosition += 15;
    }

    // Experience Section
    if (resumeData.experiences && resumeData.experiences.length > 0) {
      yPosition = addText('Experience', 14, 'bold');
      yPosition += 10;

      for (const experience of resumeData.experiences) {
        const roleCompany = `${experience.role || 'Role'} at ${experience.company || 'Company'}`;
        yPosition = addText(roleCompany, 12, 'bold');
        
        const dateRange = `${experience.startDate ? new Date(experience.startDate).toLocaleDateString() : 'Start Date'} - ${experience.endDate ? new Date(experience.endDate).toLocaleDateString() : 'Present'}`;
        yPosition = addText(dateRange, 10, 'italic');
        
        if (experience.description) {
          yPosition = addText(experience.description, 10, 'normal');
        }
        
        if (experience.achievements && experience.achievements.length > 0) {
          for (const achievement of experience.achievements) {
            yPosition = addText(`• ${achievement}`, 10, 'normal');
          }
        }
        yPosition += 10;
      }
    }

    // Education Section
    if (resumeData.education && resumeData.education.length > 0) {
      yPosition = addText('Education', 14, 'bold');
      yPosition += 10;

      for (const education of resumeData.education) {
        const degreeField = `${education.degree || 'Degree'} in ${education.field || 'Field of Study'}`;
        yPosition = addText(degreeField, 12, 'bold');
        
        if (education.school) {
          yPosition = addText(education.school, 10, 'normal');
        }
        if (education.summary) {
          yPosition = addText(education.summary, 10, 'normal');
        }
        yPosition += 10;
      }
    }

    // Projects Section
    if (resumeData.projects && resumeData.projects.length > 0) {
      yPosition = addText('Projects', 14, 'bold');
      yPosition += 10;

      for (const project of resumeData.projects) {
        if (project.name) {
          yPosition = addText(project.name, 12, 'bold');
        }
        if (project.summary) {
          yPosition = addText(project.summary, 10, 'normal');
        }
        if (project.techStack && project.techStack.length > 0) {
          yPosition = addText(`Technologies: ${project.techStack.join(', ')}`, 10, 'italic');
        }
        yPosition += 10;
      }
    }

    // Footer
    try {
      const footerY = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated on ${new Date().toLocaleDateString()} from Finbers Link`, margin, footerY);
    } catch (error) {
      console.error("Error adding footer:", error);
    }

    // Generate PDF buffer with error handling
    let pdfBuffer: Buffer;
    try {
      const arrayBuffer = pdf.output('arraybuffer');
      pdfBuffer = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Error generating PDF buffer:", error);
      throw new Error("Failed to generate PDF buffer");
    }

    console.log("PDF generated successfully, size:", pdfBuffer.length);
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Create a fallback PDF with basic information
    try {
      console.log("Attempting to create fallback PDF");
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text('Resume Export Error', 20, 20);
      pdf.setFontSize(12);
      pdf.text('There was an error generating your resume PDF.', 20, 40);
      pdf.text('Please try again or contact support.', 20, 50);
      pdf.text(`Resume ID: ${resumeId}`, 20, 70);
      pdf.text(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 20, 80);
      pdf.text(`Timestamp: ${new Date().toISOString()}`, 20, 90);
      
      const arrayBuffer = pdf.output('arraybuffer');
      return Buffer.from(arrayBuffer);
    } catch (fallbackError) {
      console.error("Even fallback PDF failed:", fallbackError);
      throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}
