
import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { CirclePlus, CircleMinus, FileText, CircleX, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { generateJobProfile, getOpenAIApiKey } from "@/utils/openai";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function JobRequirements() {
  const { state, dispatch } = useResumeMatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentJob, setCurrentJob] = useState<null | {
    id: string;
    title: string;
    description: string;
    skills: { name: string; weight: number }[];
    experience: { years: number; weight: number };
    education: { level: string; weight: number };
  }>(null);

  const handleOpenDialog = (isEdit = false, job = null) => {
    if (isEdit && job) {
      setCurrentJob(job);
    } else {
      setCurrentJob({
        id: uuidv4(),
        title: "",
        description: "",
        skills: [{ name: "", weight: 1 }],
        experience: { years: 1, weight: 1 },
        education: { level: "Bachelor's", weight: 1 }
      });
    }
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setCurrentJob(null);
  };

  const handleAddSkill = () => {
    if (currentJob) {
      setCurrentJob({
        ...currentJob,
        skills: [...currentJob.skills, { name: "", weight: 1 }]
      });
    }
  };

  const handleRemoveSkill = (index: number) => {
    if (currentJob && currentJob.skills.length > 1) {
      const updatedSkills = [...currentJob.skills];
      updatedSkills.splice(index, 1);
      setCurrentJob({
        ...currentJob,
        skills: updatedSkills
      });
    }
  };

  const handleSkillChange = (index: number, name: string) => {
    if (currentJob) {
      const updatedSkills = [...currentJob.skills];
      updatedSkills[index] = { ...updatedSkills[index], name };
      setCurrentJob({
        ...currentJob,
        skills: updatedSkills
      });
    }
  };

  const handleSkillWeightChange = (index: number, weight: number) => {
    if (currentJob) {
      const updatedSkills = [...currentJob.skills];
      updatedSkills[index] = { ...updatedSkills[index], weight };
      setCurrentJob({
        ...currentJob,
        skills: updatedSkills
      });
    }
  };

  const handleTitleChange = async (title: string) => {
    if (currentJob) {
      setCurrentJob({
        ...currentJob,
        title
      });
      
      // Auto-generate if title is at least 5 characters and API key exists
      if (title.length >= 5 && !isGenerating) {
        const apiKey = getOpenAIApiKey();
        if (!apiKey) {
          toast({
            title: "API Key Required",
            description: (
              <div className="space-y-2">
                <p>An OpenAI API key is required for auto-generation.</p>
                <Button size="sm" variant="outline" onClick={() => navigate("/settings")}>
                  Go to Settings
                </Button>
              </div>
            ),
            variant: "destructive",
          });
          return;
        }
        
        await handleAutoGenerate(title);
      }
    }
  };

  const handleAutoGenerate = async (titleToUse?: string) => {
    if (!currentJob) return;
    
    const title = titleToUse || currentJob.title;
    
    if (title.length < 3) {
      toast({
        title: "Title Too Short",
        description: "Please enter a more specific job title for better generation results.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const generatedProfile = await generateJobProfile(title);
      
      if (generatedProfile.error) {
        toast({
          title: "Generation Failed",
          description: generatedProfile.error,
          variant: "destructive",
        });
        return;
      }
      
      setCurrentJob({
        ...currentJob,
        description: generatedProfile.description,
        skills: generatedProfile.skills.length > 0 ? 
          generatedProfile.skills : 
          [{ name: "", weight: 1 }],
        experience: generatedProfile.experience,
        education: generatedProfile.education,
      });
      
      toast({
        title: "Profile Generated",
        description: "Job profile details have been automatically generated.",
      });
    } catch (error) {
      console.error("Error generating job profile:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate job profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!currentJob || !currentJob.title) return;

    if (state.jobRequirements.some(job => job.id === currentJob.id)) {
      dispatch({ type: "UPDATE_JOB_REQUIREMENT", payload: currentJob });
    } else {
      dispatch({ type: "ADD_JOB_REQUIREMENT", payload: currentJob });
    }
    
    handleCloseDialog();
  };

  const handleSelectJob = (jobId: string) => {
    dispatch({ type: "SELECT_JOB_REQUIREMENT", payload: jobId });
  };

  const handleDeleteJob = (jobId: string) => {
    dispatch({ type: "DELETE_JOB_REQUIREMENT", payload: jobId });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Job Requirements</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <CirclePlus className="mr-2 h-4 w-4" />
              New Job Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentJob && state.jobRequirements.some(job => job.id === currentJob.id)
                  ? "Edit Job Profile"
                  : "Create Job Profile"}
              </DialogTitle>
              <DialogDescription>
                Enter a job title and the system will automatically generate a profile, or fill in the details manually.
              </DialogDescription>
            </DialogHeader>
            {currentJob && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={currentJob.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Senior React Developer"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleAutoGenerate()}
                    disabled={isGenerating || !currentJob.title}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Auto Generate Profile"
                    )}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    value={currentJob.description}
                    onChange={(e) => setCurrentJob({
                      ...currentJob,
                      description: e.target.value
                    })}
                    placeholder="Enter a brief job description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Required Skills</Label>
                  {currentJob.skills.map((skill, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={skill.name}
                        onChange={(e) => handleSkillChange(index, e.target.value)}
                        placeholder="e.g. React, TypeScript"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={skill.weight}
                        onChange={(e) => handleSkillWeightChange(index, parseInt(e.target.value))}
                        className="w-16"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSkill(index)}
                      >
                        <CircleX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddSkill}
                  >
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Add Skill
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min={0}
                      value={currentJob.experience.years}
                      onChange={(e) => setCurrentJob({
                        ...currentJob,
                        experience: {
                          ...currentJob.experience,
                          years: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expWeight">Weight</Label>
                    <Input
                      id="expWeight"
                      type="number"
                      min={1}
                      max={10}
                      value={currentJob.experience.weight}
                      onChange={(e) => setCurrentJob({
                        ...currentJob,
                        experience: {
                          ...currentJob.experience,
                          weight: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">Education Level</Label>
                    <select
                      id="education"
                      value={currentJob.education.level}
                      onChange={(e) => setCurrentJob({
                        ...currentJob,
                        education: {
                          ...currentJob.education,
                          level: e.target.value
                        }
                      })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="High School">High School</option>
                      <option value="Associate's">Associate's</option>
                      <option value="Bachelor's">Bachelor's</option>
                      <option value="Master's">Master's</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eduWeight">Weight</Label>
                    <Input
                      id="eduWeight"
                      type="number"
                      min={1}
                      max={10}
                      value={currentJob.education.weight}
                      onChange={(e) => setCurrentJob({
                        ...currentJob,
                        education: {
                          ...currentJob.education,
                          weight: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {state.jobRequirements.length === 0 ? (
        <Card className="bg-secondary/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[150px] text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No job profiles created yet. Create one to start matching resumes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.jobRequirements.map((job) => (
            <Card 
              key={job.id}
              className={job.id === state.selectedJobRequirement?.id 
                ? "border-primary"
                : "border-border"
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {job.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1">
                  {job.skills.slice(0, 3).map((skill, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                    >
                      {skill.name || "Unnamed skill"}
                    </span>
                  ))}
                  {job.skills.length > 3 && (
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                      +{job.skills.length - 3} more
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenDialog(true, job)}
                >
                  Edit
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    <CircleMinus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSelectJob(job.id)}
                    disabled={job.id === state.selectedJobRequirement?.id}
                  >
                    {job.id === state.selectedJobRequirement?.id
                      ? "Selected" 
                      : "Select"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
