import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY") || "";

interface ResearchRequest {
  originalQuery: string;
  clarifyingAnswers?: string;
  researchId: string;
  model: string;
  documentContext?: string;
  mode?: "comprehensive" | "universal";
}

interface SerpApiResult {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet: string;
    date?: string;
  }>;
}

interface ResearchReport {
  executiveSummary: string;
  keyFindings: Array<{
    text: string;
    citations: number[];
  }>;
  detailedAnalysis: string;
  insights: string;
  conclusion: string;
  sources: Array<{
    url: string;
    domain: string;
    date: string;
    title?: string;
  }>;
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const requestData: ResearchRequest = await req.json();
    const {
      originalQuery,
      clarifyingAnswers,
      researchId,
      model,
      documentContext,
      mode = "comprehensive",
    } = requestData;

    await supabaseClient
      .from("researches")
      .update({ current_step: 2, status: "In Progress" })
      .eq("id", researchId);

    const searchQuery = `${originalQuery} ${clarifyingAnswers || ""}`.trim();
    const searchResults = await performWebSearch(searchQuery);

    await supabaseClient
      .from("researches")
      .update({ current_step: 4 })
      .eq("id", researchId);

    const sources = searchResults.map((result, index) => ({
      url: result.link,
      domain: new URL(result.link).hostname,
      date: result.date || new Date().toISOString().split("T")[0],
      title: result.title,
      snippet: result.snippet,
      index: index + 1,
    }));

    const sourcesText = sources
      .map(
        (s, i) =>
          `[${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}\n`
      )
      .join("\n");

    await supabaseClient
      .from("researches")
      .update({ current_step: 6 })
      .eq("id", researchId);

    const report = await generateResearchReport(
      originalQuery,
      clarifyingAnswers,
      documentContext,
      sourcesText,
      sources,
      model
    );

    await supabaseClient
      .from("researches")
      .update({ current_step: 10, status: "Done" })
      .eq("id", researchId);

    const { error: reportError } = await supabaseClient
      .from("research_reports")
      .upsert({
        research_id: researchId,
        executive_summary: report.executiveSummary,
        key_findings: report.keyFindings,
        detailed_analysis: report.detailedAnalysis,
        insights: report.insights,
        conclusion: report.conclusion,
        sources: report.sources,
        metadata: {
          model: model,
          timestamp: new Date().toISOString(),
          mode: mode,
        },
      });

    if (reportError) {
      console.error("Error saving report:", reportError);
    }

    return new Response(
      JSON.stringify({
        status: "completed",
        report: report,
        model: model,
        raw: JSON.stringify(report, null, 2),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in deep research:", error);

    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const requestData: ResearchRequest = await req.json();
      await supabaseClient
        .from("researches")
        .update({ status: "Failed" })
        .eq("id", requestData.researchId);
    } catch (updateError) {
      console.error("Error updating failed status:", updateError);
    }

    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message || "Research failed",
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

async function performWebSearch(query: string): Promise<any[]> {
  if (!SERPAPI_KEY) {
    console.warn("SerpAPI key not found, using mock results");
    return getMockSearchResults();
  }

  try {
    const serpApiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(
      query
    )}&api_key=${SERPAPI_KEY}&num=10`;

    const response = await fetch(serpApiUrl);
    const data: SerpApiResult = await response.json();

    return (
      data.organic_results?.map((result) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        date: result.date,
      })) || []
    );
  } catch (error) {
    console.error("SerpAPI error:", error);
    return getMockSearchResults();
  }
}

function getMockSearchResults() {
  return [
    {
      title: "Example Research Result",
      link: "https://example.com/research",
      snippet: "This is a placeholder result. Configure SerpAPI for real results.",
      date: new Date().toISOString().split("T")[0],
    },
  ];
}

async function generateResearchReport(
  query: string,
  clarifyingAnswers: string | undefined,
  documentContext: string | undefined,
  sourcesText: string,
  sources: any[],
  model: string
): Promise<ResearchReport> {
  const geminiModel = getGeminiModelName(model);

  const prompt = `You are an expert research analyst. Generate a comprehensive research report based on the following query and sources.

RESEARCH QUERY: ${query}

${clarifyingAnswers ? `CLARIFYING ANSWERS:\n${clarifyingAnswers}\n\n` : ""}
${documentContext ? `DOCUMENT CONTEXT:\n${documentContext.substring(0, 5000)}\n\n` : ""}

SOURCES:
${sourcesText}

Generate a detailed research report in the following JSON format:
{
  "executiveSummary": "A 2-3 paragraph executive summary of the research findings",
  "keyFindings": [
    {
      "text": "Finding 1 with citation [1]",
      "citations": [1]
    },
    {
      "text": "Finding 2 with citations [2, 3]",
      "citations": [2, 3]
    }
  ],
  "detailedAnalysis": "A comprehensive 5-7 paragraph detailed analysis of the topic",
  "insights": "3-5 key insights or implications",
  "conclusion": "A 2-3 paragraph conclusion summarizing the research"
}

IMPORTANT:
- Use citations [1], [2], etc. to reference sources
- Ensure all findings are supported by the provided sources
- Be objective and analytical
- Return ONLY valid JSON, no markdown formatting`;

  try {
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
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

    const report = JSON.parse(jsonText);

    const formattedSources = sources.map((source) => ({
      url: source.url,
      domain: source.domain,
      date: source.date,
      title: source.title,
    }));

    return {
      executiveSummary: report.executiveSummary || "",
      keyFindings: report.keyFindings || [],
      detailedAnalysis: report.detailedAnalysis || "",
      insights: report.insights || "",
      conclusion: report.conclusion || "",
      sources: formattedSources,
    };
  } catch (error: any) {
    console.error("Error generating report:", error);
    throw new Error(`Failed to generate research report: ${error.message}`);
  }
}

function getGeminiModelName(model: string): string {
  const modelMap: Record<string, string> = {
    "gemini-2.5-flash": "models/gemini-2.0-flash-exp",
    "gemini-1.5-pro-latest": "models/gemini-1.5-pro-latest",
    "gemini-pro": "models/gemini-pro",
  };

  return modelMap[model] || "models/gemini-2.0-flash-exp";
}






