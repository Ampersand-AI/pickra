import { useState, useEffect, useMemo, useCallback, useRef } from "react";

interface OpenRouterResponse {
  data: any;
  error?: string;
}

interface JobRequirements {
  title: string;
  description: string;
  skills: { name: string; weight: number }[];
  experience: { years: number };
  education: { level: string };
}

interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: { title: string; company: string; years: number }[];
  education: { degree: string; institution: string; year: string }[];
  matchPercentage: number;
  matchReason: string;
}

// Add request tracking
const pendingRequests = new Map<string, Promise<OpenRouterResponse>>();
const requestTimeouts = new Map<string, NodeJS.Timeout>();

export const getOpenRouterApiKey = (): string | null => {
  return localStorage.getItem("openrouter_api_key");
};

export const getOpenRouterModel = (): string => {
  return localStorage.getItem("openrouter_model") || "anthropic/claude-3-opus-20240229";
};

export const getActiveAIProvider = (): string => {
  return localStorage.getItem("active_ai_provider") || "openrouter";
};

// Add request deduplication
const getRequestKey = (prompt: string, systemPrompt: string): string => {
  return `${prompt}-${systemPrompt}`;
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
  const requestKey = getRequestKey(prompt, systemPrompt);
  
  if (!apiKey) {
    return {
      data: null,
      error: "OpenRouter API key not found. Please add your API key in Settings."
    };
  }

  // Check if there's a pending request for the same prompt
  if (pendingRequests.has(requestKey)) {
    console.log('[OpenRouter] Reusing existing request for:', requestKey);
    return pendingRequests.get(requestKey)!;
  }

  // Clear any existing timeout
  if (requestTimeouts.has(requestKey)) {
    clearTimeout(requestTimeouts.get(requestKey)!);
    requestTimeouts.delete(requestKey);
  }
  
  try {
    console.log('[OpenRouter] Making new API call with model:', model);
    console.log('[OpenRouter] Request key:', requestKey);
    
    // Create the request promise
    const requestPromise = (async () => {
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
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[OpenRouter] API error response:', errorData);
        throw new Error(
          errorData.error?.message || 
          `API request failed with status ${response.status}`
        );
      }
      
      const data = await response.json();
      console.log('[OpenRouter] API success response:', data);
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from OpenRouter API");
      }
      
      return { data };
    })();

    // Store the request promise
    pendingRequests.set(requestKey, requestPromise);

    // Set a timeout to clean up the request
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestKey);
      requestTimeouts.delete(requestKey);
    }, 30000); // 30 seconds timeout

    requestTimeouts.set(requestKey, timeout);

    // Wait for the request to complete
    const result = await requestPromise;

    // Clean up
    pendingRequests.delete(requestKey);
    requestTimeouts.delete(requestKey);

    return result;
  } catch (error) {
    // Clean up on error
    pendingRequests.delete(requestKey);
    requestTimeouts.delete(requestKey);
    
    console.error("[OpenRouter] API error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Resume parsing function with request tracking
export const parseResume = async (
  resumeText: string,
  jobRequirements: JobRequirements
): Promise<ResumeData> => {
  const requestId = `parse-${resumeText.substring(0, 50)}-${jobRequirements.title}`;
  console.log('[ParseResume] Starting parse request:', requestId);

  try {
    console.log('[ParseResume] Job Requirements:', JSON.stringify(jobRequirements, null, 2));

    const systemPrompt = `You are an expert resume parser and job matching system. Your task is to analyze the provided resume and match it against the given job requirements. Follow these rules strictly:

1. Extract ONLY the information that is explicitly present in the resume text. Do not make assumptions or add placeholder text.
2. If information is not found in the resume, use "Not provided" instead of making assumptions.
3. For skills, only list skills that are explicitly mentioned in the resume.
4. For experience, only include roles and companies that are explicitly stated.
5. For education, only include degrees and institutions that are explicitly mentioned.
6. Calculate match percentage based on actual requirements vs. provided information.
7. Provide specific reasons for the match percentage based on actual resume content.
8. IMPORTANT: Do not use any JavaScript code or functions in the response. All values must be static.
9. For years of experience, use a simple number (e.g., 2, 3, 5) instead of calculations.
10. ALWAYS include name and email fields, even if not found in the resume (use "Not provided").

Return the data in this EXACT JSON format, with no comments or additional text:
{
  "name": "string or 'Not provided'",
  "email": "string or 'Not provided'",
  "phone": "string or 'Not provided'",
  "skills": ["string"],
  "experience": [
    {
      "title": "string or 'Not provided'",
      "company": "string or 'Not provided'",
      "years": number
    }
  ],
  "education": [
    {
      "degree": "string or 'Not provided'",
      "institution": "string or 'Not provided'",
      "year": "string or 'Not provided'"
    }
  ],
  "matchPercentage": number,
  "matchReason": "string"
}`;

    const userPrompt = `Resume Text:
${resumeText}

Job Requirements:
${JSON.stringify(jobRequirements, null, 2)}

Please analyze this resume and provide the required information in the specified JSON format.`;

    console.log('[ParseResume] Making API call for request:', requestId);
    const response = await callOpenRouter(systemPrompt, userPrompt);
    
    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from API");
    }

    const content = response.data.choices[0].message.content;
    console.log('[ParseResume] API Response Content for request:', requestId);

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in API response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log('[ParseResume] Parsed Resume Data for request:', requestId);

    // Validate required fields
    if (!parsedData.name || !parsedData.email) {
      throw new Error("Missing required fields in parsed data");
    }

    return {
      name: parsedData.name,
      email: parsedData.email,
      phone: parsedData.phone || "Not provided",
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      matchPercentage: parsedData.matchPercentage || 0,
      matchReason: parsedData.matchReason || "No match reason provided"
    };
  } catch (error) {
    
    throw error;
  }
};
