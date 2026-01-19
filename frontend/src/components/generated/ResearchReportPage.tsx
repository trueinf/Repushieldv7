import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { researchApi, type ResearchReport } from '../../services/researchApi';

interface ResearchReportPageProps {
  researchId: string;
  onBack: () => void;
}

export const ResearchReportPage: React.FC<ResearchReportPageProps> = ({
  researchId,
  onBack,
}) => {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [researchId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await researchApi.getReport(researchId);
      if (!data) {
        setError('Report not ready yet. Please wait a moment and try again.');
      } else {
        setReport(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;

    const exportData = {
      research_id: report.research_id,
      executive_summary: report.executive_summary,
      key_findings: report.key_findings,
      detailed_analysis: report.detailed_analysis,
      insights: report.insights,
      conclusion: report.conclusion,
      sources: report.sources,
      metadata: report.metadata,
      created_at: report.created_at,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${report.research_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto p-8">
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Loader2 size={48} className="animate-spin text-[#1F9D8A] mx-auto mb-4" />
            <p className="text-gray-600">Loading research report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto p-8 space-y-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Back to Research</span>
          </button>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <p className="text-red-600 font-semibold">{error}</p>
              <button
                onClick={loadReport}
                className="px-6 py-3 bg-[#1F9D8A] hover:bg-[#1a8a7a] text-white font-semibold rounded-lg flex items-center space-x-2 mx-auto"
              >
                <RefreshCw size={18} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Back to Research</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-[#1F9D8A] hover:bg-[#1a8a7a] text-white font-semibold rounded-lg flex items-center space-x-2"
          >
            <Download size={18} />
            <span>Export JSON</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0F1C2E] mb-2">Research Report</h1>
            <p className="text-sm text-gray-500">
              Generated on {new Date(report.created_at).toLocaleString()}
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-[#0F1C2E] mb-4 border-l-4 border-[#1F9D8A] pl-3">
              Executive Summary
            </h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {report.executive_summary}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F1C2E] mb-4 border-l-4 border-[#1F9D8A] pl-3">
              Key Findings
            </h2>
            <div className="space-y-4">
              {report.key_findings && report.key_findings.length > 0 ? (
                report.key_findings.map((finding, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#1F9D8A]"
                  >
                    <p className="text-gray-700">
                      {finding.text}
                      {finding.citations && finding.citations.length > 0 && (
                        <span className="text-[#1F9D8A] font-semibold ml-2">
                          [{finding.citations.join(', ')}]
                        </span>
                      )}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500">No key findings available.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F1C2E] mb-4 border-l-4 border-[#1F9D8A] pl-3">
              Detailed Analysis
            </h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {report.detailed_analysis}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F1C2E] mb-4 border-l-4 border-[#1F9D8A] pl-3">
              Insights
            </h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {report.insights}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F1C2E] mb-4 border-l-4 border-[#1F9D8A] pl-3">
              Conclusion
            </h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {report.conclusion}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F1C2E] mb-4 border-l-4 border-[#1F9D8A] pl-3">
              Sources
            </h2>
            <div className="space-y-3">
              {report.sources && report.sources.length > 0 ? (
                report.sources.map((source, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[#1F9D8A] font-bold">[{index + 1}]</span>
                          {source.title && (
                            <h4 className="font-semibold text-[#0F1C2E]">{source.title}</h4>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{source.domain}</p>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1F9D8A] hover:text-[#1a8a7a] text-sm flex items-center space-x-1"
                        >
                          <span>{source.url}</span>
                          <ExternalLink size={14} />
                        </a>
                        {source.date && (
                          <p className="text-xs text-gray-500 mt-1">Date: {source.date}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500">No sources available.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};






