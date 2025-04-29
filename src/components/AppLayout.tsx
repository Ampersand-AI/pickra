
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/FileUpload";
import JobRequirements from "@/components/JobRequirements";
import ResumeResults from "@/components/ResumeResults";
import { Settings } from "lucide-react";

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState("jobRequirements");
  const navigate = useNavigate();

  // Remove the files state and handleFilesProcessed function since we don't need them
  
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="jobRequirements">Job Requirements</TabsTrigger>
            <TabsTrigger value="upload">Upload Resumes</TabsTrigger>
          </TabsList>

          <TabsContent value="jobRequirements">
            <JobRequirements />
          </TabsContent>

          <TabsContent value="upload">
            {/* Remove the onFilesProcessed prop */}
            <FileUpload />
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <ResumeResults />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
