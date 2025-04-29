import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { generateJobProfile } from "@/utils/deepseekApi";

const JobRequirements = () => {
  const { state, dispatch } = useResumeMatch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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

    const newJobRequirement = {
      id: uuidv4(),
      title,
      description,
      skills: [], // Initialize with empty skills
      experience: { years: 0, weight: 5 }, // Initialize with default values
      education: { level: "Bachelor's", weight: 5 }, // Initialize with default values
    };

    dispatch({ type: "ADD_JOB_REQUIREMENT", payload: newJobRequirement });
    toast({
      title: "Job Requirement Added",
      description: "The job requirement has been successfully added.",
    });

    // Clear the input fields
    setTitle("");
    setDescription("");
  };

  return (
    <Card className="shadow-md">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Job Title</h2>
          <Input
            type="text"
            placeholder="Enter job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Job Description</h2>
          <Textarea
            placeholder="Enter job description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-between">
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
          <Button onClick={handleSave}>Save Job Requirement</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobRequirements;
