import { useState } from 'react';
import { analyzeArticle } from '../api/analyze';
import type { AnalyzeResponse } from '../api/analyze';

function Home() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeArticle({
        article_title: title,
        article_body: content,
      });
      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || '분석 중 오류가 발생했습니다.');
      } else {
        setError('분석 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (title.trim() && content.trim() && !loading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const isFormValid = title.trim() !== '' && content.trim() !== '';

  const getScoreColor = (score: number, key: string) => {
    if (key === 'aggro_score') {
      // aggro_score는 0-100 범위
      const normalizedScore = score * 100;
      if (normalizedScore < 40) return 'text-green-600';
      if (normalizedScore < 60) return 'text-yellow-600';
      if (normalizedScore < 80) return 'text-orange-600';
      return 'text-red-600';
    } else {
      // mismatch_score, crossref_score는 0-1 범위
      if (score < 0.45) return 'text-green-600';
      return 'text-red-600';
    }
  };

  const getScoreBgColor = (score: number, key: string) => {
    if (key === 'aggro_score') {
      const normalizedScore = score * 100;
      if (normalizedScore < 40) return 'bg-green-100 border-green-200';
      if (normalizedScore < 60) return 'bg-yellow-100 border-yellow-200';
      if (normalizedScore < 80) return 'bg-orange-100 border-orange-200';
      return 'bg-red-100 border-red-200';
    } else {
      if (score < 0.45) return 'bg-green-100 border-green-200';
      return 'bg-red-100 border-red-200';
    }
  };

  const getProgressBarColor = (score: number, key?: string) => {
    if (key === 'aggro_score') {
      const normalizedScore = score * 100;
      if (normalizedScore < 40) return 'bg-green-500';
      if (normalizedScore < 60) return 'bg-yellow-500';
      if (normalizedScore < 80) return 'bg-orange-500';
      return 'bg-red-500';
    } else if (key === 'mismatch_score' || key === 'crossref_score') {
      if (score < 0.45) return 'bg-green-500';
      return 'bg-red-500';
    } else {
      // final_risk_score는 0.5 기준 임계값 사용
      if (score < 0.5) return 'bg-green-500';
      return 'bg-red-500';
    }
  };

  const getCategoryLabel = (key: string) => {
    const labels: Record<string, string> = {
      aggro_score: '제목 과장성',
      mismatch_score: '제목-본문 비일관성',
      crossref_score: '내용 비신뢰성',
    };
    return labels[key] || key;
  };

  const cleanReason = (reason: string) => {
    // [디버그 모드] 제거
    let cleaned = reason.replace(/\[디버그 모드\]\s*/g, '');

    // "1. 요약문:" 부분만 추출
    const summaryMatch = cleaned.match(/1\.\s*요약문:\s*([^\n]+(?:\n(?!2\.|3\.)[^\n]+)*)/);
    if (summaryMatch) {
      return '요약문: ' + summaryMatch[1].trim();
    }

    return cleaned;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            기사 가이드라인 생성
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                기사 제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="기사 제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                기사 본문
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="기사 본문을 입력하세요 (Ctrl+Enter로 제출)"
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="cursor-pointer w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '분석 중...' : '가이드라인 생성'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-8 space-y-6">
              {/* 전체 요약 카드 */}
              <div className={`p-6 rounded-lg border-2 ${
                result.final_risk_level === '위험'
                  ? 'bg-red-50 border-red-300'
                  : result.final_risk_level === '주의' || result.final_risk_level === '경고'
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-green-50 border-green-300'
              }`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">전체 분석 결과</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium text-lg">위험도 수준:</span>
                    <span className={`text-2xl font-bold ${
                      result.final_risk_level === '위험'
                        ? 'text-red-600'
                        : result.final_risk_level === '주의' || result.final_risk_level === '경고'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {result.final_risk_level}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">위험도 점수</span>
                      <span className="text-lg font-bold text-gray-900">
                        {(result.final_risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${getProgressBarColor(result.final_risk_score)}`}
                        style={{ width: `${result.final_risk_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 세부 분석 항목 */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">세부 분석</h3>
                {Object.entries(result.breakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-5 rounded-lg border ${getScoreBgColor(value.score, key)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {getCategoryLabel(key)}
                      </h4>
                      <span className={`text-xl font-bold ${getScoreColor(value.score, key)}`}>
                        {(value.score * 100).toFixed(0)}점
                      </span>
                    </div>

                    {/* 프로그레스 바 */}
                    <div className="w-full bg-white rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressBarColor(value.score, key)}`}
                        style={{ width: `${value.score * 100}%` }}
                      />
                    </div>

                    {/* 이유 */}
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">분석 이유:</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded">
                        {cleanReason(value.reason)}
                      </p>
                    </div>

                    {/* 권장사항 */}
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">권장사항:</p>
                      <p className="text-sm text-gray-800 bg-white p-3 rounded">
                        {value.recommendation}
                      </p>
                    </div>

                    {/* 관련 URL */}
                    {value.found_urls && value.found_urls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">관련 기사:</p>
                        <div className="space-y-2">
                          {value.found_urls.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white p-2 rounded text-sm"
                            >
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate flex-1"
                              >
                                {item.url}
                              </a>
                              <span className="text-gray-600 ml-2">
                                유사도: {(item.similarity * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
