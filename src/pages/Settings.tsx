
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Check } from "lucide-react";

export default function Settings() {
  const [apiKey, setApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    return savedKey || "";
  });
  
  const [model, setModel] = useState<string>(() => {
    const savedModel = localStorage.getItem("openai_model");
    return savedModel || "gpt-4o";
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem("openai_api_key", apiKey);
      localStorage.setItem("openai_model", model);
      setSaveStatus("saved");
      
      toast({
        title: "Settings saved",
        description: "Your API key and model preferences have been saved.",
      });
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus(""), 3000);
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter an OpenAI API key to save settings.",
        variant: "destructive",
      });
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="container py-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>OpenAI Integration</CardTitle>
          <CardDescription>
            Configure your OpenAI API settings for resume parsing and job profile generation.
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
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                <SelectItem value="gpt-4.5-preview">GPT-4.5 Preview (Most powerful)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Different models offer varying levels of accuracy and speed when processing resumes.
            </p>
          </div>
          
          <Button onClick={handleSave} className="w-full sm:w-auto">
            {saveStatus === "saved" ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
