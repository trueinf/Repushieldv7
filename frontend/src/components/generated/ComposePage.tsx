import React, { useState } from 'react';
import { Sparkles, X, ChevronDown, Plus, Minus, Shield, AlertTriangle, Target, TrendingUp, Copy, Check, Edit2, RefreshCw, Send, Save, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
type Platform = 'twitter' | 'news' | 'facebook' | 'linkedin' | 'reddit';
type Tone = 'neutral' | 'reassuring' | 'assertive' | 'empathetic' | 'authoritative' | 'defensive' | 'clarifying' | 'apologetic' | 'proactive';
type RiskLevel = 'low' | 'medium' | 'high';
interface Variation {
  id: number;
  content: string;
  wordCount: number;
  riskLevel: RiskLevel;
  narrativeScore: number;
  toneMatch: number;
  platformFit: number;
}
export const ComposePage = () => {
  const [contentIntent, setContentIntent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter']);
  const [wordCount, setWordCount] = useState(150);
  const [selectedTone, setSelectedTone] = useState<Tone>('neutral');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [variationCount, setVariationCount] = useState(3);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [activeVariation, setActiveVariation] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Advanced settings
  const [includeFacts, setIncludeFacts] = useState(false);
  const [avoidLegalRisk, setAvoidLegalRisk] = useState(true);
  const [alignBrandVoice, setAlignBrandVoice] = useState(true);
  const [crisisSafeMode, setCrisisSafeMode] = useState(false);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const platforms = [{
    id: 'twitter',
    label: 'X (Twitter)',
    icon: '𝕏'
  }, {
    id: 'news',
    label: 'News / Press',
    icon: '📰'
  }, {
    id: 'facebook',
    label: 'Facebook',
    icon: 'f'
  }, {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'in'
  }, {
    id: 'reddit',
    label: 'Reddit',
    icon: '🔴'
  }];
  const tones: {
    value: Tone;
    label: string;
  }[] = [{
    value: 'neutral',
    label: 'Neutral'
  }, {
    value: 'reassuring',
    label: 'Reassuring'
  }, {
    value: 'assertive',
    label: 'Assertive'
  }, {
    value: 'empathetic',
    label: 'Empathetic'
  }, {
    value: 'authoritative',
    label: 'Authoritative'
  }, {
    value: 'defensive',
    label: 'Defensive'
  }, {
    value: 'clarifying',
    label: 'Clarifying'
  }, {
    value: 'apologetic',
    label: 'Apologetic'
  }, {
    value: 'proactive',
    label: 'Proactive'
  }];
  const languages = [{
    value: 'english',
    label: 'English'
  }, {
    value: 'spanish',
    label: 'Spanish'
  }, {
    value: 'french',
    label: 'French'
  }, {
    value: 'german',
    label: 'German'
  }, {
    value: 'mandarin',
    label: 'Mandarin'
  }, {
    value: 'hindi',
    label: 'Hindi'
  }];
  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };
  const handleGenerate = () => {
    setIsGenerating(true);

    // Simulate API call with mock data
    setTimeout(() => {
      const mockVariations: Variation[] = [{
        id: 1,
        content: `We understand the concerns raised about our product reliability. Our engineering team has identified the root cause and implemented comprehensive fixes across all affected units. We're committed to delivering the quality our customers deserve.\n\nFull transparency: We've updated our QA process and extended warranties for impacted customers. Questions? Our support team is here 24/7.\n\n#CustomerFirst #QualityMatters`,
        wordCount: 58,
        riskLevel: 'low',
        narrativeScore: 92,
        toneMatch: 95,
        platformFit: 88
      }, {
        id: 2,
        content: `Recent reports about product issues have caught our attention. Here's what we're doing:\n\n✓ Root cause identified and resolved\n✓ All affected units being serviced\n✓ Extended warranty for peace of mind\n✓ Enhanced QA processes in place\n\nWe value your trust and are committed to making this right. Our team is available around the clock to address any questions.\n\n#Accountability #CustomerCare`,
        wordCount: 62,
        riskLevel: 'low',
        narrativeScore: 88,
        toneMatch: 90,
        platformFit: 91
      }, {
        id: 3,
        content: `We hear you. The reliability issues you've experienced fall short of our standards and yours. Here's our action plan:\n\n• Problem identified and fixed across all units\n• Free servicing for affected customers\n• Warranty extensions now active\n• Strengthened quality controls\n\nYour trust matters to us. We're here to answer questions and make things right. Contact us anytime.\n\n#QualityFirst #CustomerSupport`,
        wordCount: 60,
        riskLevel: 'low',
        narrativeScore: 85,
        toneMatch: 93,
        platformFit: 87
      }];
      setVariations(mockVariations);
      setActiveVariation(0);
      setIsGenerating(false);
    }, 2000);
  };
  const handleCopy = (variationId: number) => {
    const variation = variations.find(v => v.id === variationId);
    if (variation) {
      navigator.clipboard.writeText(variation.content);
      setCopiedId(variationId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
    }
  };
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  return <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="h-full flex flex-col">
        {/* Top Context Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="max-w-[1800px] mx-auto">
            <h1 className="text-2xl font-bold text-[#0F1C2E]">Compose</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create platform-specific, reputation-safe messaging
            </p>
          </div>
        </div>

        {/* Two-Column Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-8 max-w-[1800px] mx-auto w-full">
          {/* LEFT PANEL - Input & Controls */}
          <div className="space-y-6 overflow-y-auto pr-4">
            {/* Content Intent */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-[#1F9D8A] bg-opacity-10 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles className="text-[#1F9D8A]" size={20} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide mb-3">
                    What do you want to communicate?
                  </label>
                  <textarea value={contentIntent} onChange={e => setContentIntent(e.target.value)} placeholder="Describe the message, response, or narrative you want to create..." className="w-full h-40 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-[#0F1C2E] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent resize-none" />
                </div>
              </div>
            </div>

            {/* Platform Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                Platform Selection
              </label>
              <div className="flex flex-wrap gap-2">
                {platforms.map(platform => <button key={platform.id} onClick={() => togglePlatform(platform.id as Platform)} className={cn("px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2", selectedPlatforms.includes(platform.id as Platform) ? "bg-[#1F9D8A] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    <span>{platform.icon}</span>
                    <span>{platform.label}</span>
                  </button>)}
              </div>
            </div>

            {/* Word Count & Tone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Word Count */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  Word Count
                </label>
                <div className="space-y-3">
                  <input type="range" min="50" max="500" value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1F9D8A]" />
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button onClick={() => setWordCount(75)} className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                        Short
                      </button>
                      <button onClick={() => setWordCount(150)} className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                        Medium
                      </button>
                      <button onClick={() => setWordCount(300)} className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                        Long
                      </button>
                    </div>
                    <span className="text-lg font-bold text-[#0F1C2E]">{wordCount}</span>
                  </div>
                </div>
              </div>

              {/* Tone Selection */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  Tone
                </label>
                <select value={selectedTone} onChange={e => setSelectedTone(e.target.value as Tone)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-[#0F1C2E] focus:outline-none focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent appearance-none cursor-pointer" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}>
                  {tones.map(tone => <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>)}
                </select>
              </div>
            </div>

            {/* Language & Variations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  Language
                </label>
                <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-[#0F1C2E] focus:outline-none focus:ring-2 focus:ring-[#1F9D8A] focus:border-transparent appearance-none cursor-pointer" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}>
                  {languages.map(lang => <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>)}
                </select>
              </div>

              {/* Variations */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <label className="block text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  Variations
                </label>
                <div className="flex items-center justify-between">
                  <button onClick={() => setVariationCount(Math.max(1, variationCount - 1))} disabled={variationCount <= 1} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <Minus size={18} />
                  </button>
                  <span className="text-2xl font-bold text-[#0F1C2E]">{variationCount}</span>
                  <button onClick={() => setVariationCount(Math.min(5, variationCount + 1))} disabled={variationCount >= 5} className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Controls */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-bold text-[#0F1C2E] uppercase tracking-wide">
                  Advanced Controls
                </span>
                <ChevronDown size={20} className={cn("text-gray-400 transition-transform", showAdvanced && "transform rotate-180")} />
              </button>

              {showAdvanced && <div className="space-y-3 pt-2">
                  {[{
                label: 'Include facts / evidence',
                value: includeFacts,
                setter: setIncludeFacts
              }, {
                label: 'Avoid legal risk language',
                value: avoidLegalRisk,
                setter: setAvoidLegalRisk
              }, {
                label: 'Align with brand voice',
                value: alignBrandVoice,
                setter: setAlignBrandVoice
              }, {
                label: 'Crisis-safe mode',
                value: crisisSafeMode,
                setter: setCrisisSafeMode
              }, {
                label: 'Include hashtags',
                value: includeHashtags,
                setter: setIncludeHashtags
              }].map((item, index) => <label key={index} className="flex items-center space-x-3 cursor-pointer group">
                      <input type="checkbox" checked={item.value} onChange={e => item.setter(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#1F9D8A] focus:ring-[#1F9D8A] cursor-pointer" />
                      <span className="text-sm text-gray-700 group-hover:text-[#0F1C2E] transition-colors">
                        {item.label}
                      </span>
                    </label>)}
                </div>}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button onClick={handleGenerate} disabled={!contentIntent.trim() || isGenerating} className={cn("flex-1 px-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all", contentIntent.trim() && !isGenerating ? "bg-[#1F9D8A] hover:bg-[#1a8777] text-white shadow-md hover:shadow-lg" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                {isGenerating ? <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </> : <>
                    <Sparkles size={20} />
                    <span>Generate Content</span>
                  </>}
              </button>
              <button onClick={() => {
              setContentIntent('');
              setVariations([]);
            }} className="px-6 py-4 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                Clear
              </button>
            </div>
          </div>

          {/* RIGHT PANEL - Output & Iteration */}
          <div className="space-y-6 overflow-y-auto pl-4">
            {variations.length === 0 ? <div className="bg-white rounded-xl border border-gray-200 p-16 text-center h-full flex flex-col items-center justify-center">
                <div className="max-w-md space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F1C2E]">
                    Ready to Generate
                  </h3>
                  <p className="text-gray-600">
                    Fill in your content intent and parameters, then click "Generate Content" to create strategic messaging variations.
                  </p>
                </div>
              </div> : <>
                {/* Variation Tabs */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex border-b border-gray-200">
                    {variations.map((variation, index) => <button key={variation.id} onClick={() => setActiveVariation(index)} className={cn("flex-1 px-6 py-4 text-sm font-semibold transition-all relative", activeVariation === index ? "text-[#1F9D8A] bg-gray-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50")}>
                        Variation {index + 1}
                        {activeVariation === index && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1F9D8A]" />}
                      </button>)}
                  </div>

                  {/* Active Variation Content */}
                  {variations[activeVariation] && <div className="p-6 space-y-6">
                      {/* Header with Platform & Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-[#1F9D8A] bg-opacity-10 text-[#1F9D8A] text-xs font-bold rounded-full uppercase">
                            {selectedPlatforms[0]}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                            {selectedTone}
                          </span>
                          <span className="text-sm text-gray-500">
                            {variations[activeVariation].wordCount} words
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleCopy(variations[activeVariation].id)} className="p-2 text-gray-400 hover:text-[#1F9D8A] hover:bg-gray-100 rounded-lg transition-all">
                            {copiedId === variations[activeVariation].id ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                          </button>
                          <button className="p-2 text-gray-400 hover:text-[#1F9D8A] hover:bg-gray-100 rounded-lg transition-all">
                            <Edit2 size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-[#1F9D8A] hover:bg-gray-100 rounded-lg transition-all">
                            <RefreshCw size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Content Display */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-[#0F1C2E] whitespace-pre-wrap leading-relaxed">
                          {variations[activeVariation].content}
                        </p>
                      </div>

                      {/* Intelligence Indicators */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center">
                              <Shield size={14} className="mr-1.5" />
                              Risk Safety
                            </span>
                            <span className={cn("text-xs font-bold px-2 py-1 rounded-full uppercase", getRiskColor(variations[activeVariation].riskLevel))}>
                              {variations[activeVariation].riskLevel}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all", variations[activeVariation].riskLevel === 'low' ? 'bg-green-600' : variations[activeVariation].riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-red-600')} style={{
                        width: `${variations[activeVariation].riskLevel === 'low' ? 90 : variations[activeVariation].riskLevel === 'medium' ? 60 : 30}%`
                      }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center">
                              <Target size={14} className="mr-1.5" />
                              Narrative Alignment
                            </span>
                            <span className={cn("text-xs font-bold", getScoreColor(variations[activeVariation].narrativeScore))}>
                              {variations[activeVariation].narrativeScore}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1F9D8A] transition-all" style={{
                        width: `${variations[activeVariation].narrativeScore}%`
                      }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center">
                              <TrendingUp size={14} className="mr-1.5" />
                              Tone Match
                            </span>
                            <span className={cn("text-xs font-bold", getScoreColor(variations[activeVariation].toneMatch))}>
                              {variations[activeVariation].toneMatch}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1F9D8A] transition-all" style={{
                        width: `${variations[activeVariation].toneMatch}%`
                      }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Platform Fit
                            </span>
                            <span className={cn("text-xs font-bold", getScoreColor(variations[activeVariation].platformFit))}>
                              {variations[activeVariation].platformFit}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1F9D8A] transition-all" style={{
                        width: `${variations[activeVariation].platformFit}%`
                      }} />
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm">
                          Shorten
                        </button>
                        <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm">
                          Expand
                        </button>
                        <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm">
                          Change Tone
                        </button>
                        <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm">
                          Fact-check
                        </button>
                      </div>

                      {/* Primary Actions */}
                      <div className="flex space-x-3">
                        <button className="flex-1 px-6 py-3 bg-[#1F9D8A] hover:bg-[#1a8777] text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2">
                          <Save size={18} />
                          <span>Save to Library</span>
                        </button>
                        <button className="flex-1 px-6 py-3 bg-[#0F1C2E] hover:bg-[#1a2b3d] text-white font-semibold rounded-lg transition-all flex items-center justify-center space-x-2">
                          <Send size={18} />
                          <span>Send to Approval</span>
                        </button>
                      </div>
                    </div>}
                </div>
              </>}
          </div>
        </div>
      </div>
    </div>;
};