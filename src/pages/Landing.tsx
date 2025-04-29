
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileCheck2, BriefcaseIcon, BadgeCheck, Sparkles, LineChart, CheckCircle } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <header className="container py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Resume Match AI</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            className="gap-1"
          >
            Settings
          </Button>
        </div>
      </header>

      <section className="container py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              <span>AI-Powered Resume Matching</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Find the perfect candidates for your job openings
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload resumes and job requirements to automatically evaluate candidate matches with advanced AI analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/app')} className="gap-2">
                <BriefcaseIcon className="h-5 w-5" />
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/settings')}>
                Configure AI Settings
              </Button>
            </div>
          </div>
          
          <div className="hidden md:flex justify-end">
            <div className="relative">
              <div className="absolute -left-12 -top-12 w-40 h-40 bg-primary/10 rounded-full filter blur-3xl opacity-70"></div>
              <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-primary/20 rounded-full filter blur-3xl opacity-70"></div>
              <div className="bg-card border border-border/40 shadow-xl rounded-xl p-6 relative glass-morphism w-[450px] z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Match Analysis</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Skill Matches</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Experience Level</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Education</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Key Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform analyzes resumes against job requirements to find your ideal candidates.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                <BadgeCheck className="text-primary h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg mb-2">Smart Skills Matching</h3>
              <p className="text-muted-foreground">
                Our AI analyzes candidate skills and matches them with job requirements to find the best talent.
              </p>
            </div>
            
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                <BriefcaseIcon className="text-primary h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg mb-2">Job Requirement Analysis</h3>
              <p className="text-muted-foreground">
                Define detailed job requirements or let our AI help generate them for accurate candidate matching.
              </p>
            </div>
            
            <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                <FileCheck2 className="text-primary h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg mb-2">PDF Resume Parsing</h3>
              <p className="text-muted-foreground">
                Upload multiple resumes in various formats, and our system will extract and analyze the relevant information.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find your perfect match?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start matching your job requirements with candidate resumes using our AI-powered platform.
          </p>
          <Button size="lg" onClick={() => navigate('/app')} className="gap-2">
            <CheckCircle className="h-5 w-5" />
            Get Started Now
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="container text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Resume Match AI</h3>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Resume Match AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
