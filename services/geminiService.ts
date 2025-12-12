
import { GoogleGenAI, Type } from "@google/genai";
import { ANALYSIS_SCHEMA, SYSTEM_INSTRUCTION_ANALYSIS } from "../constants";
import { ContractAnalysis, GroundingSource, UserIdentity, NegotiationTone, CompanyProfile } from "../types";

const apiKey = process.env.API_KEY || '';

// Singleton instance helper
const getAI = () => new GoogleGenAI({ apiKey });

const constructAnalysisPrompt = (identity: UserIdentity, tone: NegotiationTone) => {
  const schemaString = JSON.stringify(ANALYSIS_SCHEMA, null, 2);
  return `
    THE USER IS A: ${identity}.
    THE DESIRED NEGOTIATION TONE IS: ${tone}.

    **TASK: DEEP LEGAL ANALYSIS & RISK SCORING**

    1. **LEGAL GROUNDING (CPA/NCA)**:
       Use Google Search to cross-reference clauses with the *Consumer Protection Act 68 of 2008* and *National Credit Act*.
       If a clause violates a specific section (e.g., Section 14 Cancellation), Flag it RED.

    2. **FINANCIAL FORENSICS (CODE EXECUTION)**:
       Use the Code Execution tool to calculate the TRUE TOTAL COST.
       - If there is an annual escalation (e.g., CPI + 5%), calculate the compounding effect over the full term.
       - Sum up all monthly fees, admin fees, and initiation fees.
       - Output the final calculated R-value in the 'totalCost' field.

    3. **TRICKERY DETECTION**:
       Identify "Dark Patterns" such as:
       - Roachy Motel (Easy to get in, hard to get out).
       - Forced Continuity (Auto-renewal without notice).
       - Confusopoly (Intentionally vague pricing).

    4. **OUTPUT**:
       Return ONLY valid JSON matching this schema:
       ${schemaString}
  `;
};

const extractGroundingSources = (groundingMetadata: any): GroundingSource[] => {
    const sources: GroundingSource[] = [];
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          if (!sources.some(s => s.uri === chunk.web?.uri)) {
             sources.push({
               title: chunk.web.title,
               uri: chunk.web.uri
             });
          }
        }
      });
    }
    return sources;
};

const parseAnalysisResponse = (text: string, groundingMetadata: any): ContractAnalysis => {
    // Clean markdown if present
    let cleanText = text.replace(/```json\n?|\n?```/g, "").trim();

    const groundingSources = extractGroundingSources(groundingMetadata);
    
    try {
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      const analysis = JSON.parse(cleanText) as ContractAnalysis;
      analysis.groundingSources = groundingSources;
      if (!analysis.trickery) analysis.trickery = [];
      if (!analysis.contractType) analysis.contractType = "General Agreement";

      return analysis;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response Text:", cleanText);
      throw new Error("Failed to parse Gemini response as JSON.");
    }
};

export const analyzeContractText = async (
  text: string,
  identity: UserIdentity,
  tone: NegotiationTone
): Promise<ContractAnalysis> => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = getAI();
  const promptText = `
    Analyze the following CONTRACT TEXT diligently and thoroughly.
    
    CONTRACT TEXT:
    "${text}"

    ${constructAnalysisPrompt(identity, tone)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using 2.5 Flash which supports Thinking
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
        tools: [
            { googleSearch: {} },
            { codeExecution: {} } // Enable Code Execution for Financial Math
        ],
        thinkingConfig: { thinkingBudget: 1024 } // Enable "High Thinking" for deep analysis
      }
    });

    if (!response.text) throw new Error("No response from AI");
    return parseAnalysisResponse(response.text, response.candidates?.[0]?.groundingMetadata);

  } catch (error) {
    console.error("Text Analysis Failed", error);
    throw error;
  }
};

export const analyzeContractImage = async (
  base64Image: string, 
  mimeType: string,
  identity: UserIdentity,
  tone: NegotiationTone
): Promise<ContractAnalysis> => {
  if (!apiKey) throw new Error("API Key missing");
  const ai = getAI();
  
  const promptText = `
    Analyze this contract document (Image or PDF) diligently and thoroughly.
    If this is a PDF, ensure you process the text carefully to catch hidden clauses or small print.

    ${constructAnalysisPrompt(identity, tone)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
        tools: [
            { googleSearch: {} },
            { codeExecution: {} }
        ],
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    if (!response.text) throw new Error("No response from AI");
    return parseAnalysisResponse(response.text, response.candidates?.[0]?.groundingMetadata);

  } catch (error) {
    console.error("Image Analysis Failed", error);
    throw error;
  }
};

