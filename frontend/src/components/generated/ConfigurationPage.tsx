import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, Flag, Briefcase, Check, ChevronRight, ChevronLeft, Twitter, Youtube, Facebook, Globe, Hash, Plus, X, AlertCircle, Sparkles, CheckCircle2, Edit2, Loader2, Play, Pause, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ConfigurationApi, type Configuration, type EntityType, type EntityDetails, type OntologyData, type PlatformConfig } from '../../services/configurationApi';
import { monitoringApi, type MonitoringStatus } from '../../services/monitoringApi';

// Types
type Step = 1 | 2 | 3 | 4 | 5;

// Components
const StepIndicator = ({
  currentStep,
  completedSteps
}: {
  currentStep: Step;
  completedSteps: Step[];
}) => {
  const steps = [{
    number: 1,
    label: 'Entity Type'
  }, {
    number: 2,
    label: 'Entity Details'
  }, {
    number: 3,
    label: 'Ontology'
  }, {
    number: 4,
    label: 'Platforms'
  }, {
    number: 5,
    label: 'Summary'
  }];
  return <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10">
          <motion.div className="h-full bg-[#1F9D8A]" initial={{
          width: '0%'
        }} animate={{
          width: `${(currentStep - 1) / 4 * 100}%`
        }} transition={{
          duration: 0.3
        }} />
        </div>

        {steps.map(step => {
        const isCompleted = completedSteps.includes(step.number as Step);
        const isCurrent = currentStep === step.number;
        const isPending = step.number > currentStep;
        return <div key={step.number} className="flex flex-col items-center">
              <motion.div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 border-2 transition-all", isCurrent && "bg-[#1F9D8A] border-[#1F9D8A] text-white scale-110 shadow-lg shadow-teal-500/30", isCompleted && "bg-[#1F9D8A] border-[#1F9D8A] text-white", isPending && "bg-white border-gray-200 text-gray-400")} whileHover={{
            scale: 1.05
          }}>
                {isCompleted && !isCurrent ? <Check size={20} /> : step.number}
              </motion.div>
              <span className={cn("text-xs font-medium text-center whitespace-nowrap", isCurrent && "text-[#0F1C2E] font-bold", isCompleted && !isCurrent && "text-[#1F9D8A]", isPending && "text-gray-400")}>
                {step.label}
              </span>
            </div>;
      })}
      </div>
    </div>;
};
const EntityTypeCard = ({
  type,
  icon: Icon,
  title,
  description,
  selected,
  onClick
}: {
  type: string;
  icon: React.ElementType;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) => <motion.button whileHover={{
  scale: 1.02,
  y: -4
}} whileTap={{
  scale: 0.98
}} onClick={onClick} className={cn("relative p-8 rounded-2xl border-2 transition-all text-left w-full group", selected ? "border-[#1F9D8A] bg-teal-50/50 shadow-lg shadow-teal-500/10" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md")}>
    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all", selected ? "bg-[#1F9D8A] text-white" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200")}>
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-bold text-[#0F1C2E] mb-2">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    
    {selected && <motion.div initial={{
    scale: 0
  }} animate={{
    scale: 1
  }} className="absolute top-4 right-4 w-8 h-8 bg-[#1F9D8A] rounded-full flex items-center justify-center text-white">
        <Check size={20} />
      </motion.div>}
  </motion.button>;
const ChipInput = ({
  value,
  onChange,
  placeholder,
  suggestions = []
}: {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const handleAdd = (text: string) => {
    if (text.trim() && !value.includes(text.trim())) {
      onChange([...value, text.trim()]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };
  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };
  const filteredSuggestions = suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s));
  return <div className="space-y-2">
      <div className="relative">
        <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-white min-h-[48px] focus-within:ring-2 focus-within:ring-[#1F9D8A] focus-within:border-[#1F9D8A]">
          {value.map((item, index) => <motion.span key={index} initial={{
          scale: 0
        }} animate={{
          scale: 1
        }} className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#1F9D8A] rounded-full text-sm font-medium">
              {item}
              <button onClick={() => handleRemove(index)} className="hover:bg-teal-100 rounded-full p-0.5 transition-colors">
                <X size={14} />
              </button>
            </motion.span>)}
          <input type="text" value={inputValue} onChange={e => {
          setInputValue(e.target.value);
          setShowSuggestions(true);
        }} onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd(inputValue);
          }
        }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder={value.length === 0 ? placeholder : ''} className="flex-1 min-w-[120px] outline-none text-sm" />
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <div className="p-2 space-y-1">
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500">
                <Sparkles size={12} />
                <span>AI Suggestions</span>
              </div>
              {filteredSuggestions.map((suggestion, index) => <button key={index} onClick={() => handleAdd(suggestion)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors">
                  {suggestion}
                </button>)}
            </div>
          </motion.div>}
      </div>
      <p className="text-xs text-gray-500">Press Enter to add keywords</p>
    </div>;
};
const PlatformCard = ({
  platform,
  icon: Icon,
  selected,
  onClick
}: {
  platform: string;
  icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
}) => <motion.button whileHover={{
  scale: 1.05
}} whileTap={{
  scale: 0.95
}} onClick={onClick} className={cn("p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 relative", selected ? "border-[#1F9D8A] bg-teal-50/50 shadow-md shadow-teal-500/10" : "border-gray-200 bg-white hover:border-gray-300")}>
    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", selected ? "bg-[#1F9D8A] text-white" : "bg-gray-100 text-gray-600")}>
      <Icon size={24} />
    </div>
    <span className="font-semibold text-sm text-[#0F1C2E]">{platform}</span>
    
    {selected && <motion.div initial={{
    scale: 0
  }} animate={{
    scale: 1
  }} className="absolute top-2 right-2 w-6 h-6 bg-[#1F9D8A] rounded-full flex items-center justify-center text-white">
        <Check size={14} />
      </motion.div>}
  </motion.button>;

// Main Component
export const ConfigurationPage = ({ onActivate }: { onActivate?: () => void }) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [entityDetails, setEntityDetails] = useState<EntityDetails>({
    name: '',
    alternateNames: [],
    description: '',
    handles: {
      twitter: [],
      youtube: [],
      facebook: [],
      website: []
    },
    spokespersons: [],
    leadership: [],
    abbreviations: []
  });
  const [ontology, setOntology] = useState<OntologyData>({
    coreKeywords: [],
    associatedKeywords: [],
    narrativeKeywords: [],
    exclusionKeywords: []
  });
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    platforms: [],
    options: {}
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  useEffect(() => {
    loadActiveConfiguration();
    loadMonitoringStatus();
  }, []);

  const loadMonitoringStatus = async () => {
    try {
      const status = await monitoringApi.getStatus();
      setMonitoringStatus(status);
    } catch (error) {
      console.error('Error loading monitoring status:', error);
    }
  };

  const handlePauseMonitoring = async () => {
    setMonitoringLoading(true);
    try {
      const status = await monitoringApi.pause();
      setMonitoringStatus(status);
    } catch (error) {
      console.error('Error pausing monitoring:', error);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const handleResumeMonitoring = async () => {
    setMonitoringLoading(true);
    try {
      const status = await monitoringApi.resume();
      setMonitoringStatus(status);
    } catch (error) {
      console.error('Error resuming monitoring:', error);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    setMonitoringLoading(true);
    try {
      const status = await monitoringApi.stop();
      setMonitoringStatus(status);
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    } finally {
      setMonitoringLoading(false);
    }
  };

  const loadActiveConfiguration = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await ConfigurationApi.getActive();
      if (config) {
        setConfigId(config.id);
        setEntityType(config.entityType);
        setEntityDetails(config.entityDetails);
        setOntology(config.ontology);
        setPlatformConfig(config.platformConfig);
        setCompletedSteps([1, 2, 3, 4, 5]);
        setCurrentStep(5);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
      console.error('Error loading configuration:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1 as Step);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1 as Step);
    }
  };
  const handleStepClick = (step: Step) => {
    if (completedSteps.includes(step) || step <= currentStep) {
      setCurrentStep(step);
    }
  };
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return entityType !== null;
      case 2:
        return entityDetails.name.trim() !== '';
      case 3:
        return ontology.coreKeywords.length > 0;
      case 4:
        return platformConfig.platforms.length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSave = async (activate: boolean = false) => {
    if (!entityType) {
      setError('Please select an entity type');
      return;
    }

    if (!entityDetails.name.trim()) {
      setError('Please enter an entity name');
      return;
    }

    if (ontology.coreKeywords.length === 0) {
      setError('Please add at least one core keyword');
      return;
    }

    if (platformConfig.platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const configData = {
        entityType: entityType as EntityType,
        entityDetails,
        ontology,
        platformConfig,
        isActive: activate,
      };

      let config: Configuration;
      if (configId) {
        config = await ConfigurationApi.update(configId, configData);
      } else {
        config = await ConfigurationApi.create(configData);
        setConfigId(config.id);
      }

      if (activate) {
        await ConfigurationApi.activate(config.id);
        setSuccess('Configuration activated successfully! Monitoring is now active. Fetching posts...');
        
        // Wait a moment to show success message, then navigate
        setTimeout(() => {
          if (onActivate) {
            onActivate();
          }
        }, 1500);
      } else {
        setSuccess('Configuration saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      console.error('Error saving configuration:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = () => handleSave(true);
  if (loading) {
    return <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="animate-spin text-[#1F9D8A] mx-auto mb-4" />
        <p className="text-gray-600">Loading configuration...</p>
      </div>
    </div>;
  }

  return <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0F1C2E] mb-3">
            Configuration Wizard
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Set up your entity and monitoring parameters in a few simple steps. 
            This configuration will power all intelligence across RepuShield.
          </p>
        </div>

        {/* Monitoring Control Panel */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0F1C2E] mb-1">Monitoring Control</h2>
              <p className="text-sm text-gray-500">Manage the automated post fetching scheduler</p>
            </div>
            {monitoringStatus && (
              <div className={cn(
                "px-4 py-2 rounded-lg font-semibold text-sm",
                monitoringStatus.status === 'running' && "bg-green-50 text-green-700",
                monitoringStatus.status === 'paused' && "bg-yellow-50 text-yellow-700",
                monitoringStatus.status === 'stopped' && "bg-red-50 text-red-700"
              )}>
                {monitoringStatus.status === 'running' && '● Running'}
                {monitoringStatus.status === 'paused' && '⏸ Paused'}
                {monitoringStatus.status === 'stopped' && '■ Stopped'}
              </div>
            )}
          </div>

          {monitoringStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Interval:</span>
                <span className="ml-2 font-semibold">{monitoringStatus.intervalMinutes} minutes</span>
              </div>
              <div>
                <span className="text-gray-500">Last Run:</span>
                <span className="ml-2 font-semibold">
                  {monitoringStatus.lastRunTime 
                    ? new Date(monitoringStatus.lastRunTime).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Next Run:</span>
                <span className="ml-2 font-semibold">
                  {monitoringStatus.nextRunTime 
                    ? new Date(monitoringStatus.nextRunTime).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {monitoringStatus?.status === 'running' ? (
              <button
                onClick={handlePauseMonitoring}
                disabled={monitoringLoading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {monitoringLoading ? <Loader2 size={16} className="animate-spin" /> : <Pause size={16} />}
                Pause Monitoring
              </button>
            ) : monitoringStatus?.status === 'paused' ? (
              <>
                <button
                  onClick={handleResumeMonitoring}
                  disabled={monitoringLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {monitoringLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Resume Monitoring
                </button>
                <button
                  onClick={handleStopMonitoring}
                  disabled={monitoringLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {monitoringLoading ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />}
                  Stop Monitoring
                </button>
              </>
            ) : (
              <button
                onClick={handleResumeMonitoring}
                disabled={monitoringLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {monitoringLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Start Monitoring
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </motion.div>}

        {/* Success Message */}
        {success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-800 mb-1">Success</h4>
            <p className="text-sm text-green-700">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </motion.div>}

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

        {/* Content Area */}
        <motion.div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12 min-h-[500px]" key={currentStep} initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: -20
      }} transition={{
        duration: 0.3
      }}>
          <AnimatePresence mode="wait">
            {/* Step 1: Entity Type */}
            {currentStep === 1 && <motion.div key="step1" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[#0F1C2E] mb-3">
                    Select Entity Type
                  </h2>
                  <p className="text-gray-600">
                    Choose the type of entity you want RepuShield to monitor and protect
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EntityTypeCard type="individual" icon={User} title="Individual" description="Monitor reputation for a person, executive, public figure, or influencer" selected={entityType === 'individual'} onClick={() => setEntityType('individual')} />
                  <EntityTypeCard type="political-party" icon={Flag} title="Political Party" description="Track narratives and sentiment around a political organization or movement" selected={entityType === 'political-party'} onClick={() => setEntityType('political-party')} />
                  <EntityTypeCard type="brand" icon={Briefcase} title="Brand" description="Protect and monitor your brand's reputation across all channels" selected={entityType === 'brand'} onClick={() => setEntityType('brand')} />
                  <EntityTypeCard type="organization" icon={Building2} title="Organization" description="Monitor reputation for NGOs, institutions, or corporate entities" selected={entityType === 'organization'} onClick={() => setEntityType('organization')} />
                </div>
              </motion.div>}

            {/* Step 2: Entity Details */}
            {currentStep === 2 && <motion.div key="step2" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[#0F1C2E] mb-3">
                    Entity Details
                  </h2>
                  <p className="text-gray-600">
                    Provide identifying information for the {entityType?.replace('-', ' ')}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#0F1C2E] mb-2">
                      Entity Name <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={entityDetails.name} onChange={e => setEntityDetails({
                  ...entityDetails,
                  name: e.target.value
                })} placeholder={entityType === 'individual' ? 'e.g., John Smith' : 'e.g., Acme Corporation'} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F9D8A] focus:border-[#1F9D8A] outline-none transition-all" />
                  </div>

                  {/* Alternate Names */}
                  <div>
                    <label className="block text-sm font-semibold text-[#0F1C2E] mb-2">
                      Alternate Names / Aliases
                    </label>
                    <ChipInput value={entityDetails.alternateNames} onChange={values => setEntityDetails({
                  ...entityDetails,
                  alternateNames: values
                })} placeholder="Add variations, nicknames, or common misspellings" suggestions={['Acme Corp', 'Acme Inc', 'ACME']} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-[#0F1C2E] mb-2">
                      Short Description
                    </label>
                    <textarea value={entityDetails.description} onChange={e => setEntityDetails({
                  ...entityDetails,
                  description: e.target.value
                })} placeholder="Brief description to help contextualize monitoring..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F9D8A] focus:border-[#1F9D8A] outline-none transition-all resize-none" />
                  </div>

                  {/* Social Handles */}
                  <div className="bg-teal-50/30 border border-teal-100 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash size={18} className="text-[#1F9D8A]" />
                      <h3 className="font-semibold text-[#0F1C2E]">Social & Digital Handles</h3>
                      <span className="text-xs text-gray-500 ml-auto">Optional but recommended</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Twitter size={14} className="text-blue-500" />
                          X (Twitter)
                        </label>
                        <ChipInput value={entityDetails.handles.twitter} onChange={values => setEntityDetails({
                      ...entityDetails,
                      handles: {
                        ...entityDetails.handles,
                        twitter: values
                      }
                    })} placeholder="@username" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Youtube size={14} className="text-red-500" />
                          YouTube
                        </label>
                        <ChipInput value={entityDetails.handles.youtube} onChange={values => setEntityDetails({
                      ...entityDetails,
                      handles: {
                        ...entityDetails.handles,
                        youtube: values
                      }
                    })} placeholder="Channel name or URL" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Facebook size={14} className="text-blue-600" />
                          Facebook
                        </label>
                        <ChipInput value={entityDetails.handles.facebook} onChange={values => setEntityDetails({
                      ...entityDetails,
                      handles: {
                        ...entityDetails.handles,
                        facebook: values
                      }
                    })} placeholder="Page name or URL" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Globe size={14} className="text-gray-600" />
                          Website(s)
                        </label>
                        <ChipInput value={entityDetails.handles.website} onChange={values => setEntityDetails({
                      ...entityDetails,
                      handles: {
                        ...entityDetails.handles,
                        website: values
                      }
                    })} placeholder="example.com" />
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="border-t border-gray-200 pt-6">
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-semibold text-[#1F9D8A] hover:text-teal-700 transition-colors">
                      <ChevronRight size={16} className={cn("transition-transform", showAdvanced && "rotate-90")} />
                      Advanced Options
                    </button>

                    {showAdvanced && <motion.div initial={{
                  height: 0,
                  opacity: 0
                }} animate={{
                  height: 'auto',
                  opacity: 1
                }} exit={{
                  height: 0,
                  opacity: 0
                }} className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Key Spokespersons
                          </label>
                          <ChipInput value={entityDetails.spokespersons} onChange={values => setEntityDetails({
                      ...entityDetails,
                      spokespersons: values
                    })} placeholder="Add spokesperson names" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Leadership Names
                          </label>
                          <ChipInput value={entityDetails.leadership} onChange={values => setEntityDetails({
                      ...entityDetails,
                      leadership: values
                    })} placeholder="Add leadership names" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Known Abbreviations
                          </label>
                          <ChipInput value={entityDetails.abbreviations} onChange={values => setEntityDetails({
                      ...entityDetails,
                      abbreviations: values
                    })} placeholder="Add abbreviations" />
                        </div>
                      </motion.div>}
                  </div>
                </div>
              </motion.div>}

            {/* Step 3: Ontology */}
            {currentStep === 3 && <motion.div key="step3" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[#0F1C2E] mb-3">
                    Define Your Ontology
                  </h2>
                  <p className="text-gray-600">
                    Keywords and phrases that RepuShield will track across all monitored platforms
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Core Keywords */}
                  <div className="bg-teal-50/30 border border-teal-100 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-[#1F9D8A]" />
                      <h3 className="font-bold text-[#0F1C2E]">Core Keywords</h3>
                      <span className="text-xs text-red-500 font-semibold ml-auto">Required</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Primary names, brands, and direct variations that must be monitored
                    </p>
                    <ChipInput value={ontology.coreKeywords} onChange={values => setOntology({
                  ...ontology,
                  coreKeywords: values
                })} placeholder="Add core keywords (e.g., brand name, entity name)" suggestions={[entityDetails.name, ...entityDetails.alternateNames].filter(Boolean)} />
                    
                    {ontology.coreKeywords.length === 0 && <div className="flex items-center gap-2 mt-3 text-xs text-amber-600">
                        <AlertCircle size={14} />
                        <span>At least one core keyword is required</span>
                      </div>}
                  </div>

                  {/* Associated Keywords */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-[#0F1C2E] mb-2">Associated Keywords</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Related terms like product names, campaigns, policies, or events
                    </p>
                    <ChipInput value={ontology.associatedKeywords} onChange={values => setOntology({
                  ...ontology,
                  associatedKeywords: values
                })} placeholder="Add associated keywords" suggestions={['product launch', 'quarterly results', 'new policy', 'campaign']} />
                  </div>

                  {/* Narrative & Risk Keywords */}
                  <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-6">
                    <h3 className="font-bold text-[#0F1C2E] mb-2">Narrative & Risk Keywords</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Negative framing terms, accusations, or crisis-related language to monitor
                    </p>
                    <ChipInput value={ontology.narrativeKeywords} onChange={values => setOntology({
                  ...ontology,
                  narrativeKeywords: values
                })} placeholder="Add risk keywords" suggestions={['scandal', 'controversy', 'lawsuit', 'fraud', 'crisis', 'failure']} />
                  </div>

                  {/* Exclusion Keywords */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-[#0F1C2E] mb-2">Exclusion Keywords</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Terms to filter out irrelevant contexts and reduce noise
                    </p>
                    <ChipInput value={ontology.exclusionKeywords} onChange={values => setOntology({
                  ...ontology,
                  exclusionKeywords: values
                })} placeholder="Add exclusion keywords" />
                  </div>

                  {/* Coverage Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-[#0F1C2E] mb-1">Coverage Analysis</h4>
                        <p className="text-sm text-gray-600">
                          {ontology.coreKeywords.length + ontology.associatedKeywords.length < 5 && "Your ontology might be too narrow. Consider adding more variations and related terms."}
                          {ontology.coreKeywords.length + ontology.associatedKeywords.length >= 5 && ontology.coreKeywords.length + ontology.associatedKeywords.length <= 20 && "Good coverage! Your ontology has a balanced scope for effective monitoring."}
                          {ontology.coreKeywords.length + ontology.associatedKeywords.length > 20 && "Your ontology is quite broad. This may result in higher data volume and noise."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>}

            {/* Step 4: Platforms */}
            {currentStep === 4 && <motion.div key="step4" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[#0F1C2E] mb-3">
                    Select Platforms to Monitor
                  </h2>
                  <p className="text-gray-600">
                    Choose where RepuShield should track conversations and narratives
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                  {[{
                id: 'youtube',
                name: 'YouTube',
                icon: Youtube
              }, {
                id: 'twitter',
                name: 'X (Twitter)',
                icon: Twitter
              }, {
                id: 'news',
                name: 'News',
                icon: Globe
              }, {
                id: 'facebook',
                name: 'Facebook',
                icon: Facebook
              }, {
                id: 'reddit',
                name: 'Reddit',
                icon: Hash
              }].map(platform => <PlatformCard key={platform.id} platform={platform.name} icon={platform.icon} selected={platformConfig.platforms.includes(platform.id)} onClick={() => {
                const isSelected = platformConfig.platforms.includes(platform.id);
                setPlatformConfig({
                  ...platformConfig,
                  platforms: isSelected ? platformConfig.platforms.filter(p => p !== platform.id) : [...platformConfig.platforms, platform.id]
                });
              }} />)}
                </div>

                {platformConfig.platforms.length > 0 && <motion.div initial={{
              opacity: 0,
              y: 10
            }} animate={{
              opacity: 1,
              y: 0
            }} className="border border-gray-200 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-[#0F1C2E] mb-4">Platform Options</h3>
                    
                    {platformConfig.platforms.map(platform => <div key={platform} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm text-[#0F1C2E] mb-3 capitalize">
                          {platform === 'twitter' ? 'X (Twitter)' : platform} Settings
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Language Filters
                            </label>
                            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F9D8A] focus:border-[#1F9D8A] outline-none">
                              <option>All Languages</option>
                              <option>English</option>
                              <option>Spanish</option>
                              <option>French</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Region Focus
                            </label>
                            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F9D8A] focus:border-[#1F9D8A] outline-none">
                              <option>Global</option>
                              <option>North America</option>
                              <option>Europe</option>
                              <option>Asia Pacific</option>
                            </select>
                          </div>
                        </div>

                        {platform === 'news' && <div className="mt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 text-[#1F9D8A] border-gray-300 rounded focus:ring-[#1F9D8A]" />
                              <span className="text-sm text-gray-700">Verified sources only</span>
                            </label>
                          </div>}
                      </div>)}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm text-[#0F1C2E] mb-1">
                            Estimated Data Volume
                          </h4>
                          <p className="text-xs text-gray-600">
                            Based on your selections, expect ~{platformConfig.platforms.length * 1000}-
                            {platformConfig.platforms.length * 2000} mentions per day
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>}
              </motion.div>}

            {/* Step 5: Summary */}
            {currentStep === 5 && <motion.div key="step5" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} className="space-y-6">
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-[#1F9D8A]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F1C2E] mb-3">
                    Configuration Summary
                  </h2>
                  <p className="text-gray-600">
                    Review your settings before activating monitoring
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Entity Overview */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#0F1C2E]">Entity Overview</h3>
                      <button onClick={() => setCurrentStep(2)} className="text-[#1F9D8A] hover:text-teal-700 text-sm font-semibold flex items-center gap-1">
                        <Edit2 size={14} />
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Entity Type</p>
                        <p className="font-semibold capitalize">{entityType?.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Entity Name</p>
                        <p className="font-semibold">{entityDetails.name}</p>
                      </div>
                      {entityDetails.alternateNames.length > 0 && <div className="col-span-2">
                          <p className="text-gray-500 mb-2">Alternate Names</p>
                          <div className="flex flex-wrap gap-2">
                            {entityDetails.alternateNames.map((name, i) => <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {name}
                              </span>)}
                          </div>
                        </div>}
                    </div>
                  </div>

                  {/* Ontology Overview */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#0F1C2E]">Ontology Overview</h3>
                      <button onClick={() => setCurrentStep(3)} className="text-[#1F9D8A] hover:text-teal-700 text-sm font-semibold flex items-center gap-1">
                        <Edit2 size={14} />
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div className="text-center p-3 bg-teal-50 rounded-lg">
                        <p className="text-2xl font-bold text-[#1F9D8A]">{ontology.coreKeywords.length}</p>
                        <p className="text-gray-600 text-xs mt-1">Core Keywords</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-[#0F1C2E]">{ontology.associatedKeywords.length}</p>
                        <p className="text-gray-600 text-xs mt-1">Associated</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">{ontology.narrativeKeywords.length}</p>
                        <p className="text-gray-600 text-xs mt-1">Risk Terms</p>
                      </div>
                    </div>
                    {ontology.coreKeywords.length > 0 && <div>
                        <p className="text-gray-500 text-xs mb-2">Key Monitored Themes</p>
                        <div className="flex flex-wrap gap-2">
                          {[...ontology.coreKeywords, ...ontology.associatedKeywords].slice(0, 8).map((keyword, i) => <span key={i} className="px-3 py-1 bg-teal-50 text-[#1F9D8A] rounded-full text-xs font-medium">
                              {keyword}
                            </span>)}
                          {ontology.coreKeywords.length + ontology.associatedKeywords.length > 8 && <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{ontology.coreKeywords.length + ontology.associatedKeywords.length - 8} more
                            </span>}
                        </div>
                      </div>}
                  </div>

                  {/* Platform Coverage */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-[#0F1C2E]">Platform Coverage</h3>
                      <button onClick={() => setCurrentStep(4)} className="text-[#1F9D8A] hover:text-teal-700 text-sm font-semibold flex items-center gap-1">
                        <Edit2 size={14} />
                        Edit
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {platformConfig.platforms.map(platform => <div key={platform} className="px-4 py-2 bg-teal-50 text-[#1F9D8A] rounded-lg text-sm font-semibold capitalize flex items-center gap-2">
                          <Check size={16} />
                          {platform === 'twitter' ? 'X (Twitter)' : platform}
                        </div>)}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Estimated Volume:</span> ~
                        {platformConfig.platforms.length * 1000}-{platformConfig.platforms.length * 2000} mentions/day
                      </p>
                    </div>
                  </div>

                  {/* Confidence Message */}
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={24} className="text-[#1F9D8A] mt-0.5" />
                      <div>
                        <h4 className="font-bold text-[#0F1C2E] mb-2">Ready to Activate</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Your configuration is complete and optimized for effective monitoring. 
                          RepuShield will begin tracking narratives and sentiment across all selected platforms.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 max-w-6xl mx-auto">
          <button onClick={handleBack} disabled={currentStep === 1} className={cn("px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2", currentStep === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-200 text-[#0F1C2E] hover:bg-gray-50 hover:border-gray-300")}>
            <ChevronLeft size={20} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {currentStep === 5 && configId && (
              <button 
                onClick={() => handleSave(false)} 
                disabled={saving}
                className={cn("px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 border-2", saving ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : "bg-white border-[#1F9D8A] text-[#1F9D8A] hover:bg-teal-50")}
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Edit2 size={20} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            
            {currentStep < 5 ? (
              <button onClick={handleNext} disabled={!canProceed() || saving} className={cn("px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2", canProceed() && !saving ? "bg-[#1F9D8A] text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                {saving ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} />}
                Next
              </button>
            ) : (
              <button onClick={handleActivate} disabled={saving} className={cn("px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2", saving ? "bg-gray-400 cursor-not-allowed" : "bg-[#1F9D8A] text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20")}>
                {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                {saving ? 'Activating...' : 'Activate Monitoring'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>;
};