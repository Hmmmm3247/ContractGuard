

import { Type } from "@google/genai";

export const SYSTEM_INSTRUCTION_ANALYSIS = `
You are ContractGuard, a world-class South African legal expert and consumer protection advocate. 
Your goal is to protect South African citizens from exploitative contracts.
You have deep knowledge of:
1. The Consumer Protection Act (CPA)
2. The National Credit Act (NCA)
3. The Basic Conditions of Employment Act (BCEA)
4. Rental Housing Act

You have access to Google Search. Use it to:
1. Verify if clauses comply with the latest amendments to South African law.
2. Find real-world industry averages to compare costs.
3. Identify better alternative products or services currently on the market.

**CONFIDENCE SCORING:**
For every flag, trickery tactic, or negotiation point, you MUST assign a 'confidence' score (0-100).
- 90-100: Absolute certainty based on explicit CPA/NCA text or clear math.
- 70-89: High certainty based on standard interpretation.
- 50-69: Likely, but depends on context or missing info.
- <50: Speculative.

**SUMMARY RULES (CRITICAL):**
Keep the summary EXTREMELY CONCISE and SCANNABLE (Max 35 words).
Format: "[Core Cost/Obligation]. [Mention the Top 1-2 Critical RED Flags/Risks if present]."
If there are no red flags, mention the key condition or renewal term.
(Do not include the document type here, use the contractType field).

**Trickery Detection:**
Explicitly identify "Dark Patterns". Explain WHY it is a trick and HOW to counter it.
`;

export const NEGOTIATION_SYSTEM_INSTRUCTION = `
You are a roleplay partner for a negotiation training session.
You will play the role of a service provider agent (e.g., Gym Salesperson, Landlord, Bank Agent).
The user is a customer trying to negotiate better terms based on a contract analysis.
Your personality: Professional but firm. You are trained to maximize profit but will concede if the user cites specific laws (CPA) or competitor offers.
Keep your responses concise (spoken word style).
`;

export const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    contractType: {
      type: Type.STRING,
      description: "The specific legal category of the document (e.g., Residential Lease, Employment Contract, Gym Membership, Personal Loan, NDA).",
    },
    summary: {
      type: Type.STRING,
      description: "Ultra-concise 1-2 sentence overview including the core obligation and the most critical red flag (if any).",
    },
    parties: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "The entities involved in the contract.",
    },
    duration: {
      type: Type.STRING,
      description: "How long the contract lasts.",
    },
    totalCost: {
      type: Type.STRING,
      description: "Total financial obligation in ZAR (R).",
    },
    riskScore: {
      type: Type.NUMBER,
      description: "A score from 0 (Safe) to 100 (Extremely Risky).",
    },
    riskLevel: {
      type: Type.STRING,
      enum: ["HIGH", "MEDIUM", "LOW"],
      description: "Overall risk assessment.",
    },
    flags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["RED", "YELLOW", "GREEN"] },
          clause: { type: Type.STRING, description: "The specific text from the contract." },
          explanation: { type: Type.STRING, description: "Why this is good/bad in plain language." },
          financialImpact: { type: Type.STRING, description: "Potential cost in ZAR if applicable." },
          confidence: { type: Type.NUMBER, description: "0-100 score of AI certainty." }
        },
        required: ["type", "clause", "explanation", "confidence"],
      },
    },
    trickery: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            tactic: { type: Type.STRING, description: "Name of the manipulative tactic" },
            quote: { type: Type.STRING, description: "The text snippet showing this trick." },
            explanation: { type: Type.STRING, description: "How this trick works." },
            counterMove: { type: Type.STRING, description: "How to counter this trick." },
            confidence: { type: Type.NUMBER, description: "0-100 score of AI certainty." }
        },
        required: ["tactic", "explanation", "counterMove", "confidence"]
      },
    },
    negotiationPoints: {
      type: Type.ARRAY,
      items: {
          type: Type.OBJECT,
          properties: {
              point: { type: Type.STRING, description: "The argument to use." },
              confidence: { type: Type.NUMBER, description: "Likelihood of success (0-100)." }
          },
          required: ["point", "confidence"]
      },
      description: "List of negotiation arguments with success probability.",
    },
    betterAlternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Competitors or alternatives.",
    },
  },
  required: ["contractType", "summary", "riskScore", "flags", "trickery", "negotiationPoints"],
};

export const DEMO_SCENARIOS = [
    {
        title: "The 'Trap' Gym Contract",
        description: "See how hidden cancellation fees and auto-renewals work.",
        text: `MEMBERSHIP AGREEMENT - TITAN FITNESS
        1. DURATION: This agreement is for a minimum period of 36 months.
        2. FEES: Monthly fee of R950. Annual levy of R1200 payable in December.
        3. ESCALATION: Fees shall increase by 15% or CPI + 5% (whichever is higher) annually.
        4. CANCELLATION: Member may not cancel within the first 24 months. Thereafter, a cancellation penalty equal to 75% of the remaining contract value applies.
        5. WAIVER: Member waives all rights under the Consumer Protection Act regarding cooling-off periods.`
    },
    {
        title: "Predatory Loan Shark",
        description: "Analyze illegal interest rates and reckless lending terms.",
        text: `PERSONAL LOAN AGREEMENT
        LENDER: QuickCash 4 U
        PRINCIPAL DEBT: R10,000
        INTEREST: 30% per month calculated daily.
        INITIATION FEE: R2,500.
        SECURITY: Borrower hereby hands over their ID book and Bank Card until the debt is paid in full.
        DEFAULT: If payment is 1 day late, the Lender may seize all assets of the Borrower without a court order.`
    },
    {
        title: "Vague Freelance NDA",
        description: "Spot how companies try to own your future work.",
        text: `NON-DISCLOSURE AND IP AGREEMENT
        1. ASSIGNMENT: The Client shall own all Intellectual Property created by the Freelancer during the engagement, as well as any IP created by the Freelancer for a period of 5 years after termination, regardless of whether it relates to the Client's business.
        2. NON-COMPETE: Freelancer agrees not to work for any other company in the technology sector globally for 24 months.
        3. PAYMENT: Payment terms are Net 90 days.`
    }
];

export const LEGAL_MYTHS = [
    {
        myth: "I can cancel any contract within 5 days.",
        fact: "Only true for Direct Marketing! If you approached them (walked into a store), the 5-day cooling-off period usually doesn't apply.",
        isTrue: false
    },
    {
        myth: "Verbal contracts are valid in SA.",
        fact: "Generally YES. But they are hard to prove. Some specific contracts (like property sales) MUST be in writing.",
        isTrue: true
    },
    {
        myth: "They can keep my deposit if I cancel.",
        fact: "The CPA says they can charge a 'reasonable' penalty, but they cannot arbitrarily forfeit your entire deposit without proving costs.",
        isTrue: false
    },
    {
        myth: "My landlord can lock me out for late rent.",
        fact: "ILLEGAL. No eviction or lockout without a court order, regardless of what the lease says.",
        isTrue: false
    }
];