import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Create sample courses for testing
 */
export const POST = async (request: NextRequest) => {
  try {
    console.log("Creating sample courses...");
    
    // Get an admin user to be the instructor
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: "No admin user found to assign as instructor"
      });
    }
    
    // Create sample courses
    const sampleCourses = [
      {
        slug: "web-development-basics",
        title: "Web Development Basics",
        tagline: "Learn HTML, CSS, and JavaScript fundamentals",
        description: "A comprehensive introduction to web development covering the core technologies of the web.",
        level: "BEGINNER",
        category: "Web Development",
        coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
        approvalStatus: "APPROVED" as const,
        publishedAt: new Date(),
        instructorId: adminUser.id,
        outcomes: ["HTML5", "CSS3", "JavaScript ES6", "Responsive Design"],
        skills: ["Web Development", "Frontend", "HTML", "CSS", "JavaScript"],
      },
      {
        slug: "advanced-react-development",
        title: "Advanced React Development",
        tagline: "Master advanced React patterns and best practices",
        description: "Deep dive into React advanced concepts including hooks, context, performance optimization, and more.",
        level: "ADVANCED",
        category: "Frontend Development",
        coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
        approvalStatus: "APPROVED" as const,
        publishedAt: new Date(),
        instructorId: adminUser.id,
        outcomes: ["React Hooks", "State Management", "Performance Optimization", "Testing"],
        skills: ["React", "JavaScript", "Frontend", "Web Development"],
      },
      {
        slug: "python-data-science",
        title: "Python for Data Science",
        tagline: "Learn data science with Python programming",
        description: "Comprehensive course covering Python programming with focus on data analysis, visualization, and machine learning basics.",
        level: "INTERMEDIATE",
        category: "Data Science",
        coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
        approvalStatus: "APPROVED" as const,
        publishedAt: new Date(),
        instructorId: adminUser.id,
        outcomes: ["Python Programming", "Data Analysis", "Visualization", "Machine Learning Basics"],
        skills: ["Python", "Data Science", "Programming", "Analytics"],
      },
    ];
    
    const createdCourses = [];
    for (const courseData of sampleCourses) {
      // Check if course already exists
      const existing = await prisma.course.findUnique({
        where: { slug: courseData.slug }
      });
      
      if (!existing) {
        const course = await prisma.course.create({
          data: courseData
        });
        createdCourses.push(course);
      } else {
        createdCourses.push(existing);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Sample courses created successfully",
      data: {
        instructor: `${adminUser.firstName} ${adminUser.lastName}`,
        coursesCreated: createdCourses.length,
        courses: createdCourses.map(c => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          level: c.level,
          category: c.category,
        }))
      },
    });
  } catch (error) {
    console.error("Failed to create sample courses:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create sample courses",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
