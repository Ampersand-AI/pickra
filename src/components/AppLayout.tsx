
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/FileUpload";
import JobRequirements from "@/components/JobRequirements";
import ResumeResults from "@/components/ResumeResults";
import { Settings, ListChecks, PlusCircle, FileCheck2, FileText, BriefcaseIcon } from "lucide-react";
import JobRequirementsList from "@/components/JobRequirementsList";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { getActiveAIProvider } from "@/utils/openaiApi";

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState("jobRequirements");
  const navigate = useNavigate();
  const { state } = useResumeMatch();
  const activeProvider = getActiveAIProvider();
  const providerName = activeProvider === "openai" ? "OpenAI" : "DeepSeek";
  
  return (
    <div className="min-h-screen bg-muted/5">
      <div className="border-b border-border/40 bg-card shadow-sm">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Resume Match AI</h1>
            <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hidden sm:block">
              Using {providerName}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            className="gap-1"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
      
      <div className="container py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex flex-col space-y-4">
              <JobRequirementsList />
              
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="jobRequirements" className="flex items-center gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Add Job
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Upload CVs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="jobRequirements">
                  <JobRequirements />
                </TabsContent>

                <TabsContent value="upload">
                  <FileUpload />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 bg-card border border-border/40 rounded-lg p-3 shadow-sm">
              <ListChecks className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Results</h2>
              {state.selectedJobRequirement && (
                <div className="flex items-center gap-2 ml-auto">
                  <BriefcaseIcon size={14} className="text-muted-foreground" />
                  <span className="text-sm bg-muted/50 rounded-full px-3 py-1">
                    {state.selectedJobRequirement.title}
                  </span>
                </div>
              )}
            </div>
            <ResumeResults />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
