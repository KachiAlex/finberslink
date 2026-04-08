"use client";

import React from "react";
import { BookOpen, Users, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type CourseTab = "learning-pathway" | "assigned" | "discover";

interface TabConfig {
  id: CourseTab;
  label: string;
  description: string;
  icon: any;
  color: string;
  count?: number;
}

interface CourseSwitchTabsProps {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
  tabCounts: Record<CourseTab, number>;
}

const tabConfigs: TabConfig[] = [
  {
    id: "learning-pathway",
    label: "Learning Pathway",
    description: "Your enrolled courses",
    icon: BookOpen,
    color: "green",
  },
  {
    id: "assigned",
    label: "Assigned",
    description: "Your active cohorts",
    icon: Users,
    color: "blue",
  },
  {
    id: "discover",
    label: "Discover",
    description: "Explore more programs",
    icon: Compass,
    color: "yellow",
  },
];

export function CourseSwitchTabs({ 
  activeTab, 
  onTabChange, 
  tabCounts 
}: CourseSwitchTabsProps) {
  const getTabColor = (color: string, isActive: boolean) => {
    const colors = {
      green: isActive 
        ? "bg-green-600 text-white border-green-600" 
        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
      blue: isActive 
        ? "bg-blue-600 text-white border-blue-600" 
        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      yellow: isActive 
        ? "bg-yellow-600 text-white border-yellow-600" 
        : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  const getIconColor = (color: string, isActive: boolean) => {
    const colors = {
      green: isActive ? "text-white" : "text-green-600",
      blue: isActive ? "text-white" : "text-blue-600",
      yellow: isActive ? "text-white" : "text-yellow-600",
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-1">
      <div className="grid gap-1 sm:grid-cols-3">
        {tabConfigs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200",
                getTabColor(tab.color, isActive)
              )}
            >
              <Icon className={cn("h-5 w-5", getIconColor(tab.color, isActive))} />
              
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
              
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "shrink-0",
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CourseSwitchTabs;
