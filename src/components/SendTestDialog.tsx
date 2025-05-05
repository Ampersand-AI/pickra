import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const hasInitialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Generate a unique test link for this candidate using useMemo
  const { testId, testLink } = useMemo(() => {
    const id = uuidv4().substring(0, 8);
    return {
      testId: id,
      testLink: `https://pickra.ai/test/${id}`
    };
  }, []); // Empty dependency array means this only runs once when component mounts

  // Generate default message using useCallback to prevent recreation
  const generateDefaultMessage = useCallback(async () => {
    if (!resume) return "";
    
    try {
      setGenerating(true);
      
      const systemPrompt = `You are an expert at writing professional test invitation emails. Write a personalized test invitation email that is concise, professional, and includes all the necessary information.`;
      
      const userPrompt = `Write a personalized test invitation email for:
            
Candidate Name: ${resume.extractedData?.name || "Candidate"}
Candidate Email: ${resume.extractedData?.email || "Not provided"}
Position: ${jobTitle}
Match Percentage: ${resume.matchPercentage}%
Test Link: ${testLink}

The email should:
1. Be professional and concise
2. Include the candidate's name
3. Mention the position they applied for
4. Include their match percentage
5. Include the test link
6. Have a clear call to action
7. Include a professional signature`;

      const response = await callOpenRouter(systemPrompt, userPrompt);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from API");
      }

      const generatedMessage = response.data.choices[0].message.content;
      setMessage(generatedMessage); // Update message state directly here
      return generatedMessage;
    } catch (error) {
      console.error("Error generating message:", error);
      // Return a fallback message if generation fails
      const fallbackMessage = `Dear ${resume.extractedData?.name || "Candidate"},

We were impressed with your profile for the ${jobTitle} position. As the next step in our evaluation process, we'd like you to complete a brief assessment.

Please click the link below to access your test:
${testLink}

This assessment will help us understand your skills and experience better. The test should take approximately 30 minutes to complete.

Thank you for your interest in our company. We look forward to reviewing your results.

Best regards,
${resume.extractedData?.name || "Recruiter"}
${resume.extractedData?.email || "recruiter@company.com"}
${resume.extractedData?.phone || "+1 (555) 123-4567"}`;

      setMessage(fallbackMessage); // Update message state with fallback
      return fallbackMessage;
    } finally {
      setGenerating(false);
    }
  }, [resume, jobTitle, testLink]);

  // Update message when dialog opens
  useEffect(() => {
    let isMounted = true;

    const initializeMessage = async () => {
      if (open && resume && !hasInitialized.current) {
        try {
          await generateDefaultMessage();
          if (isMounted) {
            hasInitialized.current = true;
          }
        } catch (error) {
          console.error("Error initializing message:", error);
        }
      }
    };

    initializeMessage();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [open, resume, generateDefaultMessage]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMessage("");
      setSending(false);
      setGenerating(false);
      hasInitialized.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [open]);
  
  const handleSendTest = async () => {
    if (!resume) return;
    
    setSending(true);
    
    try {
      // Prepare email data
      const emailData = {
        to: resume.extractedData?.email,
        subject: `Assessment Test Invitation - ${jobTitle} Position`,
        text: message,
        html: message.replace(/\n/g, '<br>'),
        cc: import.meta.env.VITE_RECRUITER_EMAIL
      };

      // Send email using the API
      console.log('Sending email request to:', 'http://localhost:4000/api/email/send-email');
      console.log('Email data:', emailData);
      
      const response = await fetch('http://localhost:4000/api/email/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      }).catch(error => {
        console.error('Network error:', error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          throw new Error('Unable to connect to the server. Please make sure the backend server is running on port 4000.');
        }
        throw error;
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 404) {
          throw new Error('Email sending endpoint not found. Please make sure the backend server is properly configured.');
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        throw new Error('Invalid server response format');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      // Call the parent handler to update the resume with test info
      onSendTest(resume.id, testLink);
      
      toast({
        title: "Test invitation sent",
        description: `An assessment invitation has been sent to ${resume.extractedData?.email}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending test:", error);
      
      toast({
        variant: "destructive",
        title: "Failed to send test",
        description: error instanceof Error ? error.message : "Failed to send test invitation. Please make sure the backend server is running.",
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
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder={generating ? "Generating message..." : "Enter your message to the candidate."}
                disabled={generating}
              />
              {generating && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating message...
                </div>
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
