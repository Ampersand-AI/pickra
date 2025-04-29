
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle, Loader2, File, X } from "lucide-react";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromPDF } from "@/utils/pdfParser";
import { parseResume } from "@/utils/openaiApi";

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
          
          // Add the resume to the state with processing status first
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
            // Get file content as text or base64
            const fileContent = await readFileContent(file);
            
            // Always use OpenAI for parsing
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
          } catch (error: any) {
            console.error("Error processing file:", error);
            toast({
              title: "Unexpected Error",
              description: `An unexpected error occurred while parsing ${file.name}: ${error.message}`,
              variant: "destructive",
            });
            dispatch({ type: "DELETE_RESUME", payload: fileId });
          }
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
  
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const content = reader.result as string;
          if (file.type === "application/pdf") {
            // For PDF files, extract text using PDF.js
            const extractedText = await extractTextFromPDF(content);
            resolve(extractedText);
          } else {
            // For other file types, use the raw text
            resolve(content);
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read ${file.name}`));
      };
      
      if (file.type === "application/pdf") {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-lg border border-border/40 bg-card">
      <CardContent className="flex flex-col space-y-4 pt-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-5 cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <div className={`p-3 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-muted/50'}`}>
              <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <p className="text-sm font-medium text-center">
              {isDragActive
                ? "Drop the files here..."
                : "Drag & drop resumes here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              PDF, DOC, DOCX and TXT files supported (Max 5MB)
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFiles([])}
                className="h-8 text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-border/40 rounded-md border border-border/40 bg-muted/20">
              {files.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-2 px-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-muted/50 p-1 rounded">
                      <FileText size={14} className="text-muted-foreground" />
                    </div>
                    <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
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
                <>Process Resumes with OpenAI</>
              )}
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center justify-center space-x-2 py-2 bg-muted/30 rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">
              Uploading and parsing resumes with OpenAI...
            </p>
          </div>
        )}

        {!state.selectedJobRequirement && (
          <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 p-3 rounded-md border border-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Please select a job requirement before uploading resumes.</p>
          </div>
        )}
        
        {state.error && (
          <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{state.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
