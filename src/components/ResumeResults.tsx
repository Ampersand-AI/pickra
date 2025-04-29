
import { useState, useEffect } from "react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { 
  FileX, Search, CircleCheck, CirclePercent, Settings, 
  FileQuestion, Loader2, UserCircle, Mail, Phone, BadgeCheck, GraduationCap, 
  Building2, Calendar, BarChart, ChevronRight 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { parseResume as parseResumeOpenAI } from "@/utils/openaiApi";
import { parseResume as parseResumeDeepseek } from "@/utils/deepseekApi";
import { getActiveAIProvider } from "@/utils/openaiApi";
import { cn } from "@/lib/utils";

export default function ResumeResults() {
  const { state, dispatch } = useResumeMatch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"name" | "match">("match");
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeProvider = getActiveAIProvider();
  
  useEffect(() => {
    // Process resumes when there are unprocessed ones and a job requirement is selected
    const unprocessedResumes = state.resumes.filter(resume => !resume.processed);
    if (
      unprocessedResumes.length > 0 && 
      state.selectedJobRequirement && 
      !state.isProcessing
    ) {
      const processResumeData = async () => {
        dispatch({ type: "SET_PROCESSING", payload: true });
        
        try {
          // Process each unprocessed resume
          for (const resume of unprocessedResumes) {
            try {
              // Use the appropriate API based on user's preference
              let parsedData;
              if (activeProvider === "openai") {
                parsedData = await parseResumeOpenAI("Sample resume content", state.selectedJobRequirement);
              } else {
                parsedData = await parseResumeDeepseek("Sample resume content", state.selectedJobRequirement);
              }
              
              dispatch({ 
                type: "UPDATE_RESUME", 
                payload: {
                  ...resume,
                  processed: true,
                  matchPercentage: parsedData.matchPercentage,
                  matchReason: parsedData.matchReason,
                  extractedData: {
                    name: parsedData.name,
                    email: parsedData.email,
                    phone: parsedData.phone,
                    skills: parsedData.skills,
                    experience: parsedData.experience,
                    education: parsedData.education
                  }
                }
              });
            } catch (error) {
              console.error(`Error processing resume ${resume.fileName}:`, error);
              dispatch({ 
                type: "UPDATE_RESUME", 
                payload: {
                  ...resume,
                  processed: true,
                  matchPercentage: 0,
                  matchReason: "Error processing resume",
                  extractedData: {
                    name: "Error",
                    email: "error@processing.com",
                    skills: ["Error processing resume"],
                    experience: [],
                    education: []
                  }
                }
              });
            }
          }
          
          toast({
            title: "Processing complete",
            description: `${unprocessedResumes.length} resume(s) analyzed successfully.`
          });
        } catch (error) {
          console.error("Error processing resumes:", error);
          dispatch({ 
            type: "SET_ERROR", 
            payload: "Failed to process resumes. Please try again." 
          });
          
          toast({
            title: "Processing failed",
            description: "There was a problem analyzing the resumes.",
            variant: "destructive"
          });
        } finally {
          dispatch({ type: "SET_PROCESSING", payload: false });
        }
      };
      
      processResumeData();
    }
  }, [state.resumes, state.selectedJobRequirement]);

  const handleDeleteResume = (id: string) => {
    dispatch({ type: "DELETE_RESUME", payload: id });
  };
  
  const handleViewDetails = (resume: any) => {
    setSelectedResume(resume);
    setDialogOpen(true);
  };
  
  // Sort resumes based on selected sort method
  const sortedResumes = [...state.resumes].sort((a, b) => {
    if (sortBy === "match") {
      return (b.matchPercentage || 0) - (a.matchPercentage || 0);
    } else {
      return a.fileName.localeCompare(b.fileName);
    }
  });

  // Get match level text and color based on percentage
  const getMatchLevelInfo = (percentage: number) => {
    if (percentage >= 80) return { text: "Excellent match", color: "text-green-600 bg-green-50" };
    if (percentage >= 60) return { text: "Good match", color: "text-blue-600 bg-blue-50" };
    if (percentage >= 40) return { text: "Average match", color: "text-amber-600 bg-amber-50" };
    return { text: "Poor match", color: "text-red-600 bg-red-50" };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold hidden sm:block">Candidate Matches</h2>
        <div className="flex items-center space-x-2 ml-auto">
          <label htmlFor="sort" className="text-sm text-muted-foreground">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "match")}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="match">Match %</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      
      {state.isProcessing && (
        <Card className="shadow-md border border-border/40">
          <CardContent className="text-center py-12 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">Processing resumes...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!state.isProcessing && state.resumes.length === 0 && (
        <Card className="bg-muted/20 shadow-md border border-border/40">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px] text-center py-12">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No resumes uploaded</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Upload resumes to see AI-powered matching results and candidate recommendations.
            </p>
          </CardContent>
        </Card>
      )}
      
      {!state.isProcessing && state.resumes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedResumes.map((resume) => {
            const matchInfo = resume.processed ? getMatchLevelInfo(resume.matchPercentage) : null;
            
            return (
              <Card 
                key={resume.id} 
                className={cn(
                  "shadow-sm hover:shadow-md transition-all border border-border/40",
                  resume.processed && resume.matchPercentage > 70 && "bg-green-50/10 border-green-200/30"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-1">
                      {resume.processed && resume.extractedData?.name || resume.fileName}
                    </CardTitle>
                    {resume.processed && (
                      <div 
                        className={cn(
                          "flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs", 
                          matchInfo?.color
                        )}
                      >
                        <CirclePercent className="h-3 w-3" />
                        <span className="font-medium">{resume.matchPercentage}%</span>
                      </div>
                    )}
                  </div>
                  <CardDescription>
                    {resume.fileName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  {resume.processed ? (
                    <div>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Match Score</span>
                          <span className="font-medium">{matchInfo?.text}</span>
                        </div>
                        <Progress 
                          value={resume.matchPercentage} 
                          className="h-2"
                          indicatorClassName={cn(
                            resume.matchPercentage >= 80 ? "bg-green-500" :
                            resume.matchPercentage >= 60 ? "bg-blue-500" :
                            resume.matchPercentage >= 40 ? "bg-amber-500" : "bg-red-500"
                          )}
                        />
                      </div>
                      
                      {resume.extractedData?.skills && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {resume.extractedData.skills.slice(0, 4).map((skill: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {resume.extractedData.skills.length > 4 && (
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                              +{resume.extractedData.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[60px]">
                      <CirclePercent className="animate-spin h-5 w-5 mr-2" />
                      <span className="text-sm">Processing resume...</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteResume(resume.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                  >
                    <FileX className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                  {resume.processed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(resume)}
                      className="gap-1"
                    >
                      View Details
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Resume Detail Dialog */}
      {selectedResume && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resume Details</DialogTitle>
              <DialogDescription>
                {selectedResume?.fileName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedResume && (
              <div className="space-y-6">
                {/* Candidate Header with Match Score */}
                <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                  <div className="space-y-1">
                    <h3 className="font-medium text-xl flex items-center gap-1.5">
                      <UserCircle className="h-5 w-5 text-primary" />
                      {selectedResume.extractedData?.name || "Unnamed Candidate"}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      {selectedResume.extractedData?.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{selectedResume.extractedData?.email}</span>
                        </div>
                      )}
                      {selectedResume.extractedData?.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{selectedResume.extractedData?.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className={cn(
                      "flex items-center space-x-1 rounded-full px-3 py-1 text-sm",
                      selectedResume.matchPercentage >= 80 ? "bg-green-50 text-green-700" :
                      selectedResume.matchPercentage >= 60 ? "bg-blue-50 text-blue-700" :
                      selectedResume.matchPercentage >= 40 ? "bg-amber-50 text-amber-700" : 
                      "bg-red-50 text-red-700"
                    )}>
                      <BarChart className="h-4 w-4" />
                      <span className="font-semibold">{selectedResume.matchPercentage}% Match</span>
                    </div>
                    <span className="text-xs mt-1 text-muted-foreground">
                      {selectedResume.matchPercentage >= 80 ? "Excellent match" :
                       selectedResume.matchPercentage >= 60 ? "Good match" :
                       selectedResume.matchPercentage >= 40 ? "Average match" : 
                       "Poor match"}
                    </span>
                  </div>
                </div>
                
                {/* Match Analysis */}
                {selectedResume.matchReason && (
                  <div className="bg-muted/20 p-4 rounded-md border border-border/40">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <CircleCheck className="h-4 w-4 text-primary" />
                      Match Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedResume.matchReason}
                    </p>
                  </div>
                )}
                
                {/* Skills Section */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResume.extractedData?.skills.map((skill: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center px-2 py-1 bg-muted/30 rounded-md text-sm border border-border/40"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Experience Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" />
                    Experience
                  </h4>
                  {selectedResume.extractedData?.experience.length > 0 ? (
                    <div className="grid gap-3">
                      {selectedResume.extractedData?.experience.map((exp: any, i: number) => (
                        <div key={i} className="bg-muted/10 p-3 rounded-md border border-border/30">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{exp.title}</p>
                            <div className="flex items-center text-xs px-2 py-0.5 bg-muted/30 rounded-full text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {exp.years} {exp.years === 1 ? "year" : "years"}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No experience data found</p>
                  )}
                </div>
                
                {/* Education Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Education
                  </h4>
                  {selectedResume.extractedData?.education.length > 0 ? (
                    <div className="grid gap-3">
                      {selectedResume.extractedData?.education.map((edu: any, i: number) => (
                        <div key={i} className="bg-muted/10 p-3 rounded-md border border-border/30">
                          <p className="font-medium">{edu.degree}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            <div className="text-xs px-2 py-0.5 bg-muted/30 rounded-full text-muted-foreground">
                              Class of {edu.year}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No education data found</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
