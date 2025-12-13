import { SearchResult, ChatMessage, Stock, IntelligenceMetrics } from "../types";
import { apiGet, apiPost } from "./apiClient";

interface ClaudeOptions {
  systemPrompt?: string;
  noTools?: boolean;
}

interface ClaudeResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// Helper to call Claude CLI via backend
async function callClaude(prompt: string, options?: ClaudeOptions): Promise<string> {
  try {
    const response = await apiPost<ClaudeResponse>('/api/claude/query', { prompt, options });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Unknown error');
  } catch (error) {
    console.error("Claude CLI Error:", error);
    throw error;
  }
}

// Check if Claude is available
export const isClaudeAvailable = async (): Promise<boolean> => {
  try {
    return await apiGet<boolean>('/api/claude/available');
  } catch {
    return false;
  }
};

// 1. FAST RESPONSE - Quick Summary
export const getQuickSummary = async (stockName: string, role: string): Promise<string> => {
  try {
    const response = await callClaude(
      `Provide a one-sentence, high-impact summary of why ${stockName} is critical to Apple's supply chain as a ${role}. Keep it under 20 words.`,
      {
        systemPrompt: "You are a concise financial analyst. Give extremely brief responses.",
        noTools: true
      }
    );
    return response || "Summary unavailable.";
  } catch (error) {
    console.error("Quick Summary Error:", error);
    return "Data currently unavailable.";
  }
};

// 2. DEEP ANALYSIS - Strategic Risk Analysis
export const analyzeStrategicRisk = async (stockName: string): Promise<string> => {
  try {
    const response = await callClaude(
      `Conduct a strategic risk and opportunity analysis for ${stockName} specifically regarding its relationship with Apple.
      Consider:
      1. Geopolitical risks (if any).
      2. Technology displacement risks (e.g., Apple designing its own chips).
      3. Growth opportunities in the next 5 years.

      Format the output in clean Markdown. Be concise but insightful.`,
      {
        systemPrompt: "You are an expert financial analyst specializing in technology supply chains and Apple's ecosystem.",
        noTools: true
      }
    );
    return response || "Analysis unavailable.";
  } catch (error) {
    console.error("Deep Analysis Error:", error);
    return "Deep analysis currently unavailable.";
  }
};

// 3. NEWS/RESEARCH (Note: Without live search, uses Claude's knowledge)
export const getRecentSupplyChainNews = async (stockName: string): Promise<SearchResult> => {
  try {
    const response = await callClaude(
      `Based on your knowledge, provide a brief analysis of recent trends and news about ${stockName} that would affect its stock price or supply chain status. Focus on the most impactful developments. Note any important events from 2024-2025 if known.`,
      {
        systemPrompt: "You are a financial news analyst. Provide factual, brief summaries of relevant market developments.",
        noTools: true
      }
    );

    return {
      text: response || "No analysis available.",
      sources: [] // No live sources without web search
    };
  } catch (error) {
    console.error("News Analysis Error:", error);
    return { text: "Could not fetch recent analysis.", sources: [] };
  }
};

// 4. CHATBOT - General Chat
export const sendChatMessage = async (message: string, history: ChatMessage[]): Promise<string> => {
  try {
    // Build context from history (last 5 messages for context window)
    const recentHistory = history.slice(-5);
    const contextPrompt = recentHistory.length > 0
      ? `Previous conversation:\n${recentHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')}\n\nUser: ${message}`
      : message;

    const response = await callClaude(contextPrompt, {
      systemPrompt: "You are an expert financial analyst specializing in the Apple Supply Chain ecosystem. You are concise, professional, and data-driven. Answer questions about stocks, supply chains, and technology investments.",
      noTools: true
    });

    return response || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to the intelligence network.";
  }
};

// 5. GENERATE STOCK DATA - Add New Stock
export const generateStockData = async (ticker: string): Promise<Stock | null> => {
  try {
    const response = await callClaude(
      `I need analysis for the public stock ticker: ${ticker.toUpperCase()}.

      Based on your knowledge:
      1. Provide its approximate current price (use most recent known data), typical percent change, market cap, and region.
      2. Determine its 'role' in the global technology or supply chain ecosystem (short string, 2-4 words).
      3. Write a 2-sentence 'description' focusing on its relevance to tech/supply chains.
      4. Categorize it into EXACTLY ONE of these categories: "AI & Compute", "Quantum", "Strategic Materials", "Metals & Mining", "Semi Equip", "Battery & Power", "Components", "Manufacturing", "Other".
      5. Assess its risk level (Low/Medium/High/Extreme) and Growth Potential (percentage string like "+15%").
      6. Add relevant tags from: "Apple Direct", "US Reshoring", "Chips", "Data Center", "Geopolitical Risk", "Turnaround", "IP Licensing", "Connectivity", "Penny Stock"

      Output ONLY a valid JSON object (no markdown, no explanation) matching this exact structure:
      {"ticker": "${ticker.toUpperCase()}", "name": "Company Name", "price": 123.45, "change": 1.23, "category": "Category Name", "role": "Short Role", "description": "Description...", "marketCap": "100B", "risk": "Medium", "growthPotential": "+10%", "region": "US", "tags": ["Tag1", "Tag2"]}`,
      {
        systemPrompt: "You are a financial data provider. Output only valid JSON with no additional text or markdown formatting.",
        noTools: true
      }
    );

    // Try to extract JSON from response
    let jsonString = response.trim();

    // If wrapped in code blocks, extract
    const jsonMatch = jsonString.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[1] || jsonMatch[0];
    }

    try {
      const stockData = JSON.parse(jsonString) as Stock;
      // Ensure strictly typed fields
      return {
        ...stockData,
        ticker: stockData.ticker?.toUpperCase() || ticker.toUpperCase(),
        price: Number(stockData.price) || 0,
        change: Number(stockData.change) || 0,
        tags: Array.isArray(stockData.tags) ? stockData.tags : ["New Addition"]
      };
    } catch (e) {
      console.error("Failed to parse stock JSON:", e, jsonString);
      return null;
    }

  } catch (error) {
    console.error("Generate Stock Error:", error);
    return null;
  }
};

// 6. STOCK INTELLIGENCE - Metrics
export const getStockIntelligence = async (ticker: string): Promise<IntelligenceMetrics | null> => {
  try {
    const response = await callClaude(
      `Analyze the stock ${ticker} and provide intelligence metrics based on recent performance.

      Output ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
      {"sentimentScore": 75, "sentimentTrend": "Bullish", "supplyChainHealth": 80, "innovationIndex": 70, "technicalSupport": "$150", "technicalResistance": "$180"}

      - sentimentScore: 0-100 number
      - sentimentTrend: exactly one of "Bullish", "Bearish", or "Neutral"
      - supplyChainHealth: 0-100 number
      - innovationIndex: 0-100 number
      - technicalSupport: price string with $
      - technicalResistance: price string with $`,
      {
        systemPrompt: "You are a quantitative analyst. Output only valid JSON with no additional text.",
        noTools: true
      }
    );

    let jsonString = response.trim();
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const json = JSON.parse(jsonString);
    return json as IntelligenceMetrics;
  } catch (error) {
    console.error("Stock Intelligence Error:", error);
    return null;
  }
};
