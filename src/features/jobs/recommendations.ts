import { prisma } from "@/lib/prisma";

export interface JobRecommendation {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    remoteOption: string;
    salaryRange?: string;
    description?: string;
    requirements: string[];
    tags: string[];
    experienceLevel?: string;
    companySize?: string;
    industry?: string;
    benefits: string[];
    educationLevel?: string;
  };
  matchScore: number;
  matchReasons: string[];
  skillMatch: {
    matched: string[];
    missing: string[];
    percentage: number;
  };
  experienceMatch: {
    userLevel: string;
    requiredLevel: string;
    isMatch: boolean;
  };
  locationMatch: {
    userLocation?: string;
    jobLocation: string;
    distance?: number;
    isRemote: boolean;
  };
}

export interface UserProfile {
  id: string;
  skills: string[];
  experience?: {
    years: number;
    level: string;
    title?: string;
  };
  location?: string;
  preferences?: {
    jobTypes: string[];
    remoteOptions: string[];
    industries: string[];
    companySizes: string[];
    salaryRange?: [number, number];
  };
  education?: {
    level: string;
    field?: string;
  };
  targetRoles?: string[];
}

// Get user profile for recommendations
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        resumes: {
          where: { visibility: 'PUBLIC' },
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) return null;

    const resume = user.resumes[0];
    
    return {
      id: user.id,
      skills: user.profile?.skills || resume?.skills || [],
      experience: resume?.yearsExperience ? {
        years: resume.yearsExperience,
        level: getExperienceLevel(resume.yearsExperience),
        title: resume?.targetRoles?.[0]
      } : undefined,
      location: user.profile?.location || resume?.location,
      preferences: {
        jobTypes: [], // Could be derived from user behavior
        remoteOptions: [],
        industries: resume?.targetIndustry ? [resume.targetIndustry] : [],
        companySizes: [],
        salaryRange: undefined
      },
      education: user.profile?.education ? {
        level: getHighestEducation(user.profile.education),
        field: undefined
      } : undefined,
      targetRoles: resume?.targetRoles || []
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Get personalized job recommendations
export async function getPersonalizedJobRecommendations(
  userId: string,
  limit = 10
): Promise<JobRecommendation[]> {
  const userProfile = await getUserProfile(userId);
  if (!userProfile) return [];

  try {
    // Get active jobs
    const jobs = await prisma.jobOpportunity.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Get more jobs to calculate scores
    });

    // Calculate match scores for each job
    const recommendations: JobRecommendation[] = jobs
      .map(job => calculateJobMatch(job, userProfile))
      .filter(rec => rec.matchScore > 0.3) // Only include jobs with decent match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return recommendations;
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    return [];
  }
}

