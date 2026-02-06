import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { fileName, fileType, fileContent } = await req.json();

    if (!fileContent) {
      throw new Error("File content is required");
    }

    const fileBuffer = Uint8Array.from(atob(fileContent), (c) =>
      c.charCodeAt(0)
    );

    let extractedText = "";

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      extractedText = await extractTextFromDOCX(fileBuffer);
    } else if (
      fileType === "text/plain" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md")
    ) {
      extractedText = new TextDecoder().decode(fileBuffer);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    const maxLength = 20000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength);
    }

    return new Response(
      JSON.stringify({
        text: extractedText,
        length: extractedText.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error extracting file text:", error);

    return new Response(
      JSON.stringify({
        text: "",
        error: error.message || "Failed to extract text",
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

async function extractTextFromPDF(buffer: Uint8Array): Promise<string> {
  try {
    const pdfjs = await import("https://deno.land/x/pdfjs@0.4.0/mod.ts");
    const pdf = await pdfjs.parsePDF(buffer);
    let text = "";
    
    for (const page of pdf.pages) {
      text += page.text + "\n";
    }
    
    return text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "PDF text extraction failed. Please ensure the PDF contains selectable text.";
  }
}

async function extractTextFromDOCX(buffer: Uint8Array): Promise<string> {
  try {
    const mammoth = await import("https://esm.sh/mammoth@1.6.0");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer });
    return result.value;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return "DOCX text extraction failed. Please convert to PDF or TXT.";
  }
}












