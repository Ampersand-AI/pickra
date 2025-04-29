
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Trash } from "lucide-react";
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
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No job requirements added yet. Create a new job requirement to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Saved Job Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {state.jobRequirements.map((job) => (
            <div 
              key={job.id}
              className={`flex items-center justify-between p-3 rounded-md border ${
                state.selectedJobRequirement?.id === job.id 
                  ? "bg-primary/10 border-primary" 
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              <div className="truncate flex-1 cursor-pointer" onClick={() => handleSelectJob(job.id)}>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground truncate">{job.skills.map(s => s.name).join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                {state.selectedJobRequirement?.id === job.id && (
                  <Check size={16} className="text-primary" />
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setDeleteJobId(job.id)}
                >
                  <Trash size={14} className="text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))}
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
            <AlertDialogAction variant="destructive" onClick={handleDeleteJob}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default JobRequirementsList;
