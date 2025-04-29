import React, { useState, useCallback } from "react";
import { Upload, FileX, File } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useResumeMatch } from "@/context/ResumeMatchContext";
import { v4 as uuidv4 } from "uuid";

type FileUploadProps = {
  onFilesProcessed: (files: File[]) => void;
};

export default function FileUpload({ onFilesProcessed }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const { toast } = useToast();
  const { dispatch } = useResumeMatch();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files: File[]): File[] => {
    return Array.from(files).filter((file) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdf', 'doc', 'docx'];
      
      if (!validExtensions.includes(fileExtension || '')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid file type. Please upload PDF or Word documents only.`,
          variant: "destructive"
        });
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum file size is 10MB.`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.dataTransfer.files));
      setSelectedFiles(prev => [...prev, ...validFiles]);
      e.dataTransfer.clearData();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(Array.from(e.target.files));
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    dispatch({ type: "SET_PROCESSING", payload: true });
    
    try {
      // Simulate file upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      // In a real app, you would upload files to your server here
      // For this demo, we'll simulate that process
      
      // Convert files to Resume objects
      const newResumes = selectedFiles.map(file => ({
        id: uuidv4(),
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date(),
        processed: false
      }));
      
      // Add the new resumes to our state
      dispatch({ type: "ADD_RESUMES", payload: newResumes });
      
      // Simulate processing completion
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        onFilesProcessed(selectedFiles);
        setUploading(false);
        setSelectedFiles([]);
        setUploadProgress(0);
        dispatch({ type: "SET_PROCESSING", payload: false });
        
        toast({
          title: "Upload complete",
          description: `${newResumes.length} resume(s) uploaded successfully.`,
        });
      }, 2000);
    } catch (error) {
      dispatch({ type: "SET_PROCESSING", payload: false });
      dispatch({ 
        type: "SET_ERROR", 
        payload: "Failed to upload files. Please try again." 
      });
      setUploading(false);
      
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your files.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? "border-white bg-secondary/50" : "border-muted"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-medium">Drag & Drop Resumes</h3>
          <p className="text-sm text-muted-foreground">
            or click to browse (PDF, DOC, DOCX)
          </p>
          
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file-upload"
            className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Select Files
          </label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Selected Files</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-secondary rounded-md p-2">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <FileX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            {uploading && (
              <Progress value={uploadProgress} className="h-2" />
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full md:w-auto"
              >
                {uploading
                  ? `Uploading (${uploadProgress}%)`
                  : `Upload ${selectedFiles.length} File(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
