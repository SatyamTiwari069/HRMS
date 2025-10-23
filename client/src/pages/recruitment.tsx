import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Briefcase, MapPin, DollarSign, Users, Upload, Sparkles, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { JobPosting, Application } from '@shared/schema';

export default function RecruitmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: jobPostings } = useQuery<JobPosting[]>({
    queryKey: ['/api/recruitment/jobs'],
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/recruitment/applications'],
  });

  const uploadResumeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/recruitment/apply', {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recruitment'] });
      toast({
        title: 'Success',
        description: 'Resume uploaded and parsed successfully',
      });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload resume',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = (jobId: string) => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('jobId', jobId);
    uploadResumeMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-status-info',
      screening: 'bg-status-warning',
      interview: 'bg-status-warning',
      offered: 'bg-status-success',
      rejected: 'bg-status-error',
      hired: 'bg-status-success',
    };
    return colors[status] || 'bg-gray-500';
  };

  const filteredJobs = jobPostings?.filter((job) =>
    `${job.title} ${job.department} ${job.location}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-recruitment-title">
            Recruitment
          </h1>
          <p className="text-muted-foreground">Manage job postings and applications</p>
        </div>
        <Button data-testid="button-add-job">
          <Plus className="mr-2 h-4 w-4" />
          Post Job
        </Button>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-jobs"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs && filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <Card key={job.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {job.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                            {job.salaryMin && job.salaryMax && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${job.salaryMin} - ${job.salaryMax}
                              </span>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Users className="mr-2 h-3 w-3" />
                        Applicants
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search' : 'Post your first job opening'}
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Post Job
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <div className="space-y-4">
            {applications && applications.length > 0 ? (
              applications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{app.candidateName}</h3>
                            <p className="text-sm text-muted-foreground">{app.candidateEmail}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getStatusColor(app.status)}`}></div>
                            <Badge variant="secondary">{app.status}</Badge>
                          </div>
                        </div>

                        {app.aiScore && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                AI Match Score
                              </span>
                              <span className="font-semibold">{app.aiScore}%</span>
                            </div>
                            <Progress value={Number(app.aiScore)} className="h-2" />
                          </div>
                        )}

                        {app.aiExtractedSkills && app.aiExtractedSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {app.aiExtractedSkills.slice(0, 8).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {app.aiSummary && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <p className="text-xs font-medium">AI Summary</p>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {app.aiSummary}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(app.resumeUrl, '_blank')}>
                            <FileText className="mr-2 h-3 w-3" />
                            View Resume
                          </Button>
                          <Button variant="outline" size="sm">
                            Schedule Interview
                          </Button>
                          <Button variant="outline" size="sm" className="ml-auto">
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Applications will appear here once candidates apply
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
