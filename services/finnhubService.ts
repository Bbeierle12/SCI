import { FinnhubQuote, FinnhubProfile, FinnhubNewsItem, FinnhubMetrics, FinnhubResponse } from "../types";
import { apiGet, apiPost } from "./apiClient";

// Check if Finnhub API is configured
export const isFinnhubAvailable = async (): Promise<boolean> => {
  try {
    const result = await apiGet<boolean>('/api/finnhub/available');
    return result;
  } catch {
    return false;
  }
};

// Get real-time quote for a single ticker
export const getQuote = async (ticker: string): Promise<FinnhubQuote | null> => {
  try {
    const response = await apiGet<FinnhubResponse<FinnhubQuote>>(`/api/finnhub/quote/${ticker}`);
    if (response.success && response.data) {
      // Validate quote has valid data (c=0 means no data)
      if (response.data.c === 0 && response.data.pc === 0) {
        console.warn(`No quote data available for ${ticker}`);
        return null;
      }
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch quote');
  } catch (error) {
    console.error(`Finnhub Quote Error (${ticker}):`, error);
    return null;
  }
};

// Get company profile
export const getProfile = async (ticker: string): Promise<FinnhubProfile | null> => {
  try {
    const response = await apiGet<FinnhubResponse<FinnhubProfile>>(`/api/finnhub/profile/${ticker}`);
    if (response.success && response.data && response.data.name) {
      return response.data;
    }
    // Empty profile means ticker not found
    if (response.success && response.data && !response.data.name) {
      console.warn(`No profile data available for ${ticker}`);
      return null;
    }
    throw new Error(response.error || 'Failed to fetch profile');
  } catch (error) {
    console.error(`Finnhub Profile Error (${ticker}):`, error);
    return null;
  }
};

// Get company news
export const getNews = async (ticker: string, daysBack: number = 7): Promise<FinnhubNewsItem[]> => {
  try {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await apiGet<FinnhubResponse<FinnhubNewsItem[]>>(
      `/api/finnhub/news/${ticker}?from=${from}&to=${to}`
    );
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch news');
  } catch (error) {
    console.error(`Finnhub News Error (${ticker}):`, error);
    return [];
  }
};

// Get financial metrics
export const getMetrics = async (ticker: string): Promise<FinnhubMetrics | null> => {
  try {
    const response = await apiGet<FinnhubResponse<FinnhubMetrics>>(`/api/finnhub/metrics/${ticker}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch metrics');
  } catch (error) {
    console.error(`Finnhub Metrics Error (${ticker}):`, error);
    return null;
  }
};

// Get quotes for multiple tickers (batch)
export const getBatchQuotes = async (tickers: string[]): Promise<Record<string, FinnhubQuote>> => {
  try {
    const response = await apiPost<FinnhubResponse<Record<string, FinnhubQuote>>>(
      '/api/finnhub/batch-quotes',
      { tickers }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch batch quotes');
  } catch (error) {
    console.error('Finnhub Batch Quotes Error:', error);
    return {};
  }
};

// Helper: Format market cap from millions to readable string
export const formatMarketCap = (marketCapInMillions: number): string => {
  if (!marketCapInMillions || marketCapInMillions <= 0) return 'N/A';

  if (marketCapInMillions >= 1000000) {
    return `${(marketCapInMillions / 1000000).toFixed(2)}T`;
  } else if (marketCapInMillions >= 1000) {
    return `${(marketCapInMillions / 1000).toFixed(2)}B`;
  } else {
    return `${marketCapInMillions.toFixed(0)}M`;
  }
};

// Helper: Format timestamp to readable date
export const formatNewsDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
