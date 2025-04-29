
interface DeepseekResponse {
  data: any;
  error?: string;
}

export const getDeepseekApiKey = (): string | null => {
  return localStorage.getItem("deepseek_api_key");
};

export const getDeepseekModel = (): string => {
  return localStorage.getItem("deepseek_model") || "deepseek-chat";
};

export const testDeepseekConnection = async (): Promise<{success: boolean, message: string}> => {
  const apiKey = getDeepseekApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      message: "DeepSeek API key not found. Please add your API key."
    };
  }
  
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: getDeepseekModel(),
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
      message: "Successfully connected to DeepSeek API!"
    };
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

export const callDeepseek = async (
  prompt: string,
  systemPrompt: string = "You are a helpful assistant."
): Promise<DeepseekResponse> => {
  const apiKey = getDeepseekApiKey();
  const model = getDeepseekModel();
  
  if (!apiKey) {
    return {
      data: null,
      error: "DeepSeek API key not found. Please add your API key in Settings."
    };
  }
  
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
    console.error("DeepSeek API error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred"
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
  
  const response = await callDeepseek(
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
    
    throw new Error("Could not parse DeepSeek response");
  } catch (error) {
    console.error("Error processing DeepSeek response:", error);
    return {
      description: "",
      skills: [],
      experience: { years: 0, weight: 0 },
      education: { level: "Bachelor's", weight: 0 },
      error: "Failed to process the job profile data"
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
    
    The matchPercentage should be calculated based on how well the resume matches the job requirements.
  `;
  
  // Create a prompt that includes both the resume content and job requirements
  const prompt = `
    Here is the resume content to parse:
    ${fileContent.slice(0, 3000)}... [truncated if longer]
    
    And here are the job requirements to match against:
    Job Title: ${jobRequirement.title}
    Job Description: ${jobRequirement.description}
    Required Skills: ${jobRequirement.skills.map(s => s.name).join(", ")}
    Required Experience: ${jobRequirement.experience.years} years
    Required Education: ${jobRequirement.education.level}
    
    Please parse the resume, extract key information, and calculate a match percentage with detailed reasoning.
  `;
  
  const response = await callDeepseek(prompt, systemPrompt);
  
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
    
    throw new Error("Could not parse DeepSeek response");
  } catch (error) {
    console.error("Error processing DeepSeek response:", error);
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
