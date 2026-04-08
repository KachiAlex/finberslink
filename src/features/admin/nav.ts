import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  LayoutDashboard,
  Settings2,
  Users2,
  UserSquare2,
  Waypoints,
  MessageSquare,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

export const adminNav: AdminNavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Tutors", href: "/admin/tutors", icon: UserSquare2 },
  { title: "Courses", href: "/admin/courses", icon: Waypoints },
  { title: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
  { title: "Students", href: "/admin/students", icon: GraduationCap },
  { title: "Users", href: "/admin/users", icon: Users2 },
  { title: "System", href: "/admin/system", icon: Settings2 },
  { title: "Messages", href: "/admin/messages", icon: MessageSquare },
];
