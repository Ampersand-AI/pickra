
interface OpenAIResponse {
  data: any;
  error?: string;
}

export const getOpenAIApiKey = (): string | null => {
  return localStorage.getItem("openai_api_key");
};

export const getOpenAIModel = (): string => {
  return localStorage.getItem("openai_model") || "gpt-4o";
};

export const getActiveAIProvider = (): string => {
  return localStorage.getItem("active_ai_provider") || "openai";
};

export const testOpenAIConnection = async (): Promise<{success: boolean, message: string}> => {
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      message: "OpenAI API key not found. Please add your API key."
    };
  }
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: getOpenAIModel(),
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Hello! This is a connection test."
          }
        ],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 
        `API request failed with status ${response.status}`
      );
    }
    
    return {
      success: true,
      message: "Successfully connected to OpenAI API!"
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

export const callOpenAI = async (
  prompt: string,
  systemPrompt: string = "You are a helpful assistant."
): Promise<OpenAIResponse> => {
  const apiKey = getOpenAIApiKey();
  const model = getOpenAIModel();
  
  if (!apiKey) {
    return {
      data: null,
      error: "OpenAI API key not found. Please add your API key in Settings."
    };
  }
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 
        `API request failed with status ${response.status}`
      );
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Resume parsing function
export const parseResume = async (
  fileContent: string,
  jobRequirement: any
): Promise<{
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: { title: string; company: string; years: number }[];
  education: { degree: string; institution: string; year: number }[];
  matchPercentage: number;
  matchReason: string;
  error?: string;
}> => {
  const systemPrompt = `
    You are an expert resume parser. Your task is to extract key information from a resume 
    and match it against job requirements. Please provide your response in JSON format with the following structure:
    {
      "name": "Candidate Name",
      "email": "candidate@email.com",
      "phone": "Phone Number",
      "skills": ["Skill1", "Skill2"],
      "experience": [
        {"title": "Job Title", "company": "Company Name", "years": 2}
      ],
      "education": [
        {"degree": "Degree Name", "institution": "Institution Name", "year": 2020}
      ],
      "matchPercentage": 85,
      "matchReason": "Detailed explanation of the match percentage calculation"
    }
    
    Be extremely accurate with the matchPercentage. It should be calculated based on:
    1. Skills match (50% of weight): How many required skills the candidate has
    2. Experience match (30% of weight): Years and relevance of experience
    3. Education match (20% of weight): Level and relevance of education

    For the matchReason, provide detailed insights into why this score was given,
    highlighting specific strengths and weaknesses.
  `;
  
  // Create a prompt that includes both the resume content and job requirements
  const prompt = `
    Here is the resume content to parse:
    ${fileContent.slice(0, 10000)}... [truncated if longer]
    
    And here are the job requirements to match against:
    Job Title: ${jobRequirement.title}
    Job Description: ${jobRequirement.description}
    Required Skills: ${jobRequirement.skills.map(s => s.name).join(", ")}
    Required Experience: ${jobRequirement.experience.years} years
    Required Education: ${jobRequirement.education.level}
    
    Please parse the resume, extract key information, and calculate a match percentage with detailed reasoning.
  `;
  
  const response = await callOpenAI(prompt, systemPrompt);
  
  if (response.error) {
    return {
      name: "Error parsing resume",
      email: "",
      skills: [],
      experience: [],
      education: [],
      matchPercentage: 0,
      matchReason: response.error,
      error: response.error
    };
  }
  
  try {
    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0]);
      return {
        name: jsonData.name || "Unknown",
        email: jsonData.email || "unknown@example.com",
        phone: jsonData.phone,
        skills: jsonData.skills || [],
        experience: jsonData.experience || [],
        education: jsonData.education || [],
        matchPercentage: jsonData.matchPercentage || 0,
        matchReason: jsonData.matchReason || "No match reason provided"
      };
    }
    
    throw new Error("Could not parse OpenAI response");
  } catch (error) {
    console.error("Error processing OpenAI response:", error);
    return {
      name: "Error parsing resume",
      email: "",
      skills: [],
      experience: [],
      education: [],
      matchPercentage: 0,
      matchReason: "Failed to process resume data",
      error: "Failed to process resume data"
    };
  }
};

// Job profile auto-generation
export const generateJobProfile = async (
  title: string
): Promise<{
  description: string;
  skills: { name: string; weight: number }[];
  experience: { years: number; weight: number };
  education: { level: string; weight: number };
  error?: string;
}> => {
  const systemPrompt = `
    You are an expert HR assistant. Your task is to generate a comprehensive job profile 
    based on a job title. The output should be in JSON format with the following structure:
    {
      "description": "A detailed job description",
      "skills": [{"name": "Skill1", "weight": 8}, {"name": "Skill2", "weight": 5}],
      "experience": {"years": 3, "weight": 7},
      "education": {"level": "Bachelor's", "weight": 6}
    }
    
    Weight should be on a scale of 1-10 representing importance.
    Provide at least 5 relevant skills for the position.
  `;
  
  const response = await callOpenAI(
    `Generate a detailed job profile for the position of: ${title}`,
    systemPrompt
  );
  
  if (response.error) {
    return {
      description: "",
      skills: [],
      experience: { years: 0, weight: 0 },
      education: { level: "Bachelor's", weight: 0 },
      error: response.error
    };
  }
  
  try {
    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0]);
      return {
        description: jsonData.description || "",
        skills: jsonData.skills || [],
        experience: jsonData.experience || { years: 2, weight: 5 },
        education: jsonData.education || { level: "Bachelor's", weight: 5 }
      };
    }
    
    throw new Error("Could not parse OpenAI response");
  } catch (error) {
    console.error("Error processing OpenAI response:", error);
    return {
      description: "",
      skills: [],
      experience: { years: 0, weight: 0 },
      education: { level: "Bachelor's", weight: 0 },
      error: "Failed to process the job profile data"
    };
  }
};
