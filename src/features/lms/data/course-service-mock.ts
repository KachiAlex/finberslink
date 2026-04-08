/**
 * Temporary mock course service to bypass database issues
 */
export async function listDashboardCatalogCourses(params: any) {
  console.log("Using mock course service data");
  
  const mockCourses = [
    {
      id: "mock-catalog-1",
      title: "Web Development Basics",
      slug: "web-dev-basics",
      tagline: "Start your web development journey",
      level: "beginner",
      category: "Web Development",
      instructor: {
        id: "mock-inst-1",
        name: "John Smith",
        avatarUrl: null,
      },
      price: 0,
      coverImage: null,
      publishedAt: new Date(),
      rating: 4.5,
      reviewCount: 123,
      enrolledCount: 890,
    },
    {
      id: "mock-catalog-2",
      title: "Advanced React Patterns",
      slug: "advanced-react",
      tagline: "Master advanced React concepts",
      level: "advanced",
      category: "Frontend",
      instructor: {
        id: "mock-inst-2",
        name: "Jane Doe",
        avatarUrl: null,
      },
      price: 49.99,
      coverImage: null,
      publishedAt: new Date(),
      rating: 4.8,
      reviewCount: 89,
      enrolledCount: 456,
    },
    {
      id: "mock-catalog-3",
      title: "Python for Beginners",
      slug: "python-beginners",
      tagline: "Learn programming with Python",
      level: "beginner",
      category: "Programming",
      instructor: {
        id: "mock-inst-3",
        name: "Bob Johnson",
        avatarUrl: null,
      },
      price: 0,
      coverImage: null,
      publishedAt: new Date(),
      rating: 4.6,
      reviewCount: 234,
      enrolledCount: 1200,
    },
  ];

  // Apply basic filtering
  let filteredCourses = mockCourses;
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredCourses = filteredCourses.filter(course =>
      course.title.toLowerCase().includes(searchLower) ||
      course.tagline.toLowerCase().includes(searchLower)
    );
  }
  
  if (params.level && params.level !== "all") {
    filteredCourses = filteredCourses.filter(course =>
      course.level === params.level
    );
  }
  
  if (params.category && params.category !== "all") {
    filteredCourses = filteredCourses.filter(course =>
      course.category.toLowerCase().includes(params.category.toLowerCase())
    );
  }

  // Pagination
  const page = params.page || 1;
  const limit = 12;
  const skip = (page - 1) * limit;
  const paginatedCourses = filteredCourses.slice(skip, skip + limit);

  return {
    courses: paginatedCourses,
    pagination: {
      page,
      pageSize: limit,
      total: filteredCourses.length,
      totalPages: Math.ceil(filteredCourses.length / limit),
    },
  };
}
