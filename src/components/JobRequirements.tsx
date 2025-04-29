
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles, X } from "lucide-react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { generateJobProfile } from "@/utils/deepseekApi";

const JobRequirements = () => {
  const { state, dispatch } = useResumeMatch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<Array<{ name: string; weight: number }>>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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
      const jobProfile = await generateJobProfile(title);
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
      experience: { years: 2, weight: 5 },
      education: { level: "Bachelor's", weight: 5 },
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
    <Card className="shadow-md">
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <h2 className="text-md font-semibold">Job Title</h2>
          <Input
            type="text"
            placeholder="Enter job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-md font-semibold">Job Description</h2>
          <Textarea
            placeholder="Enter job description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-md font-semibold">Required Skills</h2>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add a skill"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <Button onClick={handleAddSkill} type="button">Add</Button>
          </div>
          
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, index) => (
                <div 
                  key={index} 
                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {skill.name}
                  <button 
                    onClick={() => handleRemoveSkill(index)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button
            variant="secondary"
            onClick={handleGenerateDescription}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Job Profile
              </>
            )}
          </Button>
          <Button onClick={handleSave}>Save Job</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobRequirements;
