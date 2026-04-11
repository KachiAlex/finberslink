"use client";

import { useState, useEffect } from "react";
import { 
  Brain, 
  Star, 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Target,
  ThumbsUp,
  ThumbsDown,
  Send,
  Sparkles,
  Info,
  ChevronRight,
  Eye
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Progress } from "../../../../components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";
import { 
  JobRecommendation, 
  getPersonalizedJobRecommendations, 
  getSimilarJobs, 
  saveRecommendationFeedback 
} from "@/features/jobs/recommendations";
import Link from "next/link";

interface JobRecommendationsProps {
  userId: string;
  jobId?: string; // For similar jobs
  limit?: number;
  showSimilar?: boolean;
}

export function JobRecommendations({ 
  userId, 
  jobId, 
  limit = 5, 
  showSimilar = false 
}: JobRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [userId, jobId, showSimilar]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      let recs: JobRecommendation[];
      
      if (showSimilar && jobId) {
        recs = await getSimilarJobs(jobId, limit);
      } else {
        recs = await getPersonalizedJobRecommendations(userId, limit);
      }
      
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (jobId: string, feedback: 'positive' | 'negative') => {
    setFeedbackLoading(jobId);
    try {
      await saveRecommendationFeedback(userId, jobId, feedback);
      // Remove the job from recommendations after feedback
      setRecommendations(prev => prev.filter(rec => rec.job.id !== jobId));
    } catch (error) {
      console.error('Failed to save feedback:', error);
    } finally {
      setFeedbackLoading(null);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getMatchIcon = (score: number) => {
    if (score >= 80) return <Star className="w-4 h-4" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4" />;
    return <Target className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-6">
          <div className="text-center">
            <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {showSimilar ? 'No Similar Jobs Found' : 'No Recommendations Yet'}
            </h3>
            <p className="text-slate-600">
              {showSimilar 
                ? 'Check back later for similar opportunities'
                : 'Complete your profile to get personalized job recommendations'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-600" />
            <CardTitle className="text-lg">
              {showSimilar ? 'Similar Opportunities' : 'Recommended for You'}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
            AI-Powered
          </Badge>
        </div>
        <CardDescription>
          {showSimilar 
            ? 'Jobs similar to this opportunity'
            : 'Personalized based on your profile and preferences'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.job.id}
            recommendation={recommendation}
            onFeedback={handleFeedback}
            feedbackLoading={feedbackLoading}
            getMatchColor={getMatchColor}
            getMatchIcon={getMatchIcon}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: JobRecommendation;
  onFeedback: (jobId: string, feedback: 'positive' | 'negative') => void;
  feedbackLoading: string | null;
  getMatchColor: (score: number) => string;
  getMatchIcon: (score: number) => string;
}

function RecommendationCard({
  recommendation,
  onFeedback,
  feedbackLoading,
  getMatchColor,
  getMatchIcon
}: RecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900 truncate">
                {recommendation.job.title}
              </h4>
              <Badge className={getMatchColor(recommendation.matchScore)}>
                <div className="flex items-center gap-1">
                  {getMatchIcon(recommendation.matchScore)}
                  <span>{recommendation.matchScore}% match</span>
                </div>
              </Badge>
            </div>
            <p className="text-slate-600 mb-2">{recommendation.job.company}</p>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{recommendation.job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span>{recommendation.job.jobType.replace('_', ' ')}</span>
              </div>
              {recommendation.job.salaryRange && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{recommendation.job.salaryRange}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Reasons */}
        {recommendation.matchReasons.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-medium text-slate-700">Why this matches:</span>
            </div>
            <div className="space-y-1">
              {recommendation.matchReasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                  <span>{reason}</span>
                </div>
              ))}
              {recommendation.matchReasons.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-cyan-600 p-0 h-auto"
                >
                  {showDetails ? 'Show less' : `+${recommendation.matchReasons.length - 2} more`}
                </Button>
              )}
            </div>
            
            {showDetails && (
              <div className="mt-2 space-y-1">
                {recommendation.matchReasons.slice(2).map((reason, index) => (
                  <div key={index + 2} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skills Match */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-700">Skills Match</span>
            <span className="text-sm text-slate-600">
              {recommendation.skillMatch.percentage}%
            </span>
          </div>
          <Progress value={recommendation.skillMatch.percentage} className="h-2" />
          {recommendation.skillMatch.matched.length > 0 && (
            <div className="mt-1">
              <div className="flex flex-wrap gap-1">
                {recommendation.skillMatch.matched.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {recommendation.skillMatch.matched.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{recommendation.skillMatch.matched.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link href={`/jobs/${recommendation.job.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Job
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/jobs/${recommendation.job.id}/apply`}>
                <Send className="w-4 h-4 mr-2" />
                Apply
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback(recommendation.job.id, 'positive')}
                    disabled={feedbackLoading === recommendation.job.id}
                    className="text-green-600 hover:text-green-700"
                  >
                    {feedbackLoading === recommendation.job.id ? (
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Good recommendation</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFeedback(recommendation.job.id, 'negative')}
                    disabled={feedbackLoading === recommendation.job.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {feedbackLoading === recommendation.job.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ThumbsDown className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not relevant</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
