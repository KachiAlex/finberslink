export const siteConfig = {
  name: "Finbers Link",
  tagline: "Build Skills. Prove Readiness. Get Hired.",
  description:
    "Finbers Link helps people and workforce programs build skills, close readiness gaps, and connect to matched opportunities in one platform.",
  baseUrl: "https://finbers-link.example.com",
  mainNav: [
    { title: "Courses", href: "/courses" },
    { title: "Jobs", href: "/jobs" },
    { title: "Volunteer", href: "/volunteer" },
    { title: "Career Insights", href: "/news" },
    { title: "Community", href: "/forum" },
  ],
  dashboardNav: [
    { title: "Overview", href: "/dashboard" },
    { title: "Courses", href: "/dashboard/courses" },
    { title: "Resume", href: "/resumes" },
    { title: "Applications", href: "/dashboard/applications" },
    { title: "Chat", href: "/chat" },
    { title: "Notifications", href: "/dashboard/notifications" },
  ],
};

export type SiteNavItem = (typeof siteConfig.mainNav)[number];
