import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/FileUpload";
import JobRequirements from "@/components/JobRequirements";
import ResumeResults from "@/components/ResumeResults";
import { Settings, ListChecks, PlusCircle, FileCheck2, FileText, BriefcaseIcon, Home, Moon, Sun } from "lucide-react";
import JobRequirementsList from "@/components/JobRequirementsList";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { getActiveAIProvider } from "@/utils/openaiApi";
import { useTheme } from "@/components/theme-provider";

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState("jobRequirements");
  const navigate = useNavigate();
  const { state } = useResumeMatch();
  const activeProvider = getActiveAIProvider();
  const providerName = activeProvider === "openai" ? "OpenAI" : "DeepSeek";
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1">
        <div className="border-b border-border/40 bg-card/50 shadow-sm">
          <div className="container py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileCheck2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Pickra AI</h1>
              <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hidden sm:block">
                Using {providerName}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="mr-1"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="gap-1"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              
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
        </div>
        
        <div className="container py-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="flex flex-col space-y-6">
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

                  <TabsContent value="jobRequirements" className="mt-4 animate-fade-in">
                    <JobRequirements />
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4 animate-fade-in">
                    <FileUpload />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 bg-card border border-border/40 rounded-lg p-4 shadow-sm">
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
      <footer className="w-[1440px] h-[73.5px] border-t-[1.5px] border-border/40 rounded-tl-[12px] rounded-tr-[12px] px-8 py-4 flex flex-row items-center justify-between gap-6 mx-auto bg-background">
        {/* Left: Icon + Links */}
        <div className="flex items-center gap-6">
          <FileCheck2 className="h-5 w-5 text-primary" />
          <div className="flex gap-6 text-sm">
            <a href="#" className="underline text-muted-foreground hover:text-primary">Terms of use</a>
            <a href="#" className="underline text-muted-foreground hover:text-primary">Privacy Policy</a>
            <a href="#" className="underline text-muted-foreground hover:text-primary">Disclaimer</a>
            <a href="#" className="underline text-muted-foreground hover:text-primary">Responsible AI</a>
          </div>
        </div>
        {/* Right: Copyright + Lawbit AI + NeuralArc */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Copyright 2025. All rights reserved.</span>
          <span>Lawbit AI, a thing by</span>
          {/* Placeholder for NeuralArc icon */}
          <span className="inline-block bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white font-bold">N</span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
