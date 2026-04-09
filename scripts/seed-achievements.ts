import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedAchievements() {
  console.log("🌟 Seeding achievements...");

  const achievements = [
    // Completion Achievements
    {
      name: "First Steps",
      description: "Complete your first lesson",
      icon: "👣",
      category: "COMPLETION" as const,
      points: 10,
      badgeColor: "#10B981",
      requirement: { type: "First Lesson", lessonsCompleted: 1 },
    },
    {
      name: "Quick Learner",
      description: "Complete 5 lessons",
      icon: "⚡",
      category: "COMPLETION" as const,
      points: 25,
      badgeColor: "#3B82F6",
      requirement: { type: "Multiple Lessons", lessonsCompleted: 5 },
    },
    {
      name: "Half Way There",
      description: "Complete 50% of a course",
      icon: "🎯",
      category: "COMPLETION" as const,
      points: 50,
      badgeColor: "#8B5CF6",
      requirement: { type: "Course Progress", percentage: 50 },
    },
    {
      name: "Course Graduate",
      description: "Complete 100% of a course",
      icon: "🎓",
      category: "COMPLETION" as const,
      points: 100,
      badgeColor: "#F59E0B",
      requirement: { type: "Course Progress", percentage: 100 },
    },
    {
      name: "Master Student",
      description: "Complete 3 courses",
      icon: "🏆",
      category: "COMPLETION" as const,
      points: 150,
      badgeColor: "#EF4444",
      requirement: { type: "Multiple Courses", coursesCompleted: 3 },
    },

    // Streak Achievements
    {
      name: "Getting Started",
      description: "Maintain a 3-day learning streak",
      icon: "🔥",
      category: "STREAK" as const,
      points: 15,
      badgeColor: "#F97316",
      requirement: { type: "Streak Days", days: 3 },
    },
    {
      name: "Week Warrior",
      description: "Maintain a 7-day learning streak",
      icon: "💪",
      category: "STREAK" as const,
      points: 35,
      badgeColor: "#DC2626",
      requirement: { type: "Streak Days", days: 7 },
    },
    {
      name: "Month Master",
      description: "Maintain a 30-day learning streak",
      icon: "👑",
      category: "STREAK" as const,
      points: 100,
      badgeColor: "#7C3AED",
      requirement: { type: "Streak Days", days: 30 },
    },
    {
      name: "Legendary Learner",
      description: "Maintain a 100-day learning streak",
      icon: "🌟",
      category: "STREAK" as const,
      points: 300,
      badgeColor: "#FBBF24",
      requirement: { type: "Streak Days", days: 100 },
    },

    // Engagement Achievements
    {
      name: "Dedicated Learner",
      description: "Study for 10 hours total",
      icon: "⏰",
      category: "ENGAGEMENT" as const,
      points: 30,
      badgeColor: "#0EA5E9",
      requirement: { type: "Study Time", minutes: 600 },
    },
    {
      name: "Power Student",
      description: "Study for 30 hours total",
      icon: "💪",
      category: "ENGAGEMENT" as const,
      points: 75,
      badgeColor: "#059669",
      requirement: { type: "Study Time", minutes: 1800 },
    },
    {
      name: "Time Investor",
      description: "Study for 100 hours total",
      icon: "📚",
      category: "ENGAGEMENT" as const,
      points: 200,
      badgeColor: "#7C2D12",
      requirement: { type: "Study Time", minutes: 6000 },
    },
    {
      name: "Active Participant",
      description: "Join 10 chat discussions",
      icon: "💬",
      category: "ENGAGEMENT" as const,
      points: 25,
      badgeColor: "#0891B2",
      requirement: { type: "Chat Participation", messages: 10 },
    },

    // Performance Achievements
    {
      name: "Perfect Score",
      description: "Score 95% or higher on a lesson",
      icon: "💯",
      category: "PERFORMANCE" as const,
      points: 40,
      badgeColor: "#10B981",
      requirement: { type: "High Score", score: 95 },
    },
    {
      name: "Consistent Performer",
      description: "Score 80% or higher on 5 lessons",
      icon: "🎖️",
      category: "PERFORMANCE" as const,
      points: 60,
      badgeColor: "#6366F1",
      requirement: { type: "Consistent Scores", score: 80, count: 5 },
    },
    {
      name: "Speed Learner",
      description: "Complete a lesson in under 30 minutes",
      icon: "🚀",
      category: "PERFORMANCE" as const,
      points: 20,
      badgeColor: "#EC4899",
      requirement: { type: "Fast Completion", maxMinutes: 30 },
    },

    // Social Achievements
    {
      name: "Team Player",
      description: "Help 5 fellow students in chat",
      icon: "🤝",
      category: "SOCIAL" as const,
      points: 35,
      badgeColor: "#0F766E",
      requirement: { type: "Help Others", helpedCount: 5 },
    },
    {
      name: "Community Leader",
      description: "Start 10 discussion threads",
      icon: "📢",
      category: "SOCIAL" as const,
      points: 50,
      badgeColor: "#B91C1C",
      requirement: { type: "Start Discussions", threadCount: 10 },
    },
    {
      name: "Mentor",
      description: "Get 15 thanks from other students",
      icon: "🙏",
      category: "SOCIAL" as const,
      points: 75,
      badgeColor: "#A21CAF",
      requirement: { type: "Receive Thanks", thanksCount: 15 },
    },

    // Milestone Achievements
    {
      name: "Welcome Aboard",
      description: "Complete your profile setup",
      icon: "🎉",
      category: "MILESTONE" as const,
      points: 5,
      badgeColor: "#6B7280",
      requirement: { type: "Profile Complete", fields: ["basic", "profile"] },
    },
    {
      name: "Explorer",
      description: "Visit all sections of your dashboard",
      icon: "🗺️",
      category: "MILESTONE" as const,
      points: 15,
      badgeColor: "#059669",
      requirement: { type: "Explore Sections", sections: ["courses", "chat", "profile", "resumes"] },
    },
    {
      name: "Early Bird",
      description: "Complete a lesson before 9 AM",
      icon: "🌅",
      category: "MILESTONE" as const,
      points: 20,
      badgeColor: "#F59E0B",
      requirement: { type: "Early Completion", beforeHour: 9 },
    },
    {
      name: "Night Owl",
      description: "Complete a lesson after 9 PM",
      icon: "🦉",
      category: "MILESTONE" as const,
      points: 20,
      badgeColor: "#1E40AF",
      requirement: { type: "Late Completion", afterHour: 21 },
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`✅ Created ${achievements.length} achievements`);
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedAchievements()
    .catch((e) => {
      console.error("❌ Error seeding achievements:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
