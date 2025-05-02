interface OpenRouterResponse {
  data: any;
  error?: string;
}

export const getOpenRouterApiKey = (): string | null => {
  return localStorage.getItem("openrouter_api_key");
};

export const getOpenRouterModel = (): string => {
  return localStorage.getItem("openrouter_model") || "anthropic/claude-3-opus-20240229";
};

export const getActiveAIProvider = (): string => {
  return localStorage.getItem("active_ai_provider") || "openrouter";
};

export const testOpenRouterConnection = async (): Promise<{success: boolean, message: string}> => {
  const apiKey = getOpenRouterApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      message: "OpenRouter API key not found. Please add your API key."
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
        model: getOpenRouterModel(),
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
    return {
      data: null,
      error: "OpenRouter API key not found. Please add your API key in Settings."
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
