
import React, { useState, useRef, useEffect } from 'react';
import { analyzeContractImage, analyzeContractText, translateContractAnalysis, adaptSummary } from './services/geminiService';
import { StorageService } from './services/storageService';
import { ContractAnalysis, ViewState, RiskLevel, VaultContract, UserIdentity, NegotiationTone, IntegrationStatus } from './types';
import NegotiationCoach from './components/NegotiationCoach';
import VaultDashboard from './components/VaultDashboard';
import CompanySearch from './components/CompanySearch';
import ContractChat from './components/ContractChat';
import EmailGenerator from './components/EmailGenerator';
import CommunityHub from './components/CommunityHub';
import ProductTour from './components/ProductTour';
import { useLanguage, Language } from './contexts/LanguageContext';
import { DEMO_SCENARIOS, LEGAL_MYTHS } from './constants';
import { 
  ShieldCheck, 
  UploadCloud, 
  FileSearch, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Camera, 
  Lock,
  MessageSquare,
  ArrowLeft,
  Globe,
  ExternalLink,
  WifiOff,
  Home,
  Search as SearchIcon,
  LayoutDashboard,
  Save,
  Shield,
  Settings,
  UserCircle,
  EyeOff,
  Info,
  History,
  GitBranch,
  ArrowUpRight,
  Scale,
  ChevronDown,
  X,
  FileText,
  Zap,
  Menu,
  BookOpen,
  Bot,
  ClipboardType,
  Minus,
  Sparkles,
  HelpCircle,
  BrainCircuit,
  Lightbulb,
  Users,
  Calendar,
  HardDrive,
  MessageCircle,
  CreditCard,
  Download,
  Trash2,
  Play,
  Languages,
  Baby,
  Gavel,
  Briefcase
} from 'lucide-react';

