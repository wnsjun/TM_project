import { instance } from '../utils/axiosInstance';

export interface AnalyzeRequest {
  article_title: string;
  article_body: string;
}

export interface AnalyzeResponse {
  final_risk_score: number;
  final_risk_level: string;
  breakdown: Record<string, {
    score: number;
    reason: string;
    recommendation: string;
    found_urls: {
      url: string;
      similarity: number;
    }[];
  }>;
}

export const analyzeArticle = async (data: AnalyzeRequest): Promise<AnalyzeResponse> => {
  const response = await instance.post<AnalyzeResponse>('/api/v1/analyze', data);
  return response.data;
};
