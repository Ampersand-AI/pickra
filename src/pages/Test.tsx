
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck2, CheckCircle, Timer } from "lucide-react";

const Test = () => {
  const { testId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [testData, setTestData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Mock data for the test
  useEffect(() => {
    // Simulate API call to fetch test data
    setTimeout(() => {
      setTestData({
        id: testId,
        title: "Frontend Developer Skills Assessment",
        description: "This test evaluates your skills in JavaScript, React, and CSS.",
        duration: 30, // minutes
        questions: [
          {
            id: 1,
            text: "What is the output of console.log(1 + '2' + '2');?",
            options: ["122", "14", "1 + '2' + '2'", "Error"],
            correctAnswer: "122"
          },
          {
            id: 2,
            text: "Which hook should be used for side effects in React?",
            options: ["useState", "useEffect", "useContext", "useReducer"],
            correctAnswer: "useEffect"
          },
          {
            id: 3,
            text: "What does CSS stand for?",
            options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
            correctAnswer: "Cascading Style Sheets"
          }
        ]
      });
      setIsLoading(false);
    }, 1500);
  }, [testId]);
  
  // Timer effect
  useEffect(() => {
    if (!isLoading && testData) {
      const timer = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isLoading, testData]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <FileCheck2 className="h-8 w-8 text-primary animate-pulse" />
            <h2 className="text-xl font-medium">Loading Test...</h2>
            <p className="text-muted-foreground">Please wait while we prepare your assessment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pt-8 pb-16">
      <div className="container max-w-4xl">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Pickra AI Assessment</h1>
          </div>
          
          <div className="bg-card border border-border/40 rounded-full px-4 py-1.5 flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <span className="font-semibold">{formatTime(currentTime)}</span>
          </div>
        </header>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{testData.title}</CardTitle>
            <CardDescription>{testData.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This assessment contains {testData.questions.length} questions and has a suggested time limit of {testData.duration} minutes.
              Your answers will be automatically saved as you progress.
            </p>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          {testData.questions.map((question: any, index: number) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                <CardDescription className="text-base font-medium text-foreground">
                  {question.text}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.options.map((option: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
                    >
                      <div className="h-5 w-5 rounded-full border border-border flex items-center justify-center">
                        {/* Empty circle to be filled when selected */}
                      </div>
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 flex justify-end">
          <Button size="lg" className="gap-2">
            <CheckCircle className="h-5 w-5" />
            Submit Test
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Test;
