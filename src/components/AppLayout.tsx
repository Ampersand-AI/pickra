
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/FileUpload";
import JobRequirements from "@/components/JobRequirements";
import ResumeResults from "@/components/ResumeResults";
import { Settings, ListChecks } from "lucide-react";
import JobRequirementsList from "@/components/JobRequirementsList";
import { useResumeMatch } from "@/context/ResumeMatchContext";

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState("jobRequirements");
  const navigate = useNavigate();
  const { state } = useResumeMatch();
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resume Match AI</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <JobRequirementsList />
            
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="jobRequirements">Add Job</TabsTrigger>
                <TabsTrigger value="upload">Upload CVs</TabsTrigger>
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
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Results</h2>
            {state.selectedJobRequirement && (
              <div className="text-sm bg-secondary rounded-full px-3 py-1">
                Job: {state.selectedJobRequirement.title}
              </div>
            )}
          </div>
          <ResumeResults />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
