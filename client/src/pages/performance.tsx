import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Star, TrendingUp, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Slider } from '@/components/ui/slider';
import type { PerformanceReview } from '@shared/schema';

export default function PerformancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [technicalScore, setTechnicalScore] = useState([3]);
  const [communicationScore, setCommunicationScore] = useState([3]);
  const [leadershipScore, setLeadershipScore] = useState([3]);
  const [teamworkScore, setTeamworkScore] = useState([3]);
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  const { data: reviews } = useQuery<PerformanceReview[]>({
    queryKey: ['/api/performance/reviews'],
  });

  const { data: myReviews } = useQuery<PerformanceReview[]>({
    queryKey: ['/api/performance/my-reviews'],
  });

  const generateAISummaryMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return apiRequest('POST', `/api/performance/reviews/${reviewId}/ai-summary`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance'] });
      toast({
        title: 'Success',
        description: 'AI summary generated successfully',
      });
    },
  });

  const renderStars = (score: number | null) => {
    if (!score) return null;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= score ? 'fill-status-warning text-status-warning' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-performance-title">
            Performance Reviews
          </h1>
          <p className="text-muted-foreground">Track and improve performance</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myReviews && myReviews.length > 0
                ? (
                    myReviews.reduce((sum, r) => sum + (Number(r.overallScore) || 0), 0) /
                    myReviews.length
                  ).toFixed(1)
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myReviews?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Reviews received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Technical Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {renderStars(
                myReviews && myReviews.length > 0
                  ? Math.round(
                      myReviews.reduce((sum, r) => sum + (r.technicalScore || 0), 0) /
                        myReviews.length
                    )
                  : null
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Communication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {renderStars(
                myReviews && myReviews.length > 0
                  ? Math.round(
                      myReviews.reduce((sum, r) => sum + (r.communicationScore || 0), 0) /
                        myReviews.length
                    )
                  : null
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average rating</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Performance Reviews</CardTitle>
          <CardDescription>Reviews you've received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myReviews && myReviews.length > 0 ? (
              myReviews.map((review) => (
                <div key={review.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{review.reviewPeriod}</p>
                      <p className="text-sm text-muted-foreground">
                        Overall Score: {review.overallScore || 'N/A'}/5.0
                      </p>
                    </div>
                    {!review.aiGeneratedSummary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateAISummaryMutation.mutate(review.id)}
                        disabled={generateAISummaryMutation.isPending}
                      >
                        <Sparkles className="mr-2 h-3 w-3" />
                        Generate AI Summary
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Technical</p>
                      {renderStars(review.technicalScore)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Communication</p>
                      {renderStars(review.communicationScore)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Leadership</p>
                      {renderStars(review.leadershipScore)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Teamwork</p>
                      {renderStars(review.teamworkScore)}
                    </div>
                  </div>

                  {review.feedback && (
                    <div>
                      <p className="text-sm font-medium mb-1">Feedback</p>
                      <p className="text-sm text-muted-foreground">{review.feedback}</p>
                    </div>
                  )}

                  {review.aiGeneratedSummary && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">AI Generated Summary</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.aiGeneratedSummary}
                      </p>
                    </div>
                  )}

                  {review.goals && review.goals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Goals</p>
                      <ul className="list-disc list-inside space-y-1">
                        {review.goals.map((goal, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No performance reviews found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
