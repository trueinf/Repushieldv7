import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, ArrowRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { researchApi, type Research } from '../../services/researchApi';

interface DeepResearchPageProps {
  onResearchCreated: (research: Research) => void;
  onCancel: () => void;
}

export const DeepResearchPage: React.FC<DeepResearchPageProps> = ({ onResearchCreated, onCancel }) => {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'light' | 'standard' | 'deep'>('standard');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [extractingText, setExtractingText] = useState(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<number, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt|md)$/i)) {
      setError('Invalid file type. Please upload PDF, DOCX, TXT, or MD files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB.');
      return;
    }

    setUploadedFile(file);
    setError(null);
    setExtractingText(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        const extracted = await researchApi.extractFileText(
          file.name,
          file.type,
          base64
        );
        setDocumentText(extracted);
        setExtractingText(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from file');
      setExtractingText(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const loadClarifyingQuestions = async () => {
    if (!topic.trim()) return;

    setLoadingQuestions(true);
    try {
      const questions = await researchApi.getClarifyingQuestions(
        topic,
        documentText || undefined,
        model
      );
      setClarifyingQuestions(questions);
      setClarifyingAnswers({});
    } catch (err: any) {
      console.error('Error loading clarifying questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleStartResearch = async () => {
    if (!topic.trim()) {
      setError('Please enter a research topic');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const answersText = clarifyingQuestions
        .map((q, i) => clarifyingAnswers[i] ? `Q: ${q}\nA: ${clarifyingAnswers[i]}` : null)
        .filter(Boolean)
        .join('\n\n');

      const research = await researchApi.createResearch(topic, model, {
        depth,
        documentContext: documentText || undefined,
        clarifyingAnswers: answersText || undefined,
      });

      await researchApi.startDeepResearch(
        research.id,
        topic,
        model,
        {
          clarifyingAnswers: answersText || undefined,
          documentContext: documentText || undefined,
        }
      );

      onResearchCreated(research);
    } catch (err: any) {
      setError(err.message || 'Failed to start research');
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#0F1C2E]">Deep Research Configuration</h1>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
              <span className="border-l-4 border-[#1F9D8A] pl-2">Research Topic</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Impact of solid state batteries on EV market by 2030..."
              className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-[#0F1C2E] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
              Upload Documents (Optional)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 transition-all cursor-pointer",
                dragActive ? "border-[#1F9D8A] bg-[#1F9D8A]/5" : "border-gray-300 bg-white"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-3 text-center">
                {extractingText ? (
                  <>
                    <Loader2 size={32} className="animate-spin text-[#1F9D8A]" />
                    <p className="text-gray-600">Extracting text from document...</p>
                  </>
                ) : uploadedFile ? (
                  <>
                    <FileText size={32} className="text-[#1F9D8A]" />
                    <div>
                      <p className="text-gray-900 font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {documentText ? `${documentText.length} characters extracted` : 'Processing...'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        setDocumentText('');
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="text-gray-400" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        PDF, DOCX, TXT, MD (Max 50MB per file)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                Target Depth
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'standard', 'deep'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className={cn(
                      "px-6 py-3 rounded-lg font-semibold transition-all capitalize",
                      depth === d
                        ? "bg-[#1F9D8A] text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                AI Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#0F1C2E] focus:outline-none focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro Latest</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </div>

          {topic.trim() && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  <span className="border-l-4 border-[#1F9D8A] pl-2">Clarifying Questions (Optional)</span>
                </label>
                <button
                  onClick={loadClarifyingQuestions}
                  disabled={loadingQuestions}
                  className="text-sm text-[#1F9D8A] hover:text-[#1a8a7a] flex items-center space-x-1 disabled:opacity-50"
                >
                  {loadingQuestions ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle size={14} />
                      <span>Generate Questions</span>
                    </>
                  )}
                </button>
              </div>

              {clarifyingQuestions.length > 0 && (
                <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                  {clarifyingQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {question}
                      </label>
                      <textarea
                        value={clarifyingAnswers[index] || ''}
                        onChange={(e) =>
                          setClarifyingAnswers({
                            ...clarifyingAnswers,
                            [index]: e.target.value,
                          })
                        }
                        placeholder="Your answer (optional)"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent resize-none"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleStartResearch}
              disabled={!topic.trim() || creating}
              className={cn(
                "px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all",
                topic.trim() && !creating
                  ? "bg-[#1F9D8A] hover:bg-[#1a8a7a] text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Starting Research...</span>
                </>
              ) : (
                <>
                  <span>Start Research</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};