// Updated: tone is now 'string' to allow custom tones
export const generateEmailDraft = async (
    contractSummary: string,
    providerName: string,
    intent: string,
    identity: UserIdentity,
    tone: string, 
    aggressionLevel: number // 1 to 10
): Promise<{ subject: string; body: string }> => {
    const ai = getAI();
    
    let aggressionInstruction = "";
    if (aggressionLevel <= 3) {
        aggressionInstruction = "Maintain a cooperative relationship. Be polite but firm about rights.";
    } else if (aggressionLevel <= 7) {
        aggressionInstruction = "Be very firm. State clearly that the terms are unacceptable. Demand a response within a reasonable timeframe.";
    } else {
        aggressionInstruction = `
            MAXIMUM AGGRESSION. 
            - Cite the Consumer Protection Act (CPA) explicitly.
            - Threaten to escalate to the Consumer Goods and Services Ombud (CGSO) or National Consumer Commission.
            - Use phrases like 'reservation of rights', 'bad faith', and 'unconscionable conduct'.
            - Demand a response within 48 hours.
            - Make it clear we are ready to leave/cancel immediately if demands aren't met.
        `;
    }

    const prompt = `
        Draft a formal email to ${providerName}.
        
        CONTEXT:
        My Identity: ${identity}
        Contract Context: ${contractSummary}
        My Goal/Intent: ${intent}
        Desired Tone: ${tone}
        Aggression Level: ${aggressionLevel}/10.
        
        AGGRESSION INSTRUCTIONS:
        ${aggressionInstruction}

        INSTRUCTIONS:
        - Use South African English spelling.
        - Use specific placeholders like [My Name], [Account Number], [Date].
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING }
                },
                required: ["subject", "body"]
            }
        }
    });

    const text = response.text || "{}";
    try {
        return JSON.parse(text);
    } catch (e) {
        return { subject: "Contract Query", body: response.text || "Could not generate email." };
    }
}

// Updated: tone is now 'string'
export const refineEmailDraft = async (
    currentSubject: string,
    currentBody: string,
    instruction: string,
    tone: string
): Promise<{ subject: string; body: string }> => {
     const ai = getAI();

    const prompt = `
        Refine the following email draft based on the user's instruction.

        CURRENT SUBJECT: ${currentSubject}
        CURRENT BODY: ${currentBody}
        
        USER INSTRUCTION: ${instruction}
        DESIRED TONE: ${tone}

        OUTPUT FORMAT:
        Return a JSON object with two fields: "subject" and "body".
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING }
                },
                required: ["subject", "body"]
            }
        }
    });

    const text = response.text || "{}";
    try {
        return JSON.parse(text);
    } catch (e) {
        return { subject: currentSubject, body: response.text || currentBody };
    }
}

