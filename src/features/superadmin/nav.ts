import { Icon as LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  GaugeCircle,
  CreditCard,
  Network,
  Settings2,
} from "lucide-react";

export type SuperAdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const superAdminNav: SuperAdminNavItem[] = [
  { title: "Overview", href: "/superadmin", icon: LayoutDashboard },
  { title: "Tenants", href: "/superadmin/tenants", icon: Building2 },
  { title: "Usage", href: "/superadmin/usage", icon: GaugeCircle },
  { title: "Billing", href: "/superadmin/billing", icon: CreditCard },
  { title: "Marketplace", href: "/superadmin/marketplace", icon: Network },
  { title: "Settings", href: "/superadmin/settings", icon: Settings2 },
];
