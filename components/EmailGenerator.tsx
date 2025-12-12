
import React, { useState, useEffect } from 'react';
import { ContractAnalysis, NegotiationTone, UserIdentity, VaultContract } from '../types';
import { generateEmailDraft, refineEmailDraft } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { Mail, Copy, Check, Loader2, RefreshCw, Send, Sparkles, Edit3, Flame, Save, MessageSquare, Briefcase, Smile, Zap, Scale, HandMetal, PenTool, Info } from 'lucide-react';

interface EmailGeneratorProps {
  contract: ContractAnalysis;
  identity: UserIdentity;
  tone: NegotiationTone;
  onPractice: (context: string) => void;
}

const EXTENDED_TONES = [
    { id: 'Professional', icon: Briefcase, label: 'Professional' },
    { id: 'Polite', icon: Smile, label: 'Friendly & Polite' },
    { id: 'Assertive', icon: Scale, label: 'Firm / Assertive' },
    { id: 'Urgent', icon: Zap, label: 'Urgent / Deadline' },
    { id: 'Aggressive', icon: HandMetal, label: 'Hardball / Legal' },
    { id: 'Persuasive', icon: Sparkles, label: 'Persuasive' },
    { id: 'Custom', icon: PenTool, label: 'Custom...' },
];

const EmailGenerator: React.FC<EmailGeneratorProps> = ({ contract, identity, tone: initialTone, onPractice }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Tone State
  const [selectedToneId, setSelectedToneId] = useState<string>(initialTone.toString().split(' ')[0]); // Rough mapping
  const [customTone, setCustomTone] = useState('');
  
  const [aggressionLevel, setAggressionLevel] = useState<number>(5);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');

  // Load draft if it exists
  useEffect(() => {
      if (contract.id) {
          const fullContract = StorageService.getContractById(contract.id);
          if (fullContract && fullContract.savedDraft) {
              setSubject(fullContract.savedDraft.subject);
              setBody(fullContract.savedDraft.body);
          }
      }
  }, [contract.id]);

  const intents = [
    { label: 'Renegotiate Price', value: 'Negotiate a lower price or better payment terms' },
    { label: 'Cancel Contract', value: 'Cancel the contract immediately with minimal penalty' },
    { label: 'Clarify Terms', value: 'Ask for clarification on specific vague clauses' },
    { label: 'Dispute Charge', value: 'Dispute a specific unfair charge' },
  ];

  const getEffectiveTone = () => {
      if (selectedToneId === 'Custom') return customTone || 'Professional';
      // Find label or just use ID
      const t = EXTENDED_TONES.find(t => t.id === selectedToneId);
      return t ? t.label : selectedToneId;
  };

  const handleGenerate = async (intent: string) => {
    setActiveIntent(intent);
    setIsGenerating(true);
    setSaved(false);
    
    const toneToUse = getEffectiveTone();

    try {
      const draft = await generateEmailDraft(
        contract.summary,
        contract.providerName || 'The Provider',
        intent,
        identity,
        toneToUse,
        aggressionLevel
      );
      setSubject(draft.subject);
      setBody(draft.body);
    } catch (error) {
      setBody("Error generating email. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
      if (!refineInstruction.trim() || !body) return;
      setIsRefining(true);
      setSaved(false);
      try {
          const refined = await refineEmailDraft(subject, body, refineInstruction, getEffectiveTone());
          setSubject(refined.subject);
          setBody(refined.body);
          setRefineInstruction('');
      } catch (error) {
          console.error(error);
      } finally {
          setIsRefining(false);
      }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
      if (!contract.id) return;
      const fullContract = StorageService.getContractById(contract.id);
      if (fullContract) {
          fullContract.savedDraft = {
              subject,
              body,
              updatedAt: Date.now()
          };
          StorageService.updateContract(fullContract);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
      }
  };

  const handlePracticeClick = () => {
      const context = `
        User Intent: ${activeIntent || 'General Negotiation'}
        Draft Email Subject: ${subject}
        Draft Email Body: ${body}
        Desired Tone: ${getEffectiveTone()}
        
        The user wants to roleplay the scenario where they send this email or follow up on it with a call.
      `;
      onPractice(context);
  };

  const getAggressionLabel = (level: number) => {
      if (level <= 3) return 'Diplomatic';
      if (level <= 7) return 'Assertive';
      return 'Hostile/Legal Action';
  };
  
  const getAggressionDescription = (level: number) => {
      if (level <= 3) return "Polite and cooperative. Best for maintaining good relationships while asking for favours.";
      if (level <= 7) return "Firm and professional. Clearly states dissatisfaction and sets expectations without being rude.";
      return "Maximum pressure. Cites specific laws (CPA), threatens escalation to Ombudsman, and demands immediate action.";
  };

  const getAggressionColor = (level: number) => {
      if (level <= 3) return 'from-emerald-400 to-emerald-600';
      if (level <= 7) return 'from-amber-400 to-amber-600';
      return 'from-rose-500 to-rose-700';
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      {/* Top Bar */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Mail className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Auto-Writer</h3>
                    <p className="text-sm text-slate-500">Draft a formal response to {contract.providerName}</p>
                </div>
            </div>
        </div>

        {/* Tone Selection Chips */}
        <div className="mb-6 overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex gap-2">
                {EXTENDED_TONES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedToneId(t.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedToneId === t.id 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>
            
            {/* Custom Tone Input */}
            {selectedToneId === 'Custom' && (
                <div className="mt-3 animate-fade-in-down">
                    <input 
                        type="text"
                        value={customTone}
                        onChange={(e) => setCustomTone(e.target.value)}
                        placeholder="Describe your desired tone (e.g., 'Disappointed but willing to stay if discount given')..."
                        className="w-full px-4 py-2 text-sm border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30"
                        autoFocus
                    />
                </div>
            )}
        </div>

        {/* Controls Section */}
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Flame className={`w-4 h-4 ${aggressionLevel > 7 ? 'text-rose-500' : 'text-slate-400'}`} />
                        Intensity
                    </label>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full text-white bg-gradient-to-r ${getAggressionColor(aggressionLevel)} shadow-md`}>
                        {aggressionLevel}/10 • {getAggressionLabel(aggressionLevel)}
                    </span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="1" 
                    value={aggressionLevel} 
                    onChange={(e) => setAggressionLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700"
                />
                <p className="mt-3 text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>
                        <span className="font-bold text-slate-700 block mb-0.5">Effect:</span> 
                        {getAggressionDescription(aggressionLevel)}
                    </span>
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {intents.map((intent) => (
                <button
                    key={intent.label}
                    onClick={() => handleGenerate(intent.value)}
                    disabled={isGenerating || isRefining}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${
                    activeIntent === intent.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                    {intent.label}
                </button>
                ))}
            </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="p-6 bg-slate-50/50">
        <div className="relative">
            {isGenerating ? (
            <div className="h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-inner">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                <span className="text-slate-900 font-bold text-lg">Drafting Response...</span>
                <span className="text-slate-400 text-sm mt-1">Analyzing tone and intent</span>
            </div>
            ) : body ? (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden ring-4 ring-slate-50">
                {/* Modern Email Client Header */}
                <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                             <span className="text-xs font-bold">To</span>
                        </div>
                        <div className="text-sm font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                            {contract.providerName || 'Provider'}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 flex items-center justify-center text-slate-400">
                             <span className="text-[10px] font-bold uppercase tracking-wider">Subj</span>
                         </div>
                         <input 
                            type="text" 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder-slate-300 border-b border-transparent focus:border-blue-200 transition-colors py-1"
                            placeholder="Subject Line"
                         />
                    </div>
                </div>

                {/* Body */}
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-80 p-6 text-sm text-slate-700 leading-loose focus:outline-none resize-none font-sans bg-white"
                />

                {/* Toolbar */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                     {/* AI Refine Tool */}
                     <div className="w-full md:flex-1 relative group">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                         </div>
                         <input 
                            type="text" 
                            value={refineInstruction}
                            onChange={(e) => setRefineInstruction(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                            placeholder="Ask AI to adjust (e.g. 'Make it shorter')" 
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none bg-white transition-shadow shadow-sm focus:shadow-md"
                         />
                         <button 
                            onClick={handleRefine}
                            disabled={isRefining || !refineInstruction}
                            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                         >
                             {isRefining ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                         </button>
                     </div>

                     <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button 
                            onClick={handlePracticeClick}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 text-xs font-bold uppercase tracking-wide"
                        >
                            <MessageSquare className="w-4 h-4" /> Practice Negotiation
                        </button>
                         <button
                            onClick={handleSaveDraft}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all"
                            title="Save Draft"
                        >
                            {saved ? <Check className="w-5 h-5 text-emerald-500" /> : <Save className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => handleGenerate(activeIntent!)}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all"
                            title="Regenerate"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 text-sm font-bold"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy Text'}
                        </button>
                     </div>
                </div>
            </div>
            ) : (
            <div className="h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-300 group hover:border-blue-400 hover:text-blue-400 transition-colors cursor-default">
                <Edit3 className="w-12 h-12 mb-4 opacity-50 group-hover:scale-110 transition-transform" />
                <p className="text-lg font-medium">Select an intent above to start writing.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EmailGenerator;
