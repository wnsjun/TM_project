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
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">분석 결과</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">위험도 수준:</span>
                  <span className={`text-lg font-bold ${
                    result.final_risk_level === '위험'
                      ? 'text-red-600'
                      : result.final_risk_level === '경고'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {result.final_risk_level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">위험도 점수:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {(result.final_risk_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
