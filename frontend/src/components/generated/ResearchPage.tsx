import React, { useState } from 'react';
import { Zap, Upload, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
type TabType = 'new' | 'ongoing' | 'completed';
type DepthType = 'light' | 'standard' | 'deep';
export const ResearchPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [researchTopic, setResearchTopic] = useState('');
  const [targetDepth, setTargetDepth] = useState<DepthType>('light');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Handle file upload logic here
  };
  return <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#0F1C2E]">Research Hub</h1>
          <p className="text-gray-600">
            Manage your deep dive investigations. Initiate new topics or track ongoing agentic workflows.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 border-b border-gray-200">
          <button onClick={() => setActiveTab('new')} className={cn("px-4 py-3 text-sm font-medium transition-all relative", activeTab === 'new' ? "text-blue-600" : "text-gray-600 hover:text-gray-900")}>
            <span className="flex items-center">
              <span className="text-blue-600 mr-2">+</span>
              New Research
            </span>
            {activeTab === 'new' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
          <button onClick={() => setActiveTab('ongoing')} className={cn("px-4 py-3 text-sm font-medium transition-all relative flex items-center", activeTab === 'ongoing' ? "text-blue-600" : "text-gray-600 hover:text-gray-900")}>
            <span className="w-4 h-4 rounded-full border-2 border-current mr-2 flex items-center justify-center">
              <span className="w-2 h-2 border-t-2 border-current rounded-full animate-spin" />
            </span>
            Ongoing
            {activeTab === 'ongoing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
          <button onClick={() => setActiveTab('completed')} className={cn("px-4 py-3 text-sm font-medium transition-all relative flex items-center", activeTab === 'completed' ? "text-blue-600" : "text-gray-600 hover:text-gray-900")}>
            <span className="w-4 h-4 rounded-full border-2 border-current mr-2 flex items-center justify-center">
              <span className="w-1.5 h-3 border-r-2 border-b-2 border-current rotate-45 -mt-0.5" />
            </span>
            Completed
            {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        </div>

        {/* Main Content - New Research Form */}
        {activeTab === 'new' && <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
            {/* Title with Icon */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Zap className="text-blue-600" size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#0F1C2E]">
                Start a New Deep Dive
              </h2>
            </div>

            {/* Research Topic */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                <span className="border-l-4 border-blue-600 pl-2">Research Topic</span>
              </label>
              <textarea value={researchTopic} onChange={e => setResearchTopic(e.target.value)} placeholder="e.g. Impact of solid state batteries on EV market by 2030..." className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-[#0F1C2E] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
            </div>

            {/* Upload Documents */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                Upload Documents (Optional)
              </label>
              <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={cn("border-2 border-dashed rounded-lg p-12 transition-all cursor-pointer hover:border-gray-400", dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white")}>
                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="text-gray-400" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      PDF, DOCX, DOC, TXT, MD (Max 50MB per file)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Depth & AI Model Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Target Depth */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  Target Depth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setTargetDepth('light')} className={cn("px-6 py-3 rounded-lg font-semibold transition-all", targetDepth === 'light' ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    Light
                  </button>
                  <button onClick={() => setTargetDepth('standard')} className={cn("px-6 py-3 rounded-lg font-semibold transition-all", targetDepth === 'standard' ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    Standard
                  </button>
                  <button onClick={() => setTargetDepth('deep')} className={cn("px-6 py-3 rounded-lg font-semibold transition-all", targetDepth === 'deep' ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    Deep
                  </button>
                </div>
              </div>

              {/* AI Model */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  AI Model
                </label>
                <select value={aiModel} onChange={e => setAiModel(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#0F1C2E] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="claude-3">Claude 3</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>
            </div>

            {/* Initialize Button */}
            <div className="flex justify-end pt-4">
              <button disabled={!researchTopic.trim()} className={cn("px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all", researchTopic.trim() ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                <span>Initialize Research Agent</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>}

        {/* Placeholder for Ongoing Tab */}
        {activeTab === 'ongoing' && <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-[#0F1C2E]">
                No Ongoing Research
              </h3>
              <p className="text-gray-600">
                Start a new research project to begin tracking its progress here.
              </p>
            </div>
          </div>}

        {/* Placeholder for Completed Tab */}
        {activeTab === 'completed' && <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-12 border-r-4 border-b-4 border-green-600 rotate-45 -mt-2" />
              </div>
              <h3 className="text-xl font-bold text-[#0F1C2E]">
                No Completed Research
              </h3>
              <p className="text-gray-600">
                Completed research projects will appear here for review and export.
              </p>
            </div>
          </div>}
      </div>
    </div>;
};