// Calculate match score between user profile and job
function calculateJobMatch(job: any, userProfile: UserProfile): JobRecommendation {
  let totalScore = 0;
  let maxScore = 0;
  const matchReasons: string[] = [];

  // Skills matching (40% weight)
  const skillWeight = 0.4;
  const skillMatch = calculateSkillMatch(userProfile.skills, job.tags || [], job.requirements || []);
  totalScore += skillMatch.percentage * skillWeight;
  maxScore += 100 * skillWeight;
  
  if (skillMatch.percentage > 50) {
    matchReasons.push(`Strong skill match (${skillMatch.percentage}% of required skills)`);
  }

  // Experience level matching (25% weight)
  const experienceWeight = 0.25;
  const experienceMatch = calculateExperienceMatch(userProfile.experience, job.experienceLevel);
  totalScore += experienceMatch.isMatch ? 100 * experienceWeight : 0;
  maxScore += 100 * experienceWeight;
  
  if (experienceMatch.isMatch) {
    matchReasons.push('Experience level matches requirements');
  }

  // Location matching (20% weight)
  const locationWeight = 0.2;
  const locationMatch = calculateLocationMatch(userProfile.location, job.location, job.remoteOption);
  totalScore += (locationMatch.isRemote || locationMatch.distance !== undefined) ? 100 * locationWeight : 50 * locationWeight;
  maxScore += 100 * locationWeight;
  
  if (locationMatch.isRemote) {
    matchReasons.push('Remote work opportunity');
  } else if (locationMatch.distance && locationMatch.distance < 50) {
    matchReasons.push('Close to your location');
  }

  // Industry matching (10% weight)
  const industryWeight = 0.1;
  const industryMatch = userProfile.preferences?.industries?.includes(job.industry) || false;
  totalScore += industryMatch ? 100 * industryWeight : 0;
  maxScore += 100 * industryWeight;
  
  if (industryMatch) {
    matchReasons.push('Industry matches your preferences');
  }

  // Target role matching (5% weight)
  const roleWeight = 0.05;
  const roleMatch = userProfile.targetRoles?.some(targetRole => 
    job.title.toLowerCase().includes(targetRole.toLowerCase()) ||
    job.tags?.some(tag => tag.toLowerCase().includes(targetRole.toLowerCase()))
  ) || false;
  totalScore += roleMatch ? 100 * roleWeight : 0;
  maxScore += 100 * roleWeight;
  
  if (roleMatch) {
    matchReasons.push('Matches your target roles');
  }

  const matchScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      remoteOption: job.remoteOption,
      salaryRange: job.salaryRange,
      description: job.description,
      requirements: job.requirements || [],
      tags: job.tags || [],
      experienceLevel: job.experienceLevel,
      companySize: job.companySize,
      industry: job.industry,
      benefits: job.benefits || [],
      educationLevel: job.educationLevel
    },
    matchScore: Math.round(matchScore),
    matchReasons,
    skillMatch,
    experienceMatch,
    locationMatch
  };
}

// Calculate skill match percentage
function calculateSkillMatch(userSkills: string[], jobTags: string[], jobRequirements: string[]): {
  matched: string[];
  missing: string[];
  percentage: number;
} {
  const allRequiredSkills = [...jobTags, ...jobRequirements];
  const normalizedUserSkills = userSkills.map(skill => skill.toLowerCase());
  const normalizedRequiredSkills = allRequiredSkills.map(skill => skill.toLowerCase());

  const matched = normalizedRequiredSkills.filter(skill => 
    normalizedUserSkills.some(userSkill => 
      userSkill.includes(skill) || skill.includes(userSkill)
    )
  );

  const missing = normalizedRequiredSkills.filter(skill => !matched.includes(skill));

  const percentage = allRequiredSkills.length > 0 
    ? Math.round((matched.length / allRequiredSkills.length) * 100)
    : 0;

  return {
    matched: matched,
    missing: missing,
    percentage
  };
}

// Calculate experience level match
function calculateExperienceMatch(userExperience: UserProfile['experience'], jobExperienceLevel?: string): {
  userLevel: string;
  requiredLevel: string;
  isMatch: boolean;
} {
  const userLevel = userExperience?.level || 'ENTRY';
  const requiredLevel = jobExperienceLevel || 'ENTRY';

  const levels = ['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'];
  const userIndex = levels.indexOf(userLevel);
  const requiredIndex = levels.indexOf(requiredLevel);

  // User is qualified if their level is equal to or higher than required
  const isMatch = userIndex >= requiredIndex;

  return {
    userLevel,
    requiredLevel,
    isMatch
  };
}

// Calculate location match
function calculateLocationMatch(userLocation?: string, jobLocation?: string, remoteOption?: string): {
  userLocation?: string;
  jobLocation: string;
  distance?: number;
  isRemote: boolean;
} {
  const isRemote = remoteOption === 'REMOTE' || remoteOption === 'HYBRID';

  if (isRemote) {
    return {
      userLocation,
      jobLocation: jobLocation || 'Remote',
      isRemote: true
    };
  }

  // Simple location matching - in production, use geocoding API
  if (userLocation && jobLocation) {
    const distance = calculateDistance(userLocation, jobLocation);
    return {
      userLocation,
      jobLocation,
      distance,
      isRemote: false
    };
  }

  return {
    userLocation,
    jobLocation: jobLocation || 'Unknown',
    isRemote: false
  };
}

