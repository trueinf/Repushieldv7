import React, { useState, useEffect } from 'react';
import { Loader2, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { researchApi, type Research } from '../../services/researchApi';

interface ResearchProgressProps {
  researchId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const ResearchProgress: React.FC<ResearchProgressProps> = ({
  researchId,
  onComplete,
  onCancel,
}) => {
  const [research, setResearch] = useState<Research | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const startTime = React.useRef(Date.now());
  const POLL_INTERVAL = 5000;
  const TIMEOUT_MS = 90000;

  useEffect(() => {
    loadResearch();
    const interval = setInterval(loadResearch, POLL_INTERVAL);
    const timeout = setTimeout(() => {
      setTimeoutReached(true);
    }, TIMEOUT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [researchId]);

  useEffect(() => {
    if (research?.status === 'Done') {
      setTimeout(() => {
        onComplete();
      }, 1000);
    } else if (research?.status === 'Failed') {
      setError('Research failed. Please try again.');
    }
  }, [research?.status, onComplete]);

  const loadResearch = async () => {
    try {
      const data = await researchApi.getResearch(researchId);
      setResearch(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load research status');
    }
  };

  const progressPercentage = research
    ? Math.min((research.current_step / research.total_steps) * 100, 100)
    : 0;

  const steps = [
    'Initializing research',
    'Analyzing query',
    'Gathering sources',
    'Performing web search',
    'Validating sources',
    'Generating report',
    'Finalizing',
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#0F1C2E]">Research in Progress</h1>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          {research && (
            <>
              <div>
                <h2 className="text-xl font-semibold text-[#0F1C2E] mb-2">
                  {research.topic}
                </h2>
                <p className="text-sm text-gray-500">
                  Started {new Date(research.created_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-[#0F1C2E]">
                    {research.current_step} / {research.total_steps} steps
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#1F9D8A] rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {Math.round(progressPercentage)}%
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Current Step
                </h3>
                <div className="flex items-center space-x-3">
                  {research.status === 'In Progress' && (
                    <Loader2 size={20} className="animate-spin text-[#1F9D8A]" />
                  )}
                  {research.status === 'Done' && (
                    <CheckCircle2 size={20} className="text-green-600" />
                  )}
                  <span className="text-gray-700">
                    {steps[Math.min(research.current_step, steps.length - 1)] || 'Processing...'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      research.status === 'Done'
                        ? 'bg-green-50 text-green-700'
                        : research.status === 'Failed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {research.status}
                  </span>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {timeoutReached && research?.status !== 'Done' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
              <p className="font-semibold mb-1">Research is taking longer than expected</p>
              <p className="text-sm">
                The research is still processing. You can close this window and check back later.
              </p>
            </div>
          )}

          {research?.status === 'Done' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={20} />
                <span className="font-semibold">Research completed successfully!</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

