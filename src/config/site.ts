export const siteConfig = {
  name: "Finbers Link",
  tagline: "Skill-to-Employment Digital Ecosystem",
  description:
    "Integrated LMS, AI resume builder, and opportunity marketplace that connects students, tutors, admins, and employers.",
  baseUrl: "https://finbers-link.example.com",
  mainNav: [
    { title: "Courses", href: "/courses" },
    { title: "Jobs", href: "/jobs" },
    { title: "Volunteer", href: "/volunteer" },
    { title: "News", href: "/news" },
    { title: "Forum", href: "/forum" },
    { title: "Profile", href: "/profile" },
  ],
  dashboardNav: [
    { title: "Overview", href: "/dashboard" },
    { title: "Courses", href: "/dashboard/courses" },
    { title: "Resume", href: "/dashboard/resume" },
    { title: "Applications", href: "/dashboard/applications" },
    { title: "Notifications", href: "/dashboard/notifications" },
  ],
};

export type SiteNavItem = (typeof siteConfig.mainNav)[number];
