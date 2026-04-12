export interface RolePercentile {
  role: string;
  percentile: number;
}

export interface ScoreTrend {
  date: string;
  score: number;
}

export interface SkillAnalysis {
  skill: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

export interface UserAnalytics {
  userId: string;
  averageScore: number;
  totalInterviews: number;
  skillAnalysis: SkillAnalysis[];
  scoreTrends: ScoreTrend[];
  rolePercentiles: RolePercentile[];
}

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  return {
    userId,
    averageScore: 0,
    totalInterviews: 0,
    skillAnalysis: [],
    scoreTrends: [],
    rolePercentiles: [],
  };
}

export async function getRoleAverageScore(role: string): Promise<number> {
  return 0;
}