// --- Sidebar Component ---
const Sidebar = ({ view, onViewChange, onToggleChat, isMobileOpen, setIsMobileOpen }: { 
    view: ViewState, 
    onViewChange: (v: ViewState) => void, 
    onToggleChat: () => void,
    isMobileOpen: boolean,
    setIsMobileOpen: (v: boolean) => void
}) => {
    const { t, language, setLanguage } = useLanguage();

    const navItems = [
        { id: ViewState.HOME, label: t('nav_home'), icon: Home },
        { id: ViewState.VAULT_DASHBOARD, label: t('nav_vault'), icon: LayoutDashboard },
        { id: ViewState.SCAN_UPLOAD, label: t('nav_analyze'), icon: ShieldCheck },
        { id: ViewState.COMMUNITY, label: t('nav_community'), icon: Users },
        { id: ViewState.COMPANY_SEARCH, label: t('nav_search'), icon: SearchIcon },
        { id: ViewState.EDUCATION, label: t('nav_resources'), icon: BookOpen },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            } flex flex-col shadow-2xl`}>
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Contract<span className="text-blue-400">Guard</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onViewChange(item.id);
                                setIsMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                                view === item.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}

                    <div className="my-6 border-t border-slate-800 pt-6">
                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('nav_concierge')}</p>
                        <button 
                            onClick={() => {
                                onToggleChat();
                                setIsMobileOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-emerald-400 hover:bg-slate-800 transition-all"
                        >
                            <Bot className="w-5 h-5" />
                            {t('nav_ask')}
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-4">
                    {/* Language Switcher in Sidebar */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                            className="bg-transparent text-sm font-bold text-slate-200 border-none outline-none cursor-pointer w-full"
                        >
                            <option value="en">English</option>
                            <option value="zu">isiZulu</option>
                            <option value="af">Afrikaans</option>
                        </select>
                    </div>

                    <button onClick={() => onViewChange(ViewState.SETTINGS)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all w-full">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <Settings className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold">{t('nav_settings')}</p>
                            <p className="text-[10px]">Integrations & Data</p>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
};

const Hero = ({ onStart, onWatchDemo }: { onStart: (path: 'scan' | 'vault' | 'community') => void, onWatchDemo: () => void }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-24 max-w-4xl mx-auto text-center relative overflow-hidden px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide mb-8 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        {t('hero_badge')}
      </div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
        {t('hero_title_1')} <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">{t('hero_title_2')}</span>
      </h1>
      
      <p className="text-base md:text-lg text-slate-600 mb-10 max-w-xl leading-relaxed mx-auto font-medium">
        {t('hero_desc')}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
        <button 
          onClick={() => onStart('scan')}
          className="flex-1 group relative overflow-hidden rounded-2xl bg-blue-600 p-[1px] shadow-2xl shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-1"
        >
          <div className="relative flex items-center justify-center gap-3 h-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-4 rounded-2xl">
             <FileSearch className="w-5 h-5 text-white/90" />
             <span className="font-bold text-white text-base tracking-wide">{t('btn_scan')}</span>
          </div>
        </button>

        <button 
          onClick={onWatchDemo}
          className="flex-1 group relative overflow-hidden rounded-2xl bg-white p-[1px] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all hover:bg-slate-50 hover:-translate-y-1"
        >
          <div className="relative flex items-center justify-center gap-3 h-full px-6 py-4">
             <Play className="w-5 h-5 text-slate-700 fill-slate-200" />
             <span className="font-bold text-slate-800 text-base tracking-wide">{t('btn_demo')}</span>
          </div>
        </button>
      </div>
      
      <div className="mt-12 flex flex-wrap justify-center gap-6 text-slate-500 text-xs font-semibold">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-slate-100"><Shield className="w-3 h-3 text-emerald-500" /> {t('badge_cpa')}</span>
          <span className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-slate-100"><Lock className="w-3 h-3 text-indigo-500" /> {t('badge_secure')}</span>
      </div>
    </div>
  );
};

// ... AnalysisLoading, ConfidenceBar, RiskGauge, ErrorBanner, LegalResourceCard ...
// Note: LegalResourceCard is updated inline below in the main App component logic if needed, 
// but since it's a constant export in types or local component, we can leave it.
// Actually, let's keep the existing helpers and focus on the main APP Logic updates.

const AnalysisLoading = () => {
    const { t } = useLanguage();
    const [stage, setStage] = useState(0);
    const stages = [
        "Processing Document OCR...",
        "Executing Financial Code Logic...",
        "Identifying Legal Clauses...",
        "Cross-Referencing CPA & NCA...",
        "Calculating Risk Score...",
        "Detecting Hidden Traps...",
        "Finalizing Strategy..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
        }, 1500); // Change stage every 1.5 seconds
        return () => clearInterval(interval);
    }, []);

    const progress = Math.min(((stage + 1) / stages.length) * 100, 100);

    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center min-h-[60vh]">
            <div className="relative w-32 h-32 mb-10">
            <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
            <div 
                className="absolute inset-0 border-[6px] border-blue-600 rounded-full border-t-transparent animate-spin" 
                style={{ animationDuration: '1.5s' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-12 h-12 text-blue-600 animate-pulse fill-blue-100" />
            </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">{t('loading_reasoning')}</h2>
            <p className="text-blue-600 font-bold mb-8 text-lg animate-pulse">{stages[stage]}</p>
            
            <div className="space-y-4 w-full max-w-sm mx-auto bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Analysis Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
                {stages.map((s, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${i <= stage ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {i <= stage ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200"></div>}
                        {s.split('...')[0]}
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
};

const ConfidenceBar = ({ score }: { score: number }) => {
    let color = 'bg-slate-300';
    if (score >= 90) color = 'bg-emerald-500';
    else if (score >= 70) color = 'bg-blue-500';
    else if (score >= 50) color = 'bg-amber-400';
    else color = 'bg-rose-400';

    return (
        <div className="flex items-center gap-2 mt-2" title={`AI Confidence: ${score}%`}>
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{score}% AI Confidence</span>
        </div>
    );
};

const RiskGauge = ({ score }: { score: number }) => {
  const getColor = (s: number) => {
    if (s < 30) return 'text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (s < 70) return 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]';
    return 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]';
  };
  
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="80" cy="80" r="70" stroke="#334155" strokeWidth="12" fill="transparent" opacity="0.2" />
        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * score) / 100} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${getColor(score)}`} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-black ${getColor(score)}`}>{score}</span>
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Risk Score</span>
      </div>
    </div>
  );
};

const ErrorBanner = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-bounce-in">
    <div className="bg-white border border-rose-100 rounded-2xl shadow-2xl p-5 flex items-start gap-4 ring-4 ring-rose-50/50">
      <div className="bg-rose-100 p-2 rounded-full flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900">Unable to Process</h3>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// Updated LegalResourceCard with REAL Links
const LegalResourceCard = ({ contractType, riskScore }: { contractType: string, riskScore: number }) => {
    if (riskScore < 50) return null;

    const lowerType = contractType.toLowerCase();
    let body = { name: 'National Consumer Commission', url: 'https://www.thencc.gov.za/' };
    
    if (lowerType.includes('rent') || lowerType.includes('lease')) {
        body = { name: 'Rental Housing Tribunal', url: 'https://www.dhs.gov.za/content/rental-housing-tribunal' };
    } else if (lowerType.includes('credit') || lowerType.includes('loan')) {
        body = { name: 'National Credit Regulator', url: 'https://www.ncr.org.za/' };
    } else if (lowerType.includes('employment') || lowerType.includes('work')) {
        body = { name: 'CCMA', url: 'https://www.ccma.org.za/' };
    } else if (lowerType.includes('goods') || lowerType.includes('service') || lowerType.includes('gym')) {
        body = { name: 'Consumer Goods & Services Ombud', url: 'https://www.cgso.org.za/' };
    }

    return (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-rose-500/20 transition-colors"></div>
            
            <h3 className="font-bold flex items-center gap-2 mb-3 text-lg relative z-10">
                <Scale className="w-5 h-5 text-rose-400" />
                Legal Recourse
            </h3>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed relative z-10">
                This contract has high-risk clauses. You can escalate disputes to the <b className="text-white">{body.name}</b>.
            </p>
            <a 
                href={body.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-xs font-bold bg-white text-slate-900 px-4 py-2.5 rounded-lg hover:bg-slate-200 transition-colors relative z-10 shadow-lg"
            >
                Visit Official Website <ArrowUpRight className="w-3 h-3 ml-2" />
            </a>
        </div>
    );
};

// ... createThumbnail, MythbusterCard ...
const createThumbnail = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
        if (file.type === 'application/pdf') {
            resolve('PDF');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(undefined);
                    return;
                }
                const scale = 200 / img.width;
                canvas.width = 200;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

const MythbusterCard = ({ myth, fact, isTrue }: { myth: string, fact: string, isTrue: boolean }) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <div 
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer group perspective-1000 h-64 w-full"
        >
            <div className={`relative w-full h-full transition-all duration-700 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <HelpCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">"{myth}"</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-4 animate-pulse">Tap to Reveal Truth</p>
                </div>
                
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden bg-slate-900 rotate-y-180 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isTrue ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {isTrue ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                    <h3 className={`font-black text-xl mb-2 ${isTrue ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isTrue ? 'TRUE' : 'MYTH BUSTED'}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{fact}</p>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const { t, language, setLanguage } = useLanguage(); 
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [analysis, setAnalysis] = useState<VaultContract | null>(null); 
  const [file, setFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [versionParentId, setVersionParentId] = useState<string | null>(null); 
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Demo State
  const [showDemo, setShowDemo] = useState(false);

  // Negotiation State
  const [negotiationContext, setNegotiationContext] = useState<string>('');

  // Settings State
  const [userIdentity, setUserIdentity] = useState<UserIdentity>(UserIdentity.CONSUMER);
  const [negotiationTone, setNegotiationTone] = useState<NegotiationTone>(NegotiationTone.POLITE);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
      { id: 'drive', name: 'Google Drive', icon: 'HardDrive', connected: false, description: 'Auto-save contracts to "ContractGuard Vault"' },
      { id: 'calendar', name: 'Google Calendar', icon: 'Calendar', connected: false, description: 'Sync renewal deadlines automatically' },
      { id: 'whatsapp', name: 'WhatsApp', icon: 'MessageCircle', connected: false, description: 'Receive alerts via WhatsApp' },
      { id: 'bank', name: 'Bank API', icon: 'CreditCard', connected: false, description: 'Verify debit orders against contracts' },
  ]);

  // NEW Translation & Summary State
  const [isTranslating, setIsTranslating] = useState(false);
  const [summaryStyle, setSummaryStyle] = useState<'standard' | 'simple' | 'legal'>('standard');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // ... (Keep existing UseEffects for online status, language sync, etc.) ...
  useEffect(() => {
      if (analysis && language !== 'en') {
      }
  }, [language, analysis]);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);
  
  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
        setError("Unsupported file format. Please upload a PDF, JPEG, or PNG file.");
        setFile(null);
        return;
    }
    const MAX_SIZE_MB = 10;
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File is too large. Maximum allowed is ${MAX_SIZE_MB}MB.`);
        setFile(null);
        return;
    }
    setFile(selectedFile);
    setUploadMode('file');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault(); setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const saveAnalysisResult = (result: ContractAnalysis, thumbnail?: string) => {
      let saved: VaultContract | null = null;
      if (versionParentId) {
          saved = StorageService.addContractVersion(versionParentId, result, "Counter-Offer / Version");
          setVersionParentId(null); 
      } else {
          saved = StorageService.saveContract(result, thumbnail);
      }
      if (saved) {
        setAnalysis(saved); 
        setView(ViewState.ANALYSIS_RESULT);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
          throw new Error("Failed to save analysis.");
      }
  };

  const startAnalysis = async (overrideText?: string) => {
    const textToAnalyze = overrideText || inputText;
    if (uploadMode === 'file' && !file && !overrideText) return;
    if (uploadMode === 'text' && !textToAnalyze.trim()) return;
    if (!isOnline) { setError(t('status_offline')); return; }
    
    setError(null);
    setView(ViewState.ANALYSIS_LOADING);
    
    try {
      if (uploadMode === 'file' && file && !overrideText) {
          const thumbnailData = await createThumbnail(file);
          const reader = new FileReader();
          reader.onerror = () => { setError("Failed to read the file."); setView(ViewState.SCAN_UPLOAD); };
          reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            try {
              const result = await analyzeContractImage(base64Data, file.type, userIdentity, negotiationTone);
              saveAnalysisResult(result, thumbnailData);
            } catch (err: any) { handleAnalysisError(err); }
          };
          reader.readAsDataURL(file);
      } else {
          try {
              const result = await analyzeContractText(textToAnalyze, userIdentity, negotiationTone);
              saveAnalysisResult(result, undefined);
          } catch (err: any) { handleAnalysisError(err); }
      }
    } catch (e) {
      setError("Unexpected error occurred.");
      setView(ViewState.SCAN_UPLOAD);
    }
  };

  const handleAnalysisError = (err: any) => {
      console.error("Analysis Error:", err);
      let userMessage = "Analysis failed. Please try again.";
      const errorMessage = err.message || "";
      if (errorMessage.includes("API Key")) userMessage = "System Error: API Key missing.";
      else if (errorMessage.includes("JSON")) userMessage = "Couldn't understand document structure.";
      else if (errorMessage.includes("SAFETY")) userMessage = "Content blocked by safety filters.";
      setError(userMessage);
      setView(ViewState.SCAN_UPLOAD);
  };

  const changeView = (newView: ViewState) => {
    setError(null);
    setView(newView);
    if (newView === ViewState.HOME) {
        setVersionParentId(null); setFile(null); setInputText(''); setNegotiationContext(''); 
    }
  }

  const handleVaultViewContract = (contract: VaultContract) => { setAnalysis(contract); setView(ViewState.ANALYSIS_RESULT); };
  const handleAddVersion = (contractId: string) => { setVersionParentId(contractId); setView(ViewState.SCAN_UPLOAD); };
  const handlePracticeFromEmail = (context: string) => { setNegotiationContext(context); setView(ViewState.NEGOTIATION_COACH); };
  const handleDemoScenario = (scenarioText: string) => { setUploadMode('text'); setInputText(scenarioText); startAnalysis(scenarioText); };
  const toggleIntegration = (id: string) => { setIntegrations(prev => prev.map(i => i.id === id ? {...i, connected: !i.connected} : i)); };
  
  const handleAnalysisTranslation = async (targetLang: string) => {
      if (!analysis) return;
      setIsTranslating(true);
      try {
          const translated = await translateContractAnalysis(analysis, targetLang);
          setAnalysis({ ...analysis, ...translated });
      } catch (err) { setError("Translation failed. Please try again."); } finally { setIsTranslating(false); }
  };

  const handleSummaryStyleChange = async (style: 'standard' | 'simple' | 'legal') => {
      if (style === summaryStyle || !analysis) return;
      setIsSummarizing(true); setSummaryStyle(style);
      try {
          const newSummary = await adaptSummary(analysis, style);
          setAnalysis({ ...analysis, summary: newSummary });
      } catch (err) { console.error("Summarization failed"); } finally { setIsSummarizing(false); }
  };

  const getIcon = (name: string) => {
      switch(name) {
          case 'HardDrive': return <HardDrive className="w-5 h-5 text-blue-500" />;
          case 'Calendar': return <Calendar className="w-5 h-5 text-emerald-500" />;
          case 'MessageCircle': return <MessageCircle className="w-5 h-5 text-green-500" />;
          case 'CreditCard': return <CreditCard className="w-5 h-5 text-slate-500" />;
          default: return <Zap className="w-5 h-5" />;
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {showDemo && (
          <ProductTour onClose={() => setShowDemo(false)} onStartApp={() => { setShowDemo(false); changeView(ViewState.SCAN_UPLOAD); }} />
      )}

      <Sidebar view={view} onViewChange={changeView} onToggleChat={() => setIsChatOpen(true)} isMobileOpen={isMobileNavOpen} setIsMobileOpen={setIsMobileNavOpen} />

      <main className="flex-1 ml-0 md:ml-64 overflow-y-auto h-full relative">
        
        <div className="md:hidden sticky top-0 bg-white/80 backdrop-blur border-b border-slate-200 p-4 z-30 flex justify-between items-center">
            <span className="font-bold text-lg text-slate-900">ContractGuard</span>
            <button onClick={() => setIsMobileNavOpen(true)} className="p-2 text-slate-600 bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
        </div>

        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

        {/* Floating Chat & Toggle */}
        {view !== ViewState.HOME && (
          <>
            {isChatOpen && (
              <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end animate-slide-up origin-bottom-right">
                  <div className="w-[90vw] md:w-96 h-[500px] shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-200 ring-1 ring-slate-900/5">
                      <ContractChat contract={view === ViewState.ANALYSIS_RESULT ? analysis : undefined} onClose={() => setIsChatOpen(false)} />
                  </div>
              </div>
            )}
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isChatOpen ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {isChatOpen ? <ChevronDown className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
          </>
        )}

        {view === ViewState.HOME && <Hero onStart={(path) => changeView(path === 'scan' ? ViewState.SCAN_UPLOAD : path === 'community' ? ViewState.COMMUNITY : ViewState.VAULT_DASHBOARD)} onWatchDemo={() => setShowDemo(true)} />}
        
        {view === ViewState.COMMUNITY && (
            <CommunityHub onSearchCompany={() => changeView(ViewState.COMPANY_SEARCH)} onViewEducation={() => changeView(ViewState.EDUCATION)} />
        )}

        {/* Education/Resources View */}
        {view === ViewState.EDUCATION && (
             <div className="p-6 md:p-10 max-w-6xl mx-auto">
                 <div className="text-center mb-12">
                     <BookOpen className="w-16 h-16 text-blue-200 mx-auto mb-6" />
                     <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Legal Resource Center</h2>
                     <p className="text-slate-500 max-w-2xl mx-auto text-lg">Master your rights with guides on the CPA, NCA, and tips for safe contracting.</p>
                 </div>
                 
                 {/* AI Personalization Block */}
                 <div className="mb-12 bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                     <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                         <div className="p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
                             <Briefcase className="w-8 h-8 text-blue-200" />
                         </div>
                         <div className="text-center md:text-left">
                             <h3 className="text-xl font-bold text-white mb-2">Recommended for {userIdentity}s</h3>
                             <p className="text-blue-100 text-sm">
                                 {userIdentity === UserIdentity.FREELANCER && "Protect your income with our invoice templates and non-payment guides."}
                                 {userIdentity === UserIdentity.CONSUMER && "Don't let them keep your deposit. Learn about CPA Section 14 rights."}
                                 {userIdentity === UserIdentity.SMALL_BUSINESS && "Ensure your vendor agreements comply with the new POPI Act regulations."}
                             </p>
                         </div>
                     </div>
                 </div>

                 {/* Mythbusters Section */}
                 <div className="mb-16">
                     <h3 className="font-bold text-2xl text-slate-900 mb-8 flex items-center gap-2">
                        <BrainCircuit className="w-8 h-8 text-indigo-500" /> Legal Mythbusters
                        <span className="text-sm font-medium text-slate-400 ml-2 bg-slate-100 px-3 py-1 rounded-full">Tap cards to reveal</span>
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {LEGAL_MYTHS.map((myth, i) => (
                            <MythbusterCard key={i} {...myth} />
                        ))}
                     </div>
                 </div>

                 <h3 className="font-bold text-2xl text-slate-900 mb-6 flex items-center gap-2">
                    <Lightbulb className="w-8 h-8 text-amber-500" /> Official Resources
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {[
                         { title: 'The Consumer Protection Act', desc: 'Download the full CPA (Act 68 of 2008)', url: 'https://www.gov.za/documents/consumer-protection-act' },
                         { title: 'Rental Housing Tribunal', desc: 'Lodge a complaint against a landlord', url: 'https://www.dhs.gov.za/content/rental-housing-tribunal' },
                         { title: 'CCMA Templates', desc: 'Standard employment contracts', url: 'https://www.ccma.org.za/advice/employment-contracts/' },
                         { title: 'Credit Bureau Ombudsman', desc: 'Dispute blacklisting and credit scores', url: 'https://www.creditombud.org.za/' }
                     ].map((item, i) => (
                         <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer group hover:-translate-y-1">
                             <div className="flex justify-between items-start">
                                 <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                 <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                             </div>
                             <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
                             <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">Access Resource &rarr;</a>
                         </div>
                     ))}
                 </div>
                 
                 <div className="mt-12 bg-indigo-900 rounded-2xl p-8 text-white text-center relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
                     <div className="relative z-10">
                         <h3 className="text-2xl font-bold mb-3">Need Instant Advice?</h3>
                         <p className="text-indigo-200 mb-6 max-w-lg mx-auto">Our AI Legal Concierge is ready to answer questions about consumer rights while you browse.</p>
                         <button onClick={() => setIsChatOpen(true)} className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 mx-auto">
                             <Bot className="w-5 h-5" /> Open Concierge
                         </button>
                     </div>
                 </div>
             </div>
        )}

        {/* Settings View */}
        {view === ViewState.SETTINGS && (
             <div className="p-10 max-w-3xl mx-auto">
                 <h2 className="text-3xl font-bold text-slate-900 mb-8">{t('settings_title')}</h2>
                 
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                     <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                         <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> {t('settings_lang')}</h3>
                         <p className="text-sm text-slate-500">Choose your preferred interface language.</p>
                     </div>
                     <div className="p-6">
                         <div className="grid grid-cols-3 gap-3">
                             {['en', 'zu', 'af'].map((langCode) => (
                                 <button key={langCode} onClick={() => setLanguage(langCode as Language)} className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all ${language === langCode ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                     {langCode === 'en' ? 'English' : langCode === 'zu' ? 'isiZulu' : 'Afrikaans'}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                     <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                         <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> {t('settings_integrations')}</h3>
                         <p className="text-sm text-slate-500">Connect external services to automate your protection.</p>
                     </div>
                     <div className="divide-y divide-slate-100">
                         {integrations.map(integration => (
                             <div key={integration.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                 <div className="flex items-center gap-4">
                                     <div className={`p-3 rounded-xl ${integration.connected ? 'bg-emerald-100' : 'bg-slate-100'}`}>{getIcon(integration.icon)}</div>
                                     <div>
                                         <h4 className="font-bold text-slate-900">{integration.name}</h4>
                                         <p className="text-sm text-slate-500">{integration.description}</p>
                                     </div>
                                 </div>
                                 <button onClick={() => toggleIntegration(integration.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${integration.connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}>
                                     {integration.connected ? t('btn_connected') : t('btn_connect')}
                                 </button>
                             </div>
                         ))}
                     </div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                     <div className="p-6 border-b border-slate-100">
                         <h3 className="font-bold text-slate-900 mb-1">AI Configuration</h3>
                         <p className="text-sm text-slate-500 mb-4">Set your default role for future analyses.</p>
                         <div className="flex gap-2">
                             {Object.values(UserIdentity).map(id => (
                                 <button key={id} onClick={() => setUserIdentity(id)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${userIdentity === id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}>{id}</button>
                             ))}
                         </div>
                     </div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                         <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-500" /> Privacy & Data</h3>
                     </div>
                     <div className="p-6 space-y-4">
                         <div className="flex items-center justify-between">
                             <div><h4 className="font-bold text-sm text-slate-900">Export All Data</h4><p className="text-xs text-slate-500">Download a JSON copy of all your vault contracts.</p></div>
                             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"><Download className="w-4 h-4" /> Export</button>
                         </div>
                         <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                             <div><h4 className="font-bold text-sm text-rose-700">Delete Account</h4><p className="text-xs text-rose-600/70">Permanently delete all local data. Irreversible.</p></div>
                             <button className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
                         </div>
                     </div>
                 </div>
             </div>
        )}

        {view === ViewState.SCAN_UPLOAD && (
        <div className="max-w-4xl mx-auto mt-12 px-6 pb-20">
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-100">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-inner"><Camera className="w-10 h-10" /></div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">{versionParentId ? 'Counter-Offer Mode' : 'Analyze New Contract'}</h2>
                <p className="text-slate-500 text-lg">{versionParentId ? 'Upload the new version to compare against the original.' : 'Upload PDF/Images or paste text. AI analyzes risk in seconds.'}</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button onClick={() => setUploadMode('file')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Upload Files</button>
                    <button onClick={() => setUploadMode('text')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Paste Text</button>
                </div>
            </div>
            
            {uploadMode === 'file' ? (
                <>
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" id="file-upload" />
                    {!file ? (
                    <label htmlFor="file-upload" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`block w-full py-16 px-4 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 group ${isDragOver ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/30'}`}>
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className={`p-4 rounded-full transition-colors ${isDragOver ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-100'}`}><UploadCloud className={`w-10 h-10 ${isDragOver ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`} /></div>
                            <div><span className="text-blue-600 font-bold text-xl block mb-1">Click to Upload</span><span className="text-slate-400 text-sm font-medium">or drag and drop PDF/Images here</span></div>
                        </div>
                    </label>
                    ) : (
                    <div className="mb-8 animate-fade-in">
                        <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm flex-shrink-0"><FileText className="w-7 h-7 text-blue-600" /></div>
                        <div className="flex-1 text-left overflow-hidden"><p className="font-bold text-slate-900 truncate text-lg">{file.name}</p><p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze</p></div>
                        <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-lg shadow-sm border border-slate-100"><XCircle className="w-6 h-6" /></button>
                        </div>
                    </div>
                    )}
                </>
            ) : (
                <div className="mb-8 animate-fade-in">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste the contract text here...\n\nTip: You can paste specific clauses, email threads, or the entire agreement." className="relative w-full min-h-[500px] p-8 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-y font-mono text-base leading-relaxed shadow-sm transition-all"></textarea>
                        <div className="absolute top-6 right-6 p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100 pointer-events-none"><ClipboardType className="w-5 h-5" /></div>
                    </div>
                    <p className="text-sm text-slate-500 mt-4 text-center font-medium">Paste full clauses or entire documents for the most accurate analysis.</p>
                </div>
            )}

            <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-6"><div className="p-1.5 bg-slate-100 rounded-lg"><Settings className="w-4 h-4 text-slate-600" /></div><span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Analysis Configuration</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">My Persona</label><select value={userIdentity} onChange={(e) => setUserIdentity(e.target.value as UserIdentity)} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer">{Object.values(UserIdentity).map(v => (<option key={v} value={v}>{v}</option>))}</select></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Desired Tone</label><select value={negotiationTone} onChange={(e) => setNegotiationTone(e.target.value as NegotiationTone)} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer">{Object.values(NegotiationTone).map(v => (<option key={v} value={v}>{v}</option>))}</select></div>
                </div>
            </div>

            <div className="mt-10">
                {!isOnline && (<div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm font-medium"><WifiOff className="w-5 h-5 flex-shrink-0" /><span>{t('status_offline')}</span></div>)}
                <button onClick={() => startAnalysis()} disabled={!isOnline || (uploadMode === 'file' && !file) || (uploadMode === 'text' && !inputText.trim())} className={`w-full py-5 font-bold text-lg rounded-2xl shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 ${isOnline && ((uploadMode === 'file' && file) || (uploadMode === 'text' && inputText.trim())) ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}>{isOnline ? (<><ShieldCheck className="w-6 h-6" />{versionParentId ? 'Analyze Counter-Offer' : 'Run Analysis'}</>) : 'Waiting for Connection...'}</button>
            </div>
          </div>

          {!versionParentId && (
              <div className="mt-12 text-center">
                  <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-6 flex items-center justify-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Curious? Try a Demo Contract</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {DEMO_SCENARIOS.map((scenario, i) => (
                          <button key={i} onClick={() => handleDemoScenario(scenario.text)} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all text-left group">
                              <h4 className="font-bold text-slate-800 group-hover:text-blue-600 mb-1">{scenario.title}</h4>
                              <p className="text-xs text-slate-500 leading-relaxed">{scenario.description}</p>
                          </button>
                      ))}
                  </div>
              </div>
          )}
        </div>
      )}

      {view === ViewState.ANALYSIS_LOADING && <AnalysisLoading />}

      {view === ViewState.ANALYSIS_RESULT && analysis && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
             {/* ... (Keep existing Header/Sticky Nav) ... */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <button onClick={() => changeView(ViewState.VAULT_DASHBOARD)} className="flex items-center text-slate-500 hover:text-blue-600 font-semibold transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Back to Vault
                </button>
                {savedSuccess && (
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm border border-emerald-100 animate-fade-in-down">
                        <CheckCircle className="w-4 h-4"/> Saved Securely
                    </div>
                )}
             </div>
             
             {/* Sticky Sub-nav / Controls */}
             <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md">
                         <UserCircle className="w-6 h-6" />
                     </div>
                     <div>
                         <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Viewing Mode</p>
                         <p className="text-sm font-bold text-slate-900">{userIdentity}</p>
                     </div>
                 </div>
                 
                 <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                 {/* New Translation Control - Linked to specific analysis view */}
                 <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 pr-3 border border-transparent focus-within:border-blue-300 transition-colors">
                     <div className="bg-white p-1.5 rounded-lg shadow-sm">
                        {isTranslating ? <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" /> : <Languages className="w-4 h-4 text-slate-600" />}
                     </div>
                     <select 
                        onChange={(e) => handleAnalysisTranslation(e.target.value)}
                        disabled={isTranslating}
                        className="bg-transparent text-sm font-semibold text-slate-700 border-none outline-none cursor-pointer w-24 md:w-auto"
                        defaultValue="Translate..."
                     >
                        <option value="Translate..." disabled>Translate...</option>
                        <option value="English">English</option>
                        <option value="Afrikaans">Afrikaans</option>
                        <option value="isiZulu">isiZulu</option>
                        <option value="isiXhosa">isiXhosa</option>
                        <option value="Sesotho">Sesotho</option>
                     </select>
                 </div>

                 <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1 pr-3">
                     <div className="bg-white p-1.5 rounded-lg shadow-sm">
                        <Settings className="w-4 h-4 text-slate-600" />
                     </div>
                     <select 
                        value={negotiationTone}
                        onChange={(e) => setNegotiationTone(e.target.value as NegotiationTone)}
                        className="bg-transparent text-sm font-semibold text-slate-700 border-none outline-none cursor-pointer"
                     >
                        {Object.values(NegotiationTone).map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                     </select>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content (Keep existing cards: Trickery, Summary, Email, Flags, Disclaimer) */}
                <div className="lg:col-span-8 space-y-8">
                  {analysis.trickery && analysis.trickery.length > 0 && (
                    <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/30 transition-colors duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                        <EyeOff className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    Trickery Detected
                                </h3>
                                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-900/50">
                                    {analysis.trickery.length} Tactics Found
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {analysis.trickery.map((t, i) => (
                                    <div key={i} className="bg-white/5 p-5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-2">
                                            <span className="font-bold text-indigo-300 text-sm uppercase tracking-wide flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" /> {t.tactic}
                                            </span>
                                            {t.confidence > 0 && (
                                                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                                    AI Confidence: {t.confidence}%
                                                </span>
                                            )}
                                        </div>
                                        {t.quote && <p className="text-xs text-slate-400 italic mb-3 border-l-2 border-indigo-500/50 pl-3 leading-relaxed">"{t.quote}"</p>}
                                        <p className="text-sm text-slate-200 mb-4 leading-relaxed">{t.explanation}</p>
                                        <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                                            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Recommended Counter Move</p>
                                                <p className="text-sm text-emerald-100 font-medium">{t.counterMove}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-900">
                                Executive Summary
                            </h2>
                        </div>
                        
                        {/* Summary Style Toggles */}
                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1 self-start">
                            <button 
                                onClick={() => handleSummaryStyleChange('standard')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${summaryStyle === 'standard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText className="w-3.5 h-3.5" /> Standard
                            </button>
                            <button 
                                onClick={() => handleSummaryStyleChange('simple')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${summaryStyle === 'simple' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Baby className="w-3.5 h-3.5" /> Simple
                            </button>
                            <button 
                                onClick={() => handleSummaryStyleChange('legal')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${summaryStyle === 'legal' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Gavel className="w-3.5 h-3.5" /> Legal
                            </button>
                        </div>
                    </div>
                    
                    <div className={`text-slate-700 leading-loose text-lg font-medium border-l-4 border-blue-100 pl-6 py-2 mb-8 relative transition-opacity duration-300 ${isSummarizing ? 'opacity-50' : 'opacity-100'}`}>
                      {analysis.summary}
                      {isSummarizing && (
                          <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-white/80 px-4 py-2 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" /> Re-writing...
                              </span>
                          </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Contract Type</p>
                             <p className="font-bold text-slate-800 text-sm">{analysis.contractType}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Duration</p>
                             <p className="font-bold text-slate-800 text-sm">{analysis.duration}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Cost</p>
                             <p className="font-bold text-slate-800 text-sm">{analysis.totalCost}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Risk Score</p>
                             <p className="font-bold text-slate-800 text-sm">{analysis.riskScore}/100</p>
                        </div>
                    </div>
                  </div>
                  
                  <EmailGenerator contract={analysis} identity={userIdentity} tone={negotiationTone} onPractice={handlePracticeFromEmail} />

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileSearch className="w-5 h-5 text-blue-600" /> Key Clauses Identified
                    </h3>
                    <div className="grid gap-5">
                        {analysis.flags.map((flag, idx) => (
                        <div key={idx} className={`p-6 rounded-2xl border shadow-sm transition-transform hover:-translate-y-1 ${
                            flag.type === 'RED' ? 'bg-rose-50 border-rose-100 shadow-rose-100' : 
                            flag.type === 'YELLOW' ? 'bg-amber-50 border-amber-100 shadow-amber-100' : 'bg-emerald-50 border-emerald-100 shadow-emerald-100'
                        }`}>
                            <div className="flex justify-between items-center mb-3">
                            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                flag.type === 'RED' ? 'bg-rose-200 text-rose-800' : 
                                flag.type === 'YELLOW' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                            }`}>
                                {flag.type === 'RED' ? 'Critical Risk' : flag.type === 'YELLOW' ? 'Caution' : 'Fair Term'}
                            </span>
                            {flag.financialImpact && (
                                <span className="text-xs font-bold text-slate-500 bg-white/50 px-2 py-1 rounded-lg">
                                    Impact: {flag.financialImpact}
                                </span>
                            )}
                            </div>
                            <p className="font-serif italic text-slate-600 mb-4 pl-4 border-l-2 border-black/5 text-lg leading-relaxed mix-blend-multiply">
                                "{flag.clause}"
                            </p>
                            <p className="text-slate-800 font-medium text-sm leading-relaxed mb-3">
                                {flag.explanation}
                            </p>
                            {flag.confidence > 0 && <ConfidenceBar score={flag.confidence} />}
                        </div>
                        ))}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex gap-4 items-start leading-relaxed">
                      <Info className="w-5 h-5 flex-shrink-0 text-slate-400" />
                      <p>
                          <strong>Legal Disclaimer:</strong> ContractGuard uses Artificial Intelligence to analyze documents and is not a substitute for professional legal advice. 
                          The analysis provided is for informational purposes only. Always consult a qualified South African attorney before signing binding agreements or for specific legal counsel.
                      </p>
                  </div>
                </div>

                {/* Sidebar Column (4 cols) - Keep existing widgets */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Risk Score */}
                  <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <RiskGauge score={analysis.riskScore} />
                    <div className="text-center mt-6 relative z-10">
                      <div className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-md text-sm font-bold border border-white/10 mb-2">
                          {analysis.riskLevel} RISK
                      </div>
                      <p className="text-xs text-slate-400">Based on typical SA market standards.</p>
                    </div>
                  </div>

                  <LegalResourceCard contractType={analysis.contractType} riskScore={analysis.riskScore} />

                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-900/10">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                       <Shield className="w-6 h-6 text-emerald-200" /> Negotiation Power
                    </h3>
                    <ul className="space-y-4 mb-8">
                      {analysis.negotiationPoints.map((point, i) => (
                        <li key={i} className="flex flex-col gap-1 text-sm font-medium text-emerald-50">
                            <div className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-300 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(110,231,183,0.8)]"></span>
                                <span className="leading-relaxed">{point.point}</span>
                            </div>
                            <div className="ml-3.5">
                                <div className="w-full bg-emerald-800/50 rounded-full h-1">
                                    <div className="bg-emerald-300 h-1 rounded-full" style={{ width: `${point.confidence}%` }}></div>
                                </div>
                            </div>
                        </li>
                      ))}
                    </ul>
                    <button 
                      onClick={() => changeView(ViewState.NEGOTIATION_COACH)}
                      className="w-full py-4 bg-white text-emerald-700 font-bold rounded-xl transition-all hover:bg-emerald-50 shadow-lg flex items-center justify-center gap-2 group"
                    >
                      <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" /> Practice Negotiating
                    </button>
                    <p className="text-[10px] text-emerald-200 text-center mt-3 font-medium uppercase tracking-wide">Live Audio Roleplay</p>
                  </div>

                   {analysis.versions && analysis.versions.length > 0 && (
                       <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                           <div className="flex justify-between items-center mb-6">
                               <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                                   <History className="w-4 h-4 text-slate-400" /> Version History
                               </h3>
                               <button 
                                   onClick={() => handleAddVersion(analysis.id)}
                                   className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                               >
                                   <GitBranch className="w-3 h-3" /> New
                               </button>
                           </div>
                           <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
                               {analysis.versions.map((ver, i) => (
                                   <div key={ver.versionId} className="pl-6 relative">
                                       <div className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                       <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase">{new Date(ver.dateCreated).toLocaleDateString()}</p>
                                       <p className={`text-sm font-bold ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                           {ver.changesNote || 'Update'}
                                       </p>
                                       {i === 0 && <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">Current</span>}
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}
                   
                   {/* Verification Sources */}
                   {analysis.groundingSources && analysis.groundingSources.length > 0 && (
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <Globe className="w-4 h-4 text-slate-400" /> Verified Sources
                        </h3>
                        <ul className="space-y-3">
                          {analysis.groundingSources.map((source, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ExternalLink className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0" />
                              <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs font-medium text-blue-600 hover:underline hover:text-blue-800 break-all leading-relaxed"
                              >
                                {source.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
             </div>
        </div>
      )}

      {view === ViewState.NEGOTIATION_COACH && (
        <NegotiationCoach 
          onClose={() => changeView(ViewState.ANALYSIS_RESULT)} 
          contractContext={negotiationContext || (analysis ? JSON.stringify({flags: analysis.flags, trickery: analysis.trickery}) : '')}
          tone={negotiationTone}
          identity={userIdentity}
        />
      )}

      {view === ViewState.VAULT_DASHBOARD && (
        <VaultDashboard 
            onAddContract={() => changeView(ViewState.SCAN_UPLOAD)} 
            onViewContract={handleVaultViewContract}
            userIdentity={userIdentity}
        />
      )}

      {view === ViewState.COMPANY_SEARCH && (
          <CompanySearch />
      )}

      </main>
    </div>
  );
}
