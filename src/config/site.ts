export const siteConfig = {
  name: "Finbers Link",
  tagline: "From Learning to Employment",
  description:
    "A career intelligence platform that combines learning, profile building, and job matching to help people and programs move from skills to employment.",
  baseUrl: "https://finbers-link.example.com",
  mainNav: [
    { title: "Learning", href: "/courses" },
    { title: "Opportunities", href: "/jobs" },
    { title: "Volunteer", href: "/volunteer" },
    { title: "Insights", href: "/news" },
    { title: "Community", href: "/forum" },
    { title: "Messages", href: "/chat" },
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
