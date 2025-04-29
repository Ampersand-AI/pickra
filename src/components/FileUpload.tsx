
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle, Loader2, Upload, File } from "lucide-react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { parseResume } from "@/utils/deepseekApi";

const FileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { state, dispatch } = useResumeMatch();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    []
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

  const handleProcessFiles = async () => {
    if (!state.selectedJobRequirement) {
      toast({
        title: "No Job Selected",
        description: "Please select a job requirement first.",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "No Files",
        description: "Please upload at least one file to process.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await Promise.all(
        files.map(async (file) => {
          const fileId = uuidv4();
          const reader = new FileReader();

          return new Promise<void>((resolve, reject) => {
            reader.onload = async () => {
              const fileContent = reader.result as string;

              // Add the resume to the state with processing status
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
                }
                resolve();
              } catch (error: any) {
                toast({
                  title: "Unexpected Error",
                  description: `An unexpected error occurred while parsing ${file.name}: ${error.message}`,
                  variant: "destructive",
                });
                dispatch({ type: "DELETE_RESUME", payload: fileId });
                reject(error);
              }
            };

            reader.onerror = () => {
              toast({
                title: "File Reading Error",
                description: `Failed to read ${file.name}.`,
                variant: "destructive",
              });
              reject(new Error(`Failed to read ${file.name}`));
            };

            reader.readAsText(file);
          });
        })
      );

      toast({
        title: "Processing Complete",
        description: `Successfully processed ${files.length} files.`,
      });
      
      // Clear the file list after processing
      setFiles([]);
      
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardContent className="flex flex-col space-y-4 pt-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-4 cursor-pointer ${
            isDragActive ? "border-primary" : "border-muted-foreground"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              {isDragActive
                ? "Drop the files here..."
                : "Drag 'n' drop some files here, or click to select files"}
            </p>
            <p className="text-xs text-muted-foreground">
              (Only *.pdf, *.doc, *.docx and *.txt files will be accepted, max size 5MB)
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                  <div className="flex items-center gap-2">
                    <File size={16} />
                    <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => removeFile(index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-2" 
              onClick={handleProcessFiles}
              disabled={isUploading || !state.selectedJobRequirement}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Files with DeepSeek AI"
              )}
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Uploading and parsing resumes with DeepSeek AI...
            </p>
          </div>
        )}

        {!state.selectedJobRequirement && (
          <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 p-2 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Please select a job requirement before uploading CVs.</p>
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
