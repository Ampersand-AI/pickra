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
import { testOpenRouterConnection, resetOpenRouterModel } from "@/utils/openRouterApi";
import { useNavigate } from "react-router-dom";

interface OpenRouterModel {
  id: string;
  name: string;
  isFree: boolean;
}

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
  
  // OpenRouter settings
  const [openrouterApiKey, setOpenrouterApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem("openrouter_api_key");
    return savedKey || "";
  });
  
  const [openrouterModel, setOpenrouterModel] = useState<string>(() => {
    // Force using Mistral model
    resetOpenRouterModel();
    return "mistralai/mistral-7b-instruct";
  });
  
  const [activeProvider, setActiveProvider] = useState<string>(() => {
    const savedProvider = localStorage.getItem("active_ai_provider");
    return savedProvider || "openrouter";
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testingDeepseek, setTestingDeepseek] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [deepseekSaved, setDeepseekSaved] = useState(false);
  const [openrouterSaved, setOpenrouterSaved] = useState(false);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
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

  const handleTestOpenRouter = async () => {
    if (!openrouterApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an OpenRouter API key to test connection.",
        variant: "destructive",
      });
      return;
    }

    setTestingOpenRouter(true);
    
    // Save current values before testing
    localStorage.setItem("openrouter_api_key", openrouterApiKey);
    // Force using Mistral model
    resetOpenRouterModel();
    localStorage.setItem("openrouter_model", "mistralai/mistral-7b-instruct");
    
    const result = await testOpenRouterConnection();
    
    setTestingOpenRouter(false);
    
    if (result.success) {
      toast({
        title: "Connection Successful",
        description: "Successfully connected to OpenRouter API!",
      });
      setOpenrouterSaved(true);
      if (activeProvider === "openrouter") {
        setTimeout(() => navigate('/'), 1500);
      }
    } else {
      toast({
        title: "Connection Failed",
        description: result.message,
        variant: "destructive",
      });
      setOpenrouterSaved(false);
    }
  };

  const handleSetActiveProvider = (provider: string) => {
    localStorage.setItem("active_ai_provider", provider);
    setActiveProvider(provider);
    toast({
      title: `${provider === 'openrouter' ? 'OpenRouter' : 'DeepSeek'} Selected`,
      description: `Now using ${provider === 'openrouter' ? 'OpenRouter' : 'DeepSeek'} for resume processing.`,
    });
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const fetchAvailableModels = async () => {
    if (!openrouterApiKey) return;
    
    setLoadingModels(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Pickra AI"
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      
      const data = await response.json();
      // Sort models to show free ones first
      const models = data.data
        .sort((a: any, b: any) => {
          // Put free models first
          if (a.pricing?.input === 0 && b.pricing?.input !== 0) return -1;
          if (a.pricing?.input !== 0 && b.pricing?.input === 0) return 1;
          return 0;
        })
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          isFree: m.pricing?.input === 0
        }));
      
      setAvailableModels(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available models",
        variant: "destructive"
      });
    } finally {
      setLoadingModels(false);
    }
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
          <TabsTrigger value="openrouter" onClick={() => setActiveProvider('openrouter')}>OpenRouter</TabsTrigger>
          <TabsTrigger value="deepseek" onClick={() => setActiveProvider('deepseek')}>DeepSeek</TabsTrigger>
        </TabsList>
        
        {/* OpenRouter Settings */}
        <TabsContent value="openrouter">
          <Card>
            <CardHeader>
              <CardTitle>OpenRouter API Integration</CardTitle>
              <CardDescription>
                Configure your OpenRouter API settings for resume parsing and job profile generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openrouter-api-key">API Key</Label>
                <div className="flex">
                  <Input
                    id="openrouter-api-key"
                    type={showApiKey ? "text" : "password"}
                    value={openrouterApiKey}
                    onChange={(e) => {
                      setOpenrouterApiKey(e.target.value);
                      if (e.target.value) {
                        fetchAvailableModels();
                      }
                    }}
                    placeholder="Enter your OpenRouter API key"
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
                <Label htmlFor="openrouter-model">Model</Label>
                <Select
                  value={openrouterModel}
                  onValueChange={setOpenrouterModel}
                  disabled={loadingModels}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingModels ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Loading models...</span>
                      </div>
                    ) : availableModels.length > 0 ? (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold">Free Models</div>
                        {availableModels
                          .filter(model => model.isFree)
                          .map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name} (Free)
                            </SelectItem>
                          ))}
                        <div className="px-2 py-1.5 text-sm font-semibold mt-2">Paid Models</div>
                        {availableModels
                          .filter(model => !model.isFree)
                          .map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                      </>
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Enter API key to see available models
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the AI model to use for processing. Different models may have different capabilities and pricing.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleTestOpenRouter} 
                  className="flex-1"
                  disabled={testingOpenRouter}
                >
                  {testingOpenRouter ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection
                    </>
                  ) : openrouterSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                
                <Button
                  onClick={() => handleSetActiveProvider("openrouter")}
                  variant={activeProvider === "openrouter" ? "default" : "outline"}
                  className="flex-1"
                >
                  {activeProvider === "openrouter" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Using OpenRouter
                    </>
                  ) : (
                    "Use OpenRouter"
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
            General settings for the Pickra AI application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resume Processing Settings</Label>
            <p className="text-sm text-muted-foreground">
              Currently using <span className="font-medium">{activeProvider === 'openrouter' ? 'OpenRouter' : 'DeepSeek'}</span> for resume processing and analysis.
              {!openrouterApiKey && !deepseekApiKey && (
                <span className="block mt-1 text-amber-500">No API keys configured. Please add at least one API key above.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
