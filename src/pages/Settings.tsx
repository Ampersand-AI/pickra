
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Check, ArrowLeft, Loader2, Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { testDeepseekConnection } from "@/utils/deepseekApi";
import { testOpenAIConnection } from "@/utils/openaiApi";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  // DeepSeek settings
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem("deepseek_api_key");
    return savedKey || "";
  });
  
  const [deepseekModel, setDeepseekModel] = useState<string>(() => {
    const savedModel = localStorage.getItem("deepseek_model");
    return savedModel || "deepseek-chat";
  });
  
  // OpenAI settings
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    return savedKey || "";
  });
  
  const [openaiModel, setOpenaiModel] = useState<string>(() => {
    const savedModel = localStorage.getItem("openai_model");
    return savedModel || "gpt-4o";
  });
  
  const [activeProvider, setActiveProvider] = useState<string>(() => {
    const savedProvider = localStorage.getItem("active_ai_provider");
    return savedProvider || "openai";
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testingDeepseek, setTestingDeepseek] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [deepseekSaved, setDeepseekSaved] = useState(false);
  const [openaiSaved, setOpenaiSaved] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const handleTestDeepseek = async () => {
    if (!deepseekApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a DeepSeek API key to test connection.",
        variant: "destructive",
      });
      return;
    }

    setTestingDeepseek(true);
    
    // Save current values before testing
    localStorage.setItem("deepseek_api_key", deepseekApiKey);
    localStorage.setItem("deepseek_model", deepseekModel);
    
    const result = await testDeepseekConnection();
    
    setTestingDeepseek(false);
    
    if (result.success) {
      toast({
        title: "Connection Successful",
        description: "Successfully connected to DeepSeek API!",
      });
      setDeepseekSaved(true);
      if (activeProvider === "deepseek") {
        setTimeout(() => navigate('/'), 1500);
      }
    } else {
      toast({
        title: "Connection Failed",
        description: result.message,
        variant: "destructive",
      });
      setDeepseekSaved(false);
    }
  };

  const handleTestOpenAI = async () => {
    if (!openaiApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an OpenAI API key to test connection.",
        variant: "destructive",
      });
      return;
    }

    setTestingOpenai(true);
    
    // Save current values before testing
    localStorage.setItem("openai_api_key", openaiApiKey);
    localStorage.setItem("openai_model", openaiModel);
    
    const result = await testOpenAIConnection();
    
    setTestingOpenai(false);
    
    if (result.success) {
      toast({
        title: "Connection Successful",
        description: "Successfully connected to OpenAI API!",
      });
      setOpenaiSaved(true);
      if (activeProvider === "openai") {
        setTimeout(() => navigate('/'), 1500);
      }
    } else {
      toast({
        title: "Connection Failed",
        description: result.message,
        variant: "destructive",
      });
      setOpenaiSaved(false);
    }
  };

  const handleSetActiveProvider = (provider: string) => {
    localStorage.setItem("active_ai_provider", provider);
    setActiveProvider(provider);
    toast({
      title: `${provider === 'openai' ? 'OpenAI' : 'DeepSeek'} Selected`,
      description: `Now using ${provider === 'openai' ? 'OpenAI' : 'DeepSeek'} for resume processing.`,
    });
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="container py-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue={activeProvider} className="mb-8">
        <TabsList className="grid grid-cols-2 mb-4 w-full">
          <TabsTrigger value="openai" onClick={() => setActiveProvider('openai')}>OpenAI</TabsTrigger>
          <TabsTrigger value="deepseek" onClick={() => setActiveProvider('deepseek')}>DeepSeek</TabsTrigger>
        </TabsList>
        
        {/* OpenAI Settings */}
        <TabsContent value="openai">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI API Integration</CardTitle>
              <CardDescription>
                Configure your OpenAI API settings for resume parsing and job profile generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openai-api-key">API Key</Label>
                <div className="flex">
                  <Input
                    id="openai-api-key"
                    type={showApiKey ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={toggleShowApiKey}
                    className="ml-2"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="openai-model">Model</Label>
                <Select value={openaiModel} onValueChange={setOpenaiModel}>
                  <SelectTrigger id="openai-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Best quality)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster, cheaper)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Basic)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The model used for processing resumes. GPT-4o provides the most accurate results.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleTestOpenAI} 
                  className="flex-1"
                  disabled={testingOpenai}
                >
                  {testingOpenai ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection
                    </>
                  ) : openaiSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                
                <Button
                  onClick={() => handleSetActiveProvider("openai")}
                  variant={activeProvider === "openai" ? "default" : "outline"}
                  className="flex-1"
                >
                  {activeProvider === "openai" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Using OpenAI
                    </>
                  ) : (
                    "Use OpenAI"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* DeepSeek Settings */}
        <TabsContent value="deepseek">
          <Card>
            <CardHeader>
              <CardTitle>DeepSeek API Integration</CardTitle>
              <CardDescription>
                Configure your DeepSeek API settings for resume parsing and job profile generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={deepseekApiKey}
                    onChange={(e) => setDeepseekApiKey(e.target.value)}
                    placeholder="Enter your DeepSeek API key"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={toggleShowApiKey}
                    className="ml-2"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={deepseekModel} onValueChange={setDeepseekModel}>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-chat">DeepSeek Chat (Recommended)</SelectItem>
                    <SelectItem value="deepseek-lite">DeepSeek Lite (Faster)</SelectItem>
                    <SelectItem value="deepseek-coder">DeepSeek Coder (Technical tasks)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Different models offer varying levels of accuracy and speed when processing resumes.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleTestDeepseek} 
                  className="flex-1"
                  disabled={testingDeepseek}
                >
                  {testingDeepseek ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection
                    </>
                  ) : deepseekSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                
                <Button
                  onClick={() => handleSetActiveProvider("deepseek")}
                  variant={activeProvider === "deepseek" ? "default" : "outline"}
                  className="flex-1"
                >
                  {activeProvider === "deepseek" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Using DeepSeek
                    </>
                  ) : (
                    "Use DeepSeek"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-xl">Application Settings</CardTitle>
          <CardDescription>
            General settings for the Resume Match AI application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resume Processing Settings</Label>
            <p className="text-sm text-muted-foreground">
              Currently using <span className="font-medium">{activeProvider === 'openai' ? 'OpenAI' : 'DeepSeek'}</span> for resume processing and analysis.
              {!openaiApiKey && !deepseekApiKey && (
                <span className="block mt-1 text-amber-500">No API keys configured. Please add at least one API key above.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
