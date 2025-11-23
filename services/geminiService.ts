import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, ChatMessage, Stock, IntelligenceMetrics } from "../types";

// Initialize Gemini Client
// Note: API_KEY is assumed to be in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. FAST RESPONSE (Lite Model)
export const getQuickSummary = async (stockName: string, role: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', // Maps to gemini-2.5-flash-lite
      contents: `Provide a one-sentence, high-impact summary of why ${stockName} is critical to Apple's supply chain as a ${role}. Keep it under 20 words.`,
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Quick Summary Error:", error);
    return "Data currently unavailable.";
  }
};

// 2. DEEP THINKING (Pro Model with Thinking Budget)
export const analyzeStrategicRisk = async (stockName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Conduct a strategic risk and opportunity analysis for ${stockName} specifically regarding its relationship with Apple. 
      Consider:
      1. Geopolitical risks (if any).
      2. Technology displacement risks (e.g., Apple designing its own chips).
      3. Growth opportunities in the next 5 years.
      
      Format the output in clean Markdown. Be concise but insightful.`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, // Use thinking for reasoning
      },
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Deep Analysis Error:", error);
    return "Deep analysis currently unavailable due to high demand.";
  }
};

// 3. SEARCH GROUNDING (Flash Model with Google Search)
export const getRecentSupplyChainNews = async (stockName: string): Promise<SearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the latest important news stories from the last month about ${stockName} that affect its stock price or supply chain status. Summarize the top 3 stories briefly.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No news found.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = chunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
      }));

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values()) as any;

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("News Search Error:", error);
    return { text: "Could not fetch recent news.", sources: [] };
  }
};

// 4. CHATBOT (Pro Model for general chat)
export const sendChatMessage = async (message: string, history: ChatMessage[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are an expert financial analyst specializing in the Apple Supply Chain ecosystem. You are concise, professional, and data-driven.",
      }
    });

    // In a real app, we would sync the history here.
    const result = await chat.sendMessage({ message });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to the intelligence network.";
  }
};

// 5. ANALYZE & ADD NEW STOCK (Generates Stock Object)
export const generateStockData = async (ticker: string): Promise<Stock | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        I need real-time data and strategic analysis for the public stock ticker: ${ticker}.
        
        Please perform the following:
        1. Find its current price, percent change (today), market cap, and region.
        2. Analyze its business to determine its 'role' in the global technology or supply chain ecosystem (short string).
        3. Write a 2-sentence 'description' focusing on its relevance to tech/supply chains.
        4. Categorize it into EXACTLY ONE of these categories: "AI & Compute", "Quantum", "Strategic Materials", "Metals & Mining", "Semi Equip", "Battery & Power", "Components", "Manufacturing", "Other".
        5. Assess its risk level (Low/Medium/High/Extreme) and Growth Potential (percentage string).
        
        Output the result as a VALID JSON string inside a markdown code block. The JSON must match this structure:
        {
          "ticker": "${ticker.toUpperCase()}",
          "name": "Company Name",
          "price": 123.45,
          "change": 1.23,
          "category": "Category Name",
          "role": "Short Role",
          "description": "Description...",
          "marketCap": "100B",
          "risk": "Medium",
          "growthPotential": "+10%",
          "region": "US/Europe/Asia/etc",
          "tags": ["Tag1", "Tag2"]
        }
      `,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    // Extract JSON from markdown code block if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;

    try {
        const stockData = JSON.parse(jsonString) as Stock;
        // Ensure strictly typed fields if AI hallucinates slightly
        return {
            ...stockData,
            price: Number(stockData.price) || 0,
            change: Number(stockData.change) || 0,
            tags: Array.isArray(stockData.tags) ? stockData.tags : ["New Addition"]
        };
    } catch (e) {
        console.error("Failed to parse stock JSON", e);
        return null;
    }

  } catch (error) {
    console.error("Generate Stock Error:", error);
    return null;
  }
};

// 6. GET STOCK INTELLIGENCE (Metrics)
export const getStockIntelligence = async (ticker: string): Promise<IntelligenceMetrics | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the stock ${ticker} and provide intelligence metrics based on recent performance and news.
        Return a JSON object.
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentimentScore: { type: Type.NUMBER, description: "0-100 score" },
            sentimentTrend: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral'] },
            supplyChainHealth: { type: Type.NUMBER, description: "0-100 score" },
            innovationIndex: { type: Type.NUMBER, description: "0-100 score" },
            technicalSupport: { type: Type.STRING, description: "Price level" },
            technicalResistance: { type: Type.STRING, description: "Price level" },
          },
          required: ['sentimentScore', 'sentimentTrend', 'supplyChainHealth', 'innovationIndex', 'technicalSupport', 'technicalResistance'],
        },
      },
    });

    const json = JSON.parse(response.text || "{}");
    return json as IntelligenceMetrics;
  } catch (error) {
    console.error("Stock Intelligence Error:", error);
    return null;
  }
};