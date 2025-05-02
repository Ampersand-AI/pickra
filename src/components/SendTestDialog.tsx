import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Resume } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { callOpenRouter } from "@/utils/openaiApi";

interface SendTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: Resume | null;
  jobTitle: string;
  onSendTest: (resumeId: string, testLink: string) => void;
}

export default function SendTestDialog({
  open,
  onOpenChange,
  resume,
  jobTitle,
  onSendTest
}: SendTestDialogProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  
  // Generate a unique test link for this candidate
  const testId = uuidv4().substring(0, 8);
  const testLink = `https://pickra.ai/test/${testId}`;
  
  // Generate a message using OpenAI when the dialog opens
  useEffect(() => {
    if (open && resume) {
      const generateMessage = async () => {
        setGenerating(true);
        try {
          const systemPrompt = `
            You are an AI assistant helping recruiters send personalized test invitations to job candidates.
            Write a professional and friendly email message to a candidate who has been shortlisted for a position.
            The message should:
            1. Be addressed to the candidate by name
            2. Mention the specific job position
            3. Explain that their resume has been shortlisted (mention their match percentage)
            4. Request them to complete an assessment test as the next step
            5. Include the provided test link
            6. Be concise, professional and encouraging
            7. Thank them for their interest
          `;
          
          const prompt = `
            Write a personalized test invitation email for:
            
            Candidate Name: ${resume.extractedData?.name || "Candidate"}
            Candidate Email: ${resume.extractedData?.email || "Unknown"}
            Position: ${jobTitle}
            Match Percentage: ${resume.matchPercentage}%
            Test Link: ${testLink}
          `;
          
          const response = await callOpenRouter(prompt, systemPrompt);
          
          if (response.error) {
            console.error("Error generating message:", response.error);
            // Fall back to default message if OpenAI fails
            setMessage(getDefaultMessage());
          } else {
            const generatedContent = response.data.choices[0].message.content;
            setMessage(generatedContent);
          }
        } catch (error) {
          console.error("Error generating email:", error);
          setMessage(getDefaultMessage());
        } finally {
          setGenerating(false);
        }
      };
      
      generateMessage();
    }
  }, [open, resume, jobTitle, testLink]);
  
  // Fallback message template if API call fails
  const getDefaultMessage = () => {
    return resume ? 
      `Dear ${resume.extractedData?.name || "Candidate"},

We were impressed with your profile for the ${jobTitle} position. As the next step in our evaluation process, we'd like you to complete a brief assessment.

Please click the link below to access your test:
${testLink}

This assessment will help us understand your skills and experience better. The test should take approximately 30 minutes to complete.

Thank you for your interest in our company. We look forward to reviewing your results.

Best regards,
Pickra AI Recruitment Team` : "";
  };
  
  const handleSendTest = async () => {
    if (!resume) return;
    
    setSending(true);
    
    try {
      // In a real app, this would send an actual email
      // For now we'll just simulate the process with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the parent handler to update the resume with test info
      onSendTest(resume.id, testLink);
      
      toast({
        title: "Test invitation sent",
        description: `An assessment invitation has been sent to ${resume.extractedData?.email}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send test",
        description: "There was a problem sending the test invitation. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Assessment Test</DialogTitle>
          <DialogDescription>
            Send an assessment test to the candidate. The email will include a link to the test.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={resume?.extractedData?.name || ""}
              className="col-span-3"
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              value={resume?.extractedData?.email || ""}
              className="col-span-3"
              readOnly
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="message" className="text-right pt-2">
              Message
            </Label>
            <div className="col-span-3">
              {generating ? (
                <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/20 min-h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">Generating message with OpenAI...</p>
                </div>
              ) : (
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[200px]"
                  placeholder="Enter your message to the candidate."
                />
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendTest} 
            disabled={sending || generating || !message} 
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
