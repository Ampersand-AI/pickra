import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { parseResume } from "@/utils/deepseekApi";

const FileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { state, dispatch } = useResumeMatch();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!state.selectedJobRequirement) {
        toast({
          title: "No Job Selected",
          description: "Please select a job requirement first.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      Promise.all(
        acceptedFiles.map(async (file) => {
          const fileId = uuidv4();
          const reader = new FileReader();

          reader.onload = async () => {
            const fileContent = reader.result as string;

            // Optimistically add the resume to the state
            dispatch({
              type: "ADD_RESUMES",
              payload: [
                {
                  id: fileId,
                  fileName: file.name,
                  fileSize: file.size,
                  uploadDate: new Date(),
                  processed: false,
                },
              ],
            });

            try {
              const parsedData = await parseResume(
                fileContent,
                state.selectedJobRequirement
              );

              if (parsedData.error) {
                toast({
                  title: "Parsing Error",
                  description: `Failed to parse ${file.name}: ${parsedData.error}`,
                  variant: "destructive",
                });
                dispatch({ type: "DELETE_RESUME", payload: fileId });
              } else {
                dispatch({
                  type: "UPDATE_RESUME",
                  payload: {
                    id: fileId,
                    fileName: file.name,
                    fileSize: file.size,
                    uploadDate: new Date(),
                    processed: true,
                    matchPercentage: parsedData.matchPercentage,
                    matchReason: parsedData.matchReason,
                    extractedData: {
                      name: parsedData.name,
                      email: parsedData.email,
                      phone: parsedData.phone,
                      skills: parsedData.skills,
                      experience: parsedData.experience,
                      education: parsedData.education,
                    },
                  },
                });
                toast({
                  title: "Resume Parsed",
                  description: `${file.name} parsed successfully!`,
                });
              }
            } catch (error: any) {
              toast({
                title: "Unexpected Error",
                description: `An unexpected error occurred while parsing ${file.name}: ${error.message}`,
                variant: "destructive",
              });
              dispatch({ type: "DELETE_RESUME", payload: fileId });
            }
          };

          reader.onerror = () => {
            toast({
              title: "File Reading Error",
              description: `Failed to read ${file.name}.`,
              variant: "destructive",
            });
            dispatch({ type: "DELETE_RESUME", payload: fileId });
          };

          reader.readAsText(file);
        })
      ).finally(() => setIsUploading(false));
    },
    [toast, dispatch, state.selectedJobRequirement]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
      "text/plain": [".txt"],
    },
    maxSize: 5000000, // 5MB
  });

  return (
    <Card>
      <CardContent className="flex flex-col space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-6 cursor-pointer ${
            isDragActive ? "border-primary" : "border-muted-foreground"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-3">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isDragActive
                ? "Drop the files here..."
                : "Drag 'n' drop some files here, or click to select files"}
            </p>
            <p className="text-xs text-muted-foreground">
              (Only *.pdf, *.doc, *.docx and *.txt files will be accepted, max
              size 5MB)
            </p>
          </div>
        </div>
        {isUploading && (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Uploading and parsing resumes...
            </p>
          </div>
        )}
        {state.error && (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{state.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
