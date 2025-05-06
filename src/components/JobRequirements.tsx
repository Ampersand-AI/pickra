import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, X, BadgeCheck, BriefcaseIcon, GraduationCap } from "lucide-react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { getActiveAIProvider, generateJobProfile as generateJobProfileOpenRouter } from "@/utils/openRouterApi";
import { generateJobProfile as generateJobProfileDeepseek } from "@/utils/deepseekApi";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Progress } from "@/components/ui/progress";

const JobRequirements = () => {
  const { state, dispatch } = useResumeMatch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<Array<{ name: string; weight: number }>>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [education, setEducation] = useState("Bachelor's");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const activeProvider = getActiveAIProvider();
  const providerName = activeProvider === "openrouter" ? "OpenRouter" : "DeepSeek";
  const form = useForm();

  // Add console logs for state changes
  useEffect(() => {
    console.log('Education level changed:', education);
  }, [education]);

  useEffect(() => {
    console.log('Experience years changed:', experienceYears);
  }, [experienceYears]);

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
      if (activeProvider === "openrouter") {
        jobProfile = await generateJobProfileOpenRouter(title);
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
        // Defensive mapping: support both top-level and job_profile-wrapped responses
        const profile = jobProfile.job_profile || jobProfile;
        let mappedSkills = Array.isArray(profile.skills)
          ? profile.skills
              .filter(skill => skill && (skill.name || skill.skill))
              .map(skill => ({
                name: skill.name || skill.skill,
                weight: skill.weight || skill.importance || 5
              }))
          : [];
        // Prevent duplicates
        const uniqueSkills = [];
        const skillNames = new Set();
        for (const skill of mappedSkills) {
          if (!skillNames.has(skill.name)) {
            uniqueSkills.push(skill);
            skillNames.add(skill.name);
          }
        }
        setSkills(uniqueSkills);
        // Debug log
        console.log("Set skills after generation:", uniqueSkills);
        // Don't update experience and education at all - preserve user's selection
        // setExperienceYears(jobProfile.experience.years);
        // setEducation(jobProfile.education.level);
        
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
  };

  return (
    <Card className="shadow-md border border-border/40">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-lg flex items-center gap-1.5">
          <BriefcaseIcon className="h-4 w-4" />
          New Job Requirement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              name="jobTitle"
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Job Title</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter job title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-background"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="jobDescription"
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter job description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-background resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="education"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                      <GraduationCap className="h-3 w-3" />
                      Education Level
                    </FormLabel>
                    <FormControl>
                      <select
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="High School">High School</option>
                        <option value="Associate's">Associate's</option>
                        <option value="Bachelor's">Bachelor's</option>
                        <option value="Master's">Master's</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="experience"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Experience (Years)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                        className="bg-background"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="skills"
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <BadgeCheck className="h-3 w-3" />
                    Required Skills
                  </FormLabel>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add a skill"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                      className="bg-background"
                    />
                    <Button 
                      onClick={handleAddSkill} 
                      type="button" 
                      variant="secondary"
                      size="sm"
                      className="h-10"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {skills.length > 0 && (
                    <div className="flex flex-col gap-3 mt-3 p-4 bg-muted/30 rounded-md border border-border min-h-[100px] w-full">
                      {skills.map((skill, index) => (
                        <div 
                          key={index} 
                          className="bg-background text-foreground px-4 py-2 rounded-md text-sm flex items-center justify-between w-full border border-border shadow-sm hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium text-foreground/90">{skill.name}</span>
                          <button 
                            onClick={() => handleRemoveSkill(index)}
                            className="text-muted-foreground hover:text-destructive focus:outline-none ml-2 p-1 hover:bg-muted rounded-sm transition-colors"
                            type="button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-2 space-x-3">
              <Button
                variant="outline"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !title.trim()}
                className="flex-1 text-white hover:text-white hover:bg-primary/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="flex-1 text-center">
                      Generating...
                      <Progress 
                        value={100} 
                        className="h-1 mt-1"
                        indicatorClassName="animate-pulse"
                      />
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with {providerName}
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!title || !description || skills.length === 0} 
                className="flex-1 "
              >
                Save Job
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default JobRequirements;