export const analyzeCompanyReputation = async (companyName: string): Promise<CompanyProfile> => {
    const ai = getAI();
    
    const prompt = `
        Perform a comprehensive background check and reputation analysis on the company: "${companyName}".
        Focus on their operations in South Africa (or global if not SA based).
        
        Use Google Search to find:
        1. Reviews on HelloPeter, Google Reviews, TrustPilot, and social media.
        2. Common complaints (hidden fees, bad support, cancellation issues).
        3. Determine a 'Trust Score' (0-100) based on the ratio of positive to negative sentiment found online.
           - <40: Poor reputation, many unresolved complaints (e.g. difficult cancellations).
           - 40-70: Mixed reviews.
           - >70: Generally trusted and compliant.
        
        Return a valid JSON object matching this structure:
        {
            "id": "generate-a-clean-lowercase-id-from-canonical-name",
            "name": "Canonical Company Name (e.g. 'Vodacom SA' instead of 'vodacom')",
            "industry": "Industry Type",
            "trustScore": number (0-100),
            "commonTraps": ["trap 1", "trap 2", "trap 3"],
            "positiveTraits": ["trait 1", "trait 2"],
            "userRatings": { "negotiability": number (1-5), "transparency": number (1-5) },
            "totalContractsAnalyzed": 0
        }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            // Removed responseMimeType to comply with Google Search grounding rules
        }
    });
    
    const text = response.text || "{}";
    const groundingSources = extractGroundingSources(response.candidates?.[0]?.groundingMetadata);

    try {
        // Clean potential markdown wrappers
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        const jsonStr = cleanText.substring(start, end + 1);
        
        const data = JSON.parse(jsonStr);
        
        // Ensure ID is safe and consistently formatted
        const safeId = data.name ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'unknown_company';
        
        return {
            ...data,
            id: safeId,
            sources: groundingSources
        };
    } catch (e) {
        console.error("Failed to parse company analysis", e);
        throw new Error("Could not analyze company reputation.");
    }
}

export const moderateReviewContent = async (reviewContent: string, companyName: string): Promise<{ approved: boolean; reason: string; suggestedFix?: string }> => {
    const ai = getAI();
    
    const prompt = `
        You are a strict Legal Compliance Officer & Defamation Shield for a South African consumer protection platform.
        Analyze the following user review for the company "${companyName}".
        
        REVIEW CONTENT: "${reviewContent}"
        
        TASK:
        Protect the user from defamation liability while preserving their right to honest consumer feedback.
        
        STRICT RULES:
        1. DEFAMATION CHECK: REJECT any absolute accusations of criminal conduct unless it is a court ruling.
           - "They are scammers/thieves/frauds" -> REJECT (This is actionable defamation).
           - "I felt scammed / It feels like theft" -> APPROVE (Protected opinion/feeling).
        2. DOXXING CHECK: REJECT if specific low-level employee names or private phone numbers are mentioned.
        3. HATE SPEECH: REJECT instantly.
        4. ALLOW: Honest descriptions of bad service, billing errors, rude staff, or difficult cancellations.
        
        Output JSON:
        {
            "approved": boolean,
            "reason": "Detailed legal reason for approval or rejection.",
            "suggestedFix": "If rejected due to phrasing, provide a rewritten version that conveys the SAME negative sentiment but as a legally protected opinion (e.g. change 'They stole my money' to 'They deducted funds without my authorization')."
        }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    approved: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                    suggestedFix: { type: Type.STRING }
                },
                required: ["approved", "reason"]
            }
        }
    });

    const text = response.text || "{}";
    try {
        return JSON.parse(text);
    } catch (e) {
        return { approved: false, reason: "AI Moderation check failed. Please try again." };
    }
}

// --- NEW TRANSLATION & SUMMARIZATION FEATURES ---

export const translateContractAnalysis = async (
    analysis: ContractAnalysis,
    targetLanguage: string
): Promise<ContractAnalysis> => {
    if (targetLanguage === 'English') return analysis;

    const ai = getAI();
    const prompt = `
        You are a highly skilled legal translator for South African languages.
        Translate the following Contract Analysis JSON into ${targetLanguage}.
        
        RULES:
        1. Preserve the JSON structure exactly.
        2. Only translate the values of string fields that are human-readable (summary, explanations, advice, negotiation points).
        3. For 'clause' fields (which are direct quotes from the contract), keep the original English text but append the translation in brackets if it helps understanding.
        4. Keep 'riskScore', 'riskLevel', 'confidence' values exactly as is.
        5. Keep 'contractType' in English or provide the standard localized legal term.
        
        INPUT JSON:
        ${JSON.stringify(analysis)}
        
        OUTPUT:
        Valid JSON only.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
            // Schema is implied by the input structure
        }
    });

    const text = response.text || "{}";
    try {
         // Clean potential markdown wrappers
        const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        const jsonStr = cleanText.substring(start, end + 1);
        
        const translated = JSON.parse(jsonStr) as ContractAnalysis;
        // Ensure critical fields are preserved if AI messed up
        translated.riskScore = analysis.riskScore;
        translated.flags = translated.flags || [];
        
        return translated;
    } catch (e) {
        console.error("Translation failed", e);
        throw new Error("Could not translate the report.");
    }
}

export const adaptSummary = async (
    analysis: ContractAnalysis,
    style: 'simple' | 'legal' | 'standard'
): Promise<string> => {
    const ai = getAI();
    
    let styleInstruction = "";
    if (style === 'simple') {
        styleInstruction = "Explain Like I'm 5. Use very simple language. Focus on 'What do I pay?' and 'What is the danger?'. Avoid legal jargon.";
    } else if (style === 'legal') {
        styleInstruction = "Professional Legal Summary. Use precise legal terminology suitable for a lawyer or compliance officer. Focus on liability and obligations.";
    } else {
        return analysis.summary; // Standard is default
    }

    const prompt = `
        Rewrite the executive summary of this contract based on the analysis below.
        
        ANALYSIS CONTEXT:
        Risk Level: ${analysis.riskLevel}
        Key Risks: ${analysis.flags.map(f => f.explanation).join('; ')}
        Original Summary: ${analysis.summary}
        
        TASK:
        Rewrite the summary in this style: "${styleInstruction}"
        Keep it under 50 words.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || analysis.summary;
}

export const getGeminiClient = () => {
    return getAI();
}
