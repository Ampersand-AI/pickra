
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles, X, BadgeCheck, BriefcaseIcon, GraduationCap } from "lucide-react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { getActiveAIProvider } from "@/utils/openaiApi";
import { generateJobProfile as generateJobProfileOpenAI } from "@/utils/openaiApi";
import { generateJobProfile as generateJobProfileDeepseek } from "@/utils/deepseekApi";

const JobRequirements = () => {
  const { state, dispatch } = useResumeMatch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<Array<{ name: string; weight: number }>>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [experienceYears, setExperienceYears] = useState(2);
  const [education, setEducation] = useState("Bachelor's");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const activeProvider = getActiveAIProvider();
  const providerName = activeProvider === "openai" ? "OpenAI" : "DeepSeek";

  const handleAddSkill = () => {
    if (!currentSkill.trim()) return;
    
    setSkills([...skills, { name: currentSkill.trim(), weight: 5 }]);
    setCurrentSkill("");
  };

  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...skills];
    updatedSkills.splice(index, 1);
    setSkills(updatedSkills);
  };

  const handleGenerateDescription = async () => {
    if (!title) {
      toast({
        title: "Job Title Required",
        description: "Please enter a job title to generate a job profile.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use the appropriate API based on user's preference
      let jobProfile;
      if (activeProvider === "openai") {
        jobProfile = await generateJobProfileOpenAI(title);
      } else {
        jobProfile = await generateJobProfileDeepseek(title);
      }
      
      if (jobProfile.error) {
        toast({
          title: "Failed to Generate Job Profile",
          description:
            jobProfile.error || "Failed to generate job profile. Please try again.",
          variant: "destructive",
        });
      } else {
        setDescription(jobProfile.description);
        setSkills(jobProfile.skills || []);
        setExperienceYears(jobProfile.experience.years);
        setEducation(jobProfile.education.level);
        
        toast({
          title: "Profile Generated",
          description: "Job profile has been generated successfully.",
        });
      }
    } catch (error) {
      console.error("Error generating job profile:", error);
      toast({
        title: "Error",
        description: "Failed to generate job profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title || !description) {
      toast({
        title: "Missing Information",
        description: "Please enter both job title and description.",
        variant: "destructive",
      });
      return;
    }

    if (skills.length === 0) {
      toast({
        title: "Skills Required",
        description: "Please add at least one required skill.",
        variant: "destructive",
      });
      return;
    }

    const newJobRequirement = {
      id: uuidv4(),
      title,
      description,
      skills,
      experience: { years: experienceYears, weight: 5 },
      education: { level: education, weight: 5 },
    };

    dispatch({ type: "ADD_JOB_REQUIREMENT", payload: newJobRequirement });
    dispatch({ type: "SELECT_JOB_REQUIREMENT", payload: newJobRequirement.id });
    
    toast({
      title: "Job Requirement Added",
      description: "The job requirement has been successfully added.",
    });

    // Clear the input fields
    setTitle("");
    setDescription("");
    setSkills([]);
    setExperienceYears(2);
    setEducation("Bachelor's");
  };

  return (
    <Card className="shadow-md border border-border/40">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-lg flex items-center gap-1.5">
          <BriefcaseIcon className="h-4 w-4" />
          New Job Requirement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Job Title</label>
          <Input
            type="text"
            placeholder="Enter job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-muted/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Job Description</label>
          <Textarea
            placeholder="Enter job description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-muted/20 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <div className="w-1/2 space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3" />
              Required Education
            </label>
            <select
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full rounded-md border border-border bg-muted/20 p-2 text-sm"
            >
              <option value="High School">High School</option>
              <option value="Associate's">Associate's</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          <div className="w-1/2 space-y-2">
            <label className="text-sm font-medium">Required Experience (Years)</label>
            <Input
              type="number"
              min={0}
              max={20}
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
              className="bg-muted/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <BadgeCheck className="h-3 w-3" />
            Required Skills
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add a skill"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              className="bg-muted/20"
            />
            <Button onClick={handleAddSkill} type="button" variant="secondary">Add</Button>
          </div>
          
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 p-2 bg-muted/20 rounded-md border border-border/20">
              {skills.map((skill, index) => (
                <div 
                  key={index} 
                  className="bg-muted/40 text-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-border/20"
                >
                  {skill.name}
                  <button 
                    onClick={() => handleRemoveSkill(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2 space-x-3">
          <Button
            variant="outline"
            onClick={handleGenerateDescription}
            disabled={isGenerating || !title.trim()}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with {providerName}
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={!title || !description || skills.length === 0} className="flex-1">Save Job</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobRequirements;
