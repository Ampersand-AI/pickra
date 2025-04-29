
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Check, Trash, BriefcaseIcon, ChevronRight, Search, PlusCircle 
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

const JobRequirementsList = () => {
  const { state, dispatch } = useResumeMatch();
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  const handleSelectJob = (jobId: string) => {
    dispatch({ type: "SELECT_JOB_REQUIREMENT", payload: jobId });
  };

  const handleDeleteJob = () => {
    if (deleteJobId) {
      dispatch({ type: "DELETE_JOB_REQUIREMENT", payload: deleteJobId });
      setDeleteJobId(null);
    }
  };

  if (state.jobRequirements.length === 0) {
    return (
      <Card className="bg-card border border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-6 text-center flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <BriefcaseIcon className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium text-foreground">
            No job requirements added yet
          </p>
          <p className="text-xs text-muted-foreground">
            Create a new job requirement to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border border-border/40 overflow-hidden">
        <CardHeader className="pb-2 px-4 pt-4 space-y-0.5">
          <CardTitle className="text-md flex items-center gap-2">
            <BriefcaseIcon size={16} className="text-primary" />
            Job Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {state.jobRequirements.map((job) => (
            <div 
              key={job.id}
              onClick={() => handleSelectJob(job.id)}
              className={cn(
                "px-3 py-2 rounded-md transition-all cursor-pointer",
                "flex items-center justify-between gap-2",
                state.selectedJobRequirement?.id === job.id 
                  ? "bg-primary/10 border-primary shadow-sm" 
                  : "hover:bg-muted/50"
              )}
            >
              <div className="truncate flex-1">
                <div className="flex items-center">
                  <p className="font-medium text-sm">
                    {job.title}
                  </p>
                  {state.selectedJobRequirement?.id === job.id && (
                    <Check size={14} className="ml-1 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                  {job.skills.map(s => s.name).join(" • ")}
                </p>
              </div>
              
              <div className="flex items-center">
                {state.selectedJobRequirement?.id !== job.id && (
                  <ChevronRight size={16} className="text-muted-foreground/50" />
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteJobId(job.id);
                  }}
                >
                  <Trash size={14} className="text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          
          {state.jobRequirements.length > 0 && !state.selectedJobRequirement && (
            <div className="p-3 bg-amber-50 text-amber-600 rounded-md text-xs flex items-center gap-2 mt-2">
              <Search size={14} />
              <span>Select a job requirement to upload resumes</span>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job requirement and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteJob}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default JobRequirementsList;