// Simple distance calculation (placeholder - use real geocoding in production)
function calculateDistance(location1: string, location2: string): number {
  // This is a placeholder - in production, use Google Maps API or similar
  // For now, return a random distance for demonstration
  return Math.floor(Math.random() * 100);
}

// Get experience level from years of experience
function getExperienceLevel(years: number): string {
  if (years < 2) return 'ENTRY';
  if (years < 5) return 'MID';
  if (years < 10) return 'SENIOR';
  return 'EXECUTIVE';
}

// Get highest education level from profile
function getHighestEducation(education: any): string {
  if (!education || !Array.isArray(education)) return 'HIGH_SCHOOL';
  
  const levels = ['PHD', 'MASTER', 'BACHELOR', 'ASSOCIATE', 'HIGH_SCHOOL'];
  
  for (const level of levels) {
    const found = education.find((edu: any) => 
      edu.degree?.toUpperCase().includes(level) || 
      edu.type?.toUpperCase().includes(level)
    );
    if (found) return level;
  }
  
  return 'HIGH_SCHOOL';
}

// Get similar jobs based on a job ID
export async function getSimilarJobs(jobId: string, limit = 5): Promise<JobRecommendation[]> {
  try {
    const targetJob = await prisma.jobOpportunity.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!targetJob) return [];

    // Create a mock user profile based on the job
    const mockProfile: UserProfile = {
      id: 'similar-jobs',
      skills: targetJob.tags || [],
      experience: {
        years: 5,
        level: targetJob.experienceLevel || 'MID'
      },
      location: targetJob.location,
      preferences: {
        jobTypes: [targetJob.jobType],
        remoteOptions: [targetJob.remoteOption],
        industries: targetJob.industry ? [targetJob.industry] : [],
        companySizes: targetJob.companySize ? [targetJob.companySize] : [],
      }
    };

    // Get similar jobs (excluding the target job)
    const similarJobs = await prisma.jobOpportunity.findMany({
      where: {
        isActive: true,
        id: { not: jobId },
        OR: [
          { tags: { hasSome: targetJob.tags || [] } },
          { company: targetJob.company },
          { industry: targetJob.industry },
          { jobType: targetJob.jobType },
          { remoteOption: targetJob.remoteOption }
        ]
      },
      include: {
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return similarJobs
      .map(job => calculateJobMatch(job, mockProfile))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting similar jobs:', error);
    return [];
  }
}

// Save user recommendation feedback
export async function saveRecommendationFeedback(
  userId: string,
  jobId: string,
  feedback: 'positive' | 'negative' | 'applied'
): Promise<void> {
  try {
    await prisma.recommendationFeedback.create({
      data: {
        userId,
        jobId,
        feedback,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error saving recommendation feedback:', error);
  }
}

// Get recommendation analytics
export async function getRecommendationAnalytics(userId: string): Promise<{
  totalRecommendations: number;
  positiveFeedback: number;
  negativeFeedback: number;
  applicationsFromRecommendations: number;
  averageMatchScore: number;
}> {
  try {
    const feedback = await prisma.recommendationFeedback.groupBy({
      by: ['feedback'],
      where: { userId },
      _count: true
    });

    const positive = feedback.find(f => f.feedback === 'positive')?._count || 0;
    const negative = feedback.find(f => f.feedback === 'negative')?._count || 0;
    const applied = feedback.find(f => f.feedback === 'applied')?._count || 0;

    return {
      totalRecommendations: positive + negative + applied,
      positiveFeedback: positive,
      negativeFeedback: negative,
      applicationsFromRecommendations: applied,
      averageMatchScore: 0 // Would need to track this separately
    };
  } catch (error) {
    console.error('Error getting recommendation analytics:', error);
    return {
      totalRecommendations: 0,
      positiveFeedback: 0,
      negativeFeedback: 0,
      applicationsFromRecommendations: 0,
      averageMatchScore: 0
    };
  }
}
