
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
import { FileX, Search, CircleCheck, CirclePercent } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const mockProcessResumes = async (
  resumes: any[],
  jobRequirement: any
): Promise<any[]> => {
  // This is a mock function that simulates processing resumes with AI
  // In a real app, this would call the OpenAI API
  
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return resumes.map(resume => {
    if (resume.processed) return resume;
    
    // Generate random match percentage between 30% and 100%
    const matchPercentage = Math.floor(Math.random() * 70) + 30;
    
    // Create mock extracted data
    const extractedData = {
      name: `Candidate ${Math.floor(Math.random() * 1000)}`,
      email: `candidate${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `555-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10000)}`,
      skills: [
        ...jobRequirement.skills
          .filter(() => Math.random() > 0.3)
          .map(s => s.name),
        "JavaScript",
        "HTML",
        "CSS",
        "React"
      ],
      experience: [
        {
          title: "Frontend Developer",
          company: "Tech Company Inc.",
          years: Math.floor(Math.random() * 5) + 1
        },
        {
          title: "Web Developer",
          company: "Digital Solutions LLC",
          years: Math.floor(Math.random() * 3) + 1
        }
      ],
      education: [
        {
          degree: ["Bachelor's", "Master's", "PhD"][Math.floor(Math.random() * 3)],
          institution: "University of Technology",
          year: 2015 + Math.floor(Math.random() * 8)
        }
      ]
    };
    
    return {
      ...resume,
      processed: true,
      matchPercentage,
      extractedData
    };
  });
};

export default function ResumeResults() {
  const { state, dispatch } = useResumeMatch();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<"name" | "match">("match");
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  useEffect(() => {
    // Process resumes when there are unprocessed ones and a job requirement is selected
    const unprocessedResumes = state.resumes.filter(resume => !resume.processed);
    if (
      unprocessedResumes.length > 0 && 
      state.selectedJobRequirement && 
      !state.isProcessing
    ) {
      const processResumes = async () => {
        dispatch({ type: "SET_PROCESSING", payload: true });
        
        try {
          const processedResumes = await mockProcessResumes(
            unprocessedResumes,
            state.selectedJobRequirement
          );
          
          // Update each resume in the state
          processedResumes.forEach(resume => {
            dispatch({ type: "UPDATE_RESUME", payload: resume });
          });
          
          toast({
            title: "Processing complete",
            description: `${processedResumes.length} resume(s) analyzed successfully.`
          });
        } catch (error) {
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
      
      processResumes();
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Resume Results</h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="sort" className="text-sm">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "match")}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="match">Match %</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      
      {state.isProcessing && (
        <div className="text-center py-4">
          <CirclePercent className="animate-spin h-8 w-8 mx-auto mb-2" />
          <p className="text-muted-foreground">Processing resumes...</p>
        </div>
      )}
      
      {!state.isProcessing && state.resumes.length === 0 && (
        <Card className="bg-secondary/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px] text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No resumes uploaded yet. Upload resumes to see results.
            </p>
          </CardContent>
        </Card>
      )}
      
      {!state.isProcessing && state.resumes.length > 0 && (
        <div className="space-y-3">
          {sortedResumes.map((resume) => (
            <Card key={resume.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{resume.fileName}</CardTitle>
                  {resume.processed && (
                    <div className="flex items-center space-x-1 bg-secondary rounded-full px-3 py-1">
                      <CirclePercent className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {resume.matchPercentage}%
                      </span>
                    </div>
                  )}
                </div>
                <CardDescription>
                  {resume.processed 
                    ? resume.extractedData?.name || "Unnamed Candidate"
                    : "Processing..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                {resume.processed ? (
                  <div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Match Score</span>
                        <span>{resume.matchPercentage}%</span>
                      </div>
                      <Progress value={resume.matchPercentage} className="h-2" />
                    </div>
                    
                    {resume.extractedData?.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resume.extractedData.skills.slice(0, 5).map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.extractedData.skills.length > 5 && (
                          <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                            +{resume.extractedData.skills.length - 5} more
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
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteResume(resume.id)}
                >
                  <FileX className="h-4 w-4 mr-1" />
                  Remove
                </Button>
                {resume.processed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(resume)}
                  >
                    View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Resume Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resume Details</DialogTitle>
            <DialogDescription>
              {selectedResume?.fileName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResume && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{selectedResume.extractedData?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedResume.extractedData?.email} • {selectedResume.extractedData?.phone}
                  </p>
                </div>
                <div className="flex items-center space-x-1 bg-secondary rounded-full px-3 py-1">
                  <CirclePercent className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    {selectedResume.matchPercentage}% Match
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedResume.extractedData?.skills.map((skill: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center px-2 py-1 bg-secondary rounded-md text-xs"
                    >
                      <CircleCheck className="h-3 w-3 mr-1" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Experience</h4>
                {selectedResume.extractedData?.experience.map((exp: any, i: number) => (
                  <div key={i} className="mb-2">
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-sm">{exp.company}</p>
                    <p className="text-xs text-muted-foreground">{exp.years} years</p>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Education</h4>
                {selectedResume.extractedData?.education.map((edu: any, i: number) => (
                  <div key={i} className="mb-2">
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-sm">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground">Class of {edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
