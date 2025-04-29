import React, { createContext, useContext, useReducer } from "react";

export type JobRequirement = {
  id: string;
  title: string;
  skills: { name: string; weight: number }[];
  experience: { years: number; weight: number };
  education: { level: string; weight: number };
  description: string;
};

export type Resume = {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  processed: boolean;
  matchPercentage?: number;
  matchReason?: string;
  extractedData?: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: { title: string; company: string; years: number }[];
    education: { degree: string; institution: string; year: number }[];
  };
};

type AppState = {
  jobRequirements: JobRequirement[];
  selectedJobRequirement: JobRequirement | null;
  resumes: Resume[];
  isProcessing: boolean;
  error: string | null;
};

type Action =
  | { type: "ADD_JOB_REQUIREMENT"; payload: JobRequirement }
  | { type: "UPDATE_JOB_REQUIREMENT"; payload: JobRequirement }
  | { type: "DELETE_JOB_REQUIREMENT"; payload: string }
  | { type: "SELECT_JOB_REQUIREMENT"; payload: string }
  | { type: "ADD_RESUMES"; payload: Resume[] }
  | { type: "UPDATE_RESUME"; payload: Resume }
  | { type: "DELETE_RESUME"; payload: string }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

const initialState: AppState = {
  jobRequirements: [],
  selectedJobRequirement: null,
  resumes: [],
  isProcessing: false,
  error: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    
    case "ADD_JOB_REQUIREMENT":
      return {
        ...state,
        jobRequirements: [...state.jobRequirements, action.payload],
      };
    case "UPDATE_JOB_REQUIREMENT":
      return {
        ...state,
        jobRequirements: state.jobRequirements.map((req) =>
          req.id === action.payload.id ? action.payload : req
        ),
        selectedJobRequirement:
          state.selectedJobRequirement?.id === action.payload.id
            ? action.payload
            : state.selectedJobRequirement,
      };
    case "DELETE_JOB_REQUIREMENT":
      return {
        ...state,
        jobRequirements: state.jobRequirements.filter(
          (req) => req.id !== action.payload
        ),
        selectedJobRequirement:
          state.selectedJobRequirement?.id === action.payload
            ? null
            : state.selectedJobRequirement,
      };
    case "SELECT_JOB_REQUIREMENT":
      return {
        ...state,
        selectedJobRequirement:
          state.jobRequirements.find((req) => req.id === action.payload) || null,
      };
    case "ADD_RESUMES":
      return {
        ...state,
        resumes: [...state.resumes, ...action.payload],
      };
    case "UPDATE_RESUME":
      return {
        ...state,
        resumes: state.resumes.map((resume) =>
          resume.id === action.payload.id ? action.payload : resume
        ),
      };
    case "DELETE_RESUME":
      return {
        ...state,
        resumes: state.resumes.filter((resume) => resume.id !== action.payload),
      };
    case "SET_PROCESSING":
      return {
        ...state,
        isProcessing: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

const ResumeMatchContext = createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export function ResumeMatchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ResumeMatchContext.Provider value={{ state, dispatch }}>
      {children}
    </ResumeMatchContext.Provider>
  );
}

export function useResumeMatch() {
  const context = useContext(ResumeMatchContext);
  if (context === undefined) {
    throw new Error("useResumeMatch must be used within a ResumeMatchProvider");
  }
  return context;
}
