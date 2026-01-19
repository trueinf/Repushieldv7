import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

interface ClarifyRequest {
  topic: string;
  documentContext?: string;
  model?: string;
}

serve(async (req) => {
  try {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const requestData: ClarifyRequest = await req.json();
    const { topic, documentContext = "", model = "gemini-2.5-flash" } =
      requestData;

    const geminiModel = getGeminiModelName(model);

    const prompt = `You are a research assistant. Based on the following research topic, generate 3-5 clarifying questions that would help refine and improve the research scope.

RESEARCH TOPIC: ${topic}

${documentContext ? `DOCUMENT CONTEXT:\n${documentContext.substring(0, 2000)}\n\n` : ""}

Generate 3-5 clarifying questions as a JSON array of strings. Return ONLY the JSON array, no other text.

Example format:
["What specific time period are you interested in?", "Are you focusing on a particular geographic region?", "What aspects are most important to you?"]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let jsonText = generatedText.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    jsonText = jsonText.replace(/^\[/, "").replace(/\]$/, "");

    const questions = JSON.parse(`[${jsonText}]`);

    return new Response(
      JSON.stringify({
        questions: Array.isArray(questions) ? questions : [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating clarifying questions:", error);

    return new Response(
      JSON.stringify({
        questions: [],
        error: error.message || "Failed to generate questions",
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});

function getGeminiModelName(model: string): string {
  const modelMap: Record<string, string> = {
    "gemini-2.5-flash": "models/gemini-2.0-flash-exp",
    "gemini-1.5-pro-latest": "models/gemini-1.5-pro-latest",
    "gemini-pro": "models/gemini-pro",
  };

  return modelMap[model] || "models/gemini-2.0-flash-exp";
}

