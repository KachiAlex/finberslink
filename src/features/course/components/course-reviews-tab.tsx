"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, MessageSquare, User } from "lucide-react";

interface CourseReviewsTabProps {
  courseId: string;
}

export function CourseReviewsTab({ courseId }: CourseReviewsTabProps) {
  // Sample review data - in real app, this would come from API
  const reviews = [
    {
      id: 1,
      user: "Sarah Johnson",
      avatar: "SJ",
      rating: 5,
      date: "2 weeks ago",
      title: "Excellent Course!",
      content: "This course exceeded my expectations. The instructor was knowledgeable and the content was well-structured. I learned so much!",
      helpful: 24,
      verified: true
    },
    {
      id: 2,
      user: "Michael Chen",
      avatar: "MC",
      rating: 4,
      date: "1 month ago",
      title: "Great Content, Could Use More Examples",
      content: "Overall a very good course with comprehensive coverage. Would have liked to see more practical examples, but the theoretical foundation is solid.",
      helpful: 18,
      verified: true
    },
    {
      id: 3,
      user: "Emily Davis",
      avatar: "ED",
      rating: 5,
      date: "1 month ago",
      title: "Perfect for Beginners",
      content: "As someone new to this field, I found this course incredibly helpful. The pace was perfect and the explanations were clear.",
      helpful: 32,
      verified: true
    }
  ];

  const averageRating = 4.8;
  const totalReviews = 324;
  const ratingDistribution = [
    { stars: 5, count: 245, percentage: 76 },
    { stars: 4, count: 52, percentage: 16 },
    { stars: 3, count: 18, percentage: 6 },
    { stars: 2, count: 6, percentage: 2 },
    { stars: 1, count: 3, percentage: 1 }
  ];

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.floor(averageRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-gray-600">{totalReviews} reviews</div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map((rating) => (
                <div key={rating.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-gray-600">{rating.stars}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${rating.percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 w-12 text-right">
                    {rating.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Options */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Student Reviews</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-300">
                Most Recent
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300">
                Most Helpful
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300">
                Highest Rated
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {review.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{review.user}</h4>
                      {review.verified && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span>·</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900">{review.title}</h5>
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpful})
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Reply
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" className="border-gray-300 text-gray-700">
          Load More Reviews
        </Button>
      </div>
    </div>
  );
}
