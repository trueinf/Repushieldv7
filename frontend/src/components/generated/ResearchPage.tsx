import React, { useState, useEffect } from 'react';
import { Zap, Upload, ArrowRight, Loader2, CheckCircle2, Clock, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { researchApi, type Research } from '../../services/researchApi';
import { DeepResearchPage } from './DeepResearchPage';
import { ResearchProgress } from './ResearchProgress';
import { ResearchReportPage } from './ResearchReportPage';

type TabType = 'new' | 'ongoing' | 'completed';
type DepthType = 'light' | 'standard' | 'deep';

export const ResearchPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [ongoingResearches, setOngoingResearches] = useState<Research[]>([]);
  const [completedResearches, setCompletedResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'deep' | 'progress' | 'report'>('list');

  useEffect(() => {
    if (activeTab === 'ongoing' || activeTab === 'completed') {
      loadResearches();
    }
  }, [activeTab]);

  const loadResearches = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ongoing') {
        const researches = await researchApi.getAllResearches('In Progress');
        setOngoingResearches(researches);
      } else if (activeTab === 'completed') {
        const researches = await researchApi.getAllResearches('Done');
        setCompletedResearches(researches);
      }
    } catch (error) {
      console.error('Error loading researches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartResearch = () => {
    setViewMode('deep');
  };

  const handleResearchCreated = (research: Research) => {
    setSelectedResearch(research);
    setViewMode('progress');
    setActiveTab('ongoing');
  };

  const handleResearchComplete = () => {
    setViewMode('report');
    loadResearches();
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedResearch(null);
    loadResearches();
  };

  if (viewMode === 'deep') {
    return (
      <DeepResearchPage
        onResearchCreated={handleResearchCreated}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  if (viewMode === 'progress' && selectedResearch) {
    return (
      <ResearchProgress
        researchId={selectedResearch.id}
        onComplete={handleResearchComplete}
        onCancel={handleBackToList}
      />
    );
  }

  if (viewMode === 'report' && selectedResearch) {
    return (
      <ResearchReportPage
        researchId={selectedResearch.id}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#0F1C2E]">Research Hub</h1>
          <p className="text-gray-600">
            Manage your deep dive investigations. Initiate new topics or track ongoing agentic workflows.
          </p>
        </div>

        <div className="flex items-center space-x-1 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all relative",
              activeTab === 'new' ? "text-[#1F9D8A]" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <span className="flex items-center">
              <span className="text-[#1F9D8A] mr-2">+</span>
              New Research
            </span>
            {activeTab === 'new' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F9D8A]" />}
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all relative flex items-center",
              activeTab === 'ongoing' ? "text-[#1F9D8A]" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <span className="w-4 h-4 rounded-full border-2 border-current mr-2 flex items-center justify-center">
              <span className="w-2 h-2 border-t-2 border-current rounded-full animate-spin" />
            </span>
            Ongoing
            {activeTab === 'ongoing' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F9D8A]" />}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-all relative flex items-center",
              activeTab === 'completed' ? "text-[#1F9D8A]" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <span className="w-4 h-4 rounded-full border-2 border-current mr-2 flex items-center justify-center">
              <CheckCircle2 size={12} className="text-current" />
            </span>
            Completed
            {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F9D8A]" />}
          </button>
        </div>

        {activeTab === 'new' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#1F9D8A]/10 rounded-lg flex items-center justify-center">
                <Zap className="text-[#1F9D8A]" size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#0F1C2E]">
                Start a New Deep Dive
              </h2>
            </div>

            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">
                Click the button below to start a comprehensive research project
              </p>
              <button
                onClick={handleStartResearch}
                className="px-8 py-3 bg-[#1F9D8A] hover:bg-[#1a8a7a] text-white font-semibold rounded-lg flex items-center space-x-2 transition-all shadow-md hover:shadow-lg mx-auto"
              >
                <span>Initialize Research Agent</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ongoing' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Loader2 size={32} className="animate-spin text-[#1F9D8A] mx-auto mb-4" />
                <p className="text-gray-600">Loading ongoing research...</p>
              </div>
            ) : ongoingResearches.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-[#1F9D8A]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1C2E] mb-2">
                  No Ongoing Research
                </h3>
                <p className="text-gray-600">
                  Start a new research project to begin tracking its progress here.
                </p>
              </div>
            ) : (
              ongoingResearches.map((research) => (
                <motion.div
                  key={research.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedResearch(research);
                    setViewMode('progress');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#0F1C2E] mb-2">
                        {research.topic}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {new Date(research.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Loader2 size={14} className="mr-1 animate-spin" />
                          Step {research.current_step} of {research.total_steps}
                        </span>
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                          {research.status}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-gray-400" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Loader2 size={32} className="animate-spin text-[#1F9D8A] mx-auto mb-4" />
                <p className="text-gray-600">Loading completed research...</p>
              </div>
            ) : completedResearches.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1C2E] mb-2">
                  No Completed Research
                </h3>
                <p className="text-gray-600">
                  Completed research projects will appear here for review and export.
                </p>
              </div>
            ) : (
              completedResearches.map((research) => (
                <motion.div
                  key={research.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedResearch(research);
                    setViewMode('report');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#0F1C2E] mb-2">
                        {research.topic}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FileText size={14} className="mr-1" />
                          {new Date(research.created_at).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          {research.status}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-gray-400" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
