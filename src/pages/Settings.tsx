
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Check, ArrowLeft, Loader2 } from "lucide-react";
import { testDeepseekConnection } from "@/utils/deepseekApi";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [apiKey, setApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem("deepseek_api_key");
    return savedKey || "";
  });
  
  const [model, setModel] = useState<string>(() => {
    const savedModel = localStorage.getItem("deepseek_model");
    return savedModel || "deepseek-chat";
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const handleTest = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a DeepSeek API key to test connection.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    
    // Save current values before testing
    localStorage.setItem("deepseek_api_key", apiKey);
    localStorage.setItem("deepseek_model", model);
    
    const result = await testDeepseekConnection();
    
    setTesting(false);
    
    if (result.success) {
      toast({
        title: "Connection Successful",
        description: "Successfully connected to DeepSeek API!",
      });
      setSaveStatus("saved");
      // Redirect to home page after successful test
      setTimeout(() => navigate('/'), 1500);
    } else {
      toast({
        title: "Connection Failed",
        description: result.message,
        variant: "destructive",
      });
      setSaveStatus("");
    }
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
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
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
            <Select value={model} onValueChange={setModel}>
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
          
          <Button 
            onClick={handleTest} 
            className="w-full sm:w-auto"
            disabled={testing || saveStatus === "saved"}
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection
              </>
            ) : saveStatus === "saved" ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Connected
              </>
            ) : (
              "Save & Test Connection"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
