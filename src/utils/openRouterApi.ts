interface OpenRouterResponse {
  data: any;
  error?: string;
}

export const getOpenRouterApiKey = (): string | null => {
  return localStorage.getItem("openrouter_api_key");
};

export const getOpenRouterModel = (): string => {
  // Force using Mistral model
  const model = "mistralai/mistral-7b-instruct";
  localStorage.setItem("openrouter_model", model);
  return model;
};

export const getActiveAIProvider = (): string => {
  return localStorage.getItem("active_ai_provider") || "openrouter";
};

// Add model validation
export const validateOpenRouterModel = async (model: string): Promise<boolean> => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${getOpenRouterApiKey()}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Pickra AI"
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const availableModels = data.data.map((m: any) => m.id);
    return availableModels.includes(model);
  } catch (error) {
    console.error("Error validating model:", error);
    return false;
  }
};

// Update testOpenRouterConnection to validate model
export const testOpenRouterConnection = async (): Promise<{success: boolean, message: string}> => {
  const apiKey = getOpenRouterApiKey();
  const model = getOpenRouterModel();
  
  if (!apiKey) {
    return {
      success: false,
      message: "OpenRouter API key not found. Please add your API key."
    };
  }

  // Validate model first
  const isModelValid = await validateOpenRouterModel(model);
  if (!isModelValid) {
    return {
      success: false,
      message: `Model ${model} is not available. Please select a different model.`
    };
  }
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Pickra AI"
      },
      body: JSON.stringify({
        model: model,
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
      message: "Successfully connected to OpenRouter API!"
    };
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

export const callOpenRouter = async (
  prompt: string,
  systemPrompt: string = "You are a helpful assistant."
): Promise<OpenRouterResponse> => {
  const apiKey = getOpenRouterApiKey();
  const model = getOpenRouterModel();
  
  if (!apiKey) {
    console.error("No API key found");
    return {
      data: null,
      error: "OpenRouter API key not found. Please add your API key in Settings."
    };
  }
  
  try {
    console.log("Making API call with model:", model);
    console.log("System prompt:", systemPrompt);
    console.log("User prompt:", prompt);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Pickra AI"
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
      console.error("API Error Response:", errorData);
      throw new Error(
        errorData.error?.message || 
        `API request failed with status ${response.status}`
      );
    }
    
    const data = await response.json();
    console.log("API Response Data:", data);

    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices)) {
      console.error("Invalid API response structure:", data);
      return {
        data: null,
        error: "Invalid API response structure: missing choices array"
      };
    }

    return { data };
  } catch (error) {
    console.error("OpenRouter API error:", error);
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
  const systemPrompt = `You are an AI assistant specialized in resume parsing and job matching. 
  Analyze the provided resume and job requirements to extract relevant information and calculate a match percentage.
  Return the data in a structured format.`;

  try {
    const response = await callOpenRouter(
      `Resume Content: ${fileContent}\n\nJob Requirements: ${JSON.stringify(jobRequirement)}`,
      systemPrompt
    );

    if (response.error) {
      return {
        name: "",
        email: "",
        skills: [],
        experience: [],
        education: [],
        matchPercentage: 0,
        matchReason: "",
        error: response.error
      };
    }

    // Parse the response data
    const parsedData = response.data.choices[0].message.content;
    const result = JSON.parse(parsedData);

    return {
      name: result.name || "",
      email: result.email || "",
      phone: result.phone,
      skills: result.skills || [],
      experience: result.experience || [],
      education: result.education || [],
      matchPercentage: result.matchPercentage || 0,
      matchReason: result.matchReason || "",
      error: result.error
    };
  } catch (error) {
    console.error("Resume parsing error:", error);
    return {
      name: "",
      email: "",
      skills: [],
      experience: [],
      education: [],
      matchPercentage: 0,
      matchReason: "",
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Add this new function before the last export
export const generateJobProfile = async (jobTitle: string): Promise<{
  description: string;
  skills: Array<{ name: string; weight: number }>;
  experience: { years: number; weight: number };
  education: { level: string; weight: number };
  error?: string;
}> => {
  const systemPrompt = `You are an AI assistant specialized in job profile generation.
  Generate a detailed job profile based on the provided job title.
  Return ONLY a JSON object with the following fields and structure (do NOT wrap in any other object, such as job_profile):
  {
    "job_title": "string",
    "description": "string",
    "skills": [ { "name": "string", "weight": number }, ... ],
    "experience": "string",
    "education": "string"
  }
  Do not include any extra fields. Return ONLY the JSON object above.`;

  try {
    const response = await callOpenRouter(
      `Generate a job profile for: ${jobTitle}`,
      systemPrompt
    );

    if (response.error || !response.data) {
      console.error("API Error or No Data:", response.error);
      return {
        description: "",
        skills: [],
        experience: { years: 0, weight: 5 },
        education: { level: "Bachelor's", weight: 5 },
        error: response.error || "Failed to generate job profile"
      };
    }

    // Log the full response for debugging
    console.log("Full API Response:", response.data);

    // Check if the response has the expected structure
    if (!response.data.choices) {
      console.error("No choices in response:", response.data);
      return {
        description: "",
        skills: [],
        experience: { years: 0, weight: 5 },
        education: { level: "Bachelor's", weight: 5 },
        error: "API response missing choices array"
      };
    }

    if (!response.data.choices[0]) {
      console.error("Empty choices array:", response.data.choices);
      return {
        description: "",
        skills: [],
        experience: { years: 0, weight: 5 },
        education: { level: "Bachelor's", weight: 5 },
        error: "API response has empty choices array"
      };
    }

    if (!response.data.choices[0].message) {
      console.error("No message in choice:", response.data.choices[0]);
      return {
        description: "",
        skills: [],
        experience: { years: 0, weight: 5 },
        education: { level: "Bachelor's", weight: 5 },
        error: "API response missing message object"
      };
    }

    if (!response.data.choices[0].message.content) {
      console.error("No content in message:", response.data.choices[0].message);
      return {
        description: "",
        skills: [],
        experience: { years: 0, weight: 5 },
        education: { level: "Bachelor's", weight: 5 },
        error: "API response missing content in message"
      };
    }

    // Parse the response data
    console.log("Response Data:", response.data);
    const parsedData = response.data.choices[0].message.content;
    console.log("Parsed Data:", parsedData);

    let result;
    try {
      result = JSON.parse(parsedData);
      console.log("Parsed Result:", result);
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError);
      console.error("Raw content that failed to parse:", parsedData);
      return {
        description: "",
        skills: [],
        experience: { years: 0, weight: 5 },
        education: { level: "Bachelor's", weight: 5 },
        error: "Failed to parse API response as JSON"
      };
    }

    // Handle the job_profile wrapper if it exists
    const profile = result.job_profile || result;

    // Validate the parsed result has required fields
    if (!profile.description || !profile.skills || !profile.experience || !profile.education) {
      console.error("Missing required fields in parsed result:", profile);
      return {
        description: "",
        skills: [],
        experience: { years: 0, weight: 5 },
        education: { level: "Bachelor's", weight: 5 },
        error: "API response missing required fields"
      };
    }

    // Convert experience string to years number
    const experienceYears = parseInt(profile.experience.split('-')[0]) || 2;

    return {
      description: profile.description || "",
      skills: profile.skills.map((skill: any) => ({
        name: skill.name,
        weight: skill.importance || 5
      })) || [],
      experience: { 
        years: experienceYears,
        weight: 5
      },
      education: { 
        level: profile.education,
        weight: 5
      },
      error: profile.error
    };
  } catch (error) {
    console.error("Job profile generation error:", error);
    return {
      description: "",
      skills: [],
      experience: { years: 0, weight: 5 },
      education: { level: "Bachelor's", weight: 5 },
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Add this function to reset the model
export const resetOpenRouterModel = () => {
  localStorage.removeItem("openrouter_model");
}; 