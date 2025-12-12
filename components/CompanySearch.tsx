
import React, { useState, useEffect } from 'react';
import { CompanyService } from '../services/companyService';
import { StorageService } from '../services/storageService';
import { analyzeCompanyReputation } from '../services/geminiService';
import { CompanyProfile, CommunityReview } from '../types';
import { Search, Building, ThumbsUp, Star, AlertTriangle, Loader2, Globe, Sparkles, Heart, Users, MessageSquare, Plus, ShieldCheck, Zap, Scale, ArrowRightLeft, ExternalLink, BarChart3, TrendingUp } from 'lucide-react';
import ReviewModal from './ReviewModal';

const CompanySearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyProfile[]>(CompanyService.getAll());
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'local' | 'ai'>('local');
  const [watchlistMap, setWatchlistMap] = useState<Record<string, boolean>>({});
  
  // Community Logic
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [reviewStats, setReviewStats] = useState<Record<string, {count: number, average: number}>>({});
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Comparison State
  const [comparisonTarget, setComparisonTarget] = useState<CompanyProfile | null>(null);
  const [showComparator, setShowComparator] = useState(false);
  const [isComparingLoading, setIsComparingLoading] = useState(false);

  useEffect(() => {
    // Sync watchlist status and load stats for initial list
    const list = StorageService.getWatchlist();
    const map: Record<string, boolean> = {};
    list.forEach(c => map[c.id] = true);
    setWatchlistMap(map);
    loadStatsForList(results);
  }, [results, selectedCompany]);

  useEffect(() => {
      if (selectedCompany) {
          const companyReviews = StorageService.getReviews(selectedCompany.id);
          setReviews(companyReviews);
      }
  }, [selectedCompany]);

  const loadStatsForList = (companies: CompanyProfile[]) => {
      const statsMap: Record<string, {count: number, average: number}> = {};
      companies.forEach(c => {
          statsMap[c.id] = StorageService.getReviewStats(c.id);
      });
      setReviewStats(statsMap);
  };

  const handleSearch = async () => {
      if (!query.trim()) {
          const all = CompanyService.getAll();
          setResults(all);
          loadStatsForList(all);
          setSearchMode('local');
          return;
      }

      // First check local DB (which now includes discovered companies)
      const localResults = CompanyService.search(query);
      
      if (localResults.length > 0) {
          setResults(localResults);
          loadStatsForList(localResults);
          setSearchMode('local');
          setSelectedCompany(localResults[0]);
          setActiveTab('overview');
      } else {
          // If not found locally, trigger AI Search
          setSearchMode('ai');
          setIsSearching(true);
          setResults([]); // Clear previous
          setSelectedCompany(null);
          
          try {
              const aiResult = await analyzeCompanyReputation(query);
              StorageService.saveDiscoveredCompany(aiResult);
              setResults([aiResult]);
              loadStatsForList([aiResult]);
              setSelectedCompany(aiResult);
              setActiveTab('overview');
          } catch (error) {
              console.error(error);
          } finally {
              setIsSearching(false);
          }
      }
  };

  const toggleWatchlist = (e: React.MouseEvent, company: CompanyProfile) => {
      e.stopPropagation();
      const isAdded = StorageService.toggleWatchlist(company);
      setWatchlistMap(prev => ({...prev, [company.id]: isAdded}));
  };

  const handleReviewSubmitted = () => {
      if (selectedCompany) {
          const updated = StorageService.getReviews(selectedCompany.id);
          setReviews(updated);
          loadStatsForList(results);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  // Enhanced Comparison Logic
  const handleCompare = async () => {
      if (!selectedCompany) return;
      setIsComparingLoading(true);
      
      // 1. Try to find a local competitor first
      const all = CompanyService.getAll();
      const competitor = all.find(c => c.industry === selectedCompany.industry && c.id !== selectedCompany.id);
      
      if (competitor) {
          setComparisonTarget(competitor);
          setShowComparator(true);
          setIsComparingLoading(false);
      } else {
          // 2. If no local competitor, ask AI to find the biggest rival
          try {
              const rivalResult = await analyzeCompanyReputation(`The biggest competitor of ${selectedCompany.name} in South Africa`);
              setComparisonTarget(rivalResult);
              StorageService.saveDiscoveredCompany(rivalResult); // Cache it
              setShowComparator(true);
          } catch (e) {
              alert("Unable to retrieve competitor data at this time.");
          } finally {
              setIsComparingLoading(false);
          }
      }
  };

  // Helper to calculate industry average based on local data (or fallback)
  const getIndustryAverage = (industry: string) => {
      const all = CompanyService.getAll().filter(c => c.industry === industry);
      if (all.length === 0) return 60; // Fallback
      const sum = all.reduce((acc, c) => acc + c.trustScore, 0);
      return Math.round(sum / all.length);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
       <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Crowd Intelligence</h1>
          <p className="text-lg text-slate-500">Search any company to see AI trust scores and real community reviews.</p>
       </div>

       {/* Search Bar */}
       <div className="relative mb-12 max-w-3xl mx-auto md:mx-0">
        <div className="relative group">
            <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search company (e.g. Telkom, Virgin Active)..." 
            className="w-full pl-14 pr-36 py-5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg font-medium bg-white"
            />
            <Search className="w-6 h-6 text-slate-400 absolute left-5 top-5 group-focus-within:text-blue-500 transition-colors" />
            
            <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
            >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                {isSearching ? 'Scanning' : 'Search'}
            </button>
        </div>
        {searchMode === 'ai' && !isSearching && results.length > 0 && (
            <div className="absolute top-full left-4 mt-2 text-xs text-blue-600 flex items-center gap-1 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-100 animate-fade-in-down">
                <Globe className="w-3 h-3" /> Live AI Reputation Analysis
            </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparator && selectedCompany && comparisonTarget && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowComparator(false)}>
              <div className="bg-white w-full max-w-4xl rounded-3xl p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowComparator(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><ArrowRightLeft className="w-5 h-5 text-slate-600" /></button>
                  <h3 className="text-2xl font-bold text-center mb-8 text-slate-900">Head-to-Head Comparison</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                      {/* Left Side (Selected) */}
                      <div className="text-center border-r border-slate-100 pr-4">
                          <h4 className="text-xl font-bold text-slate-800 mb-1">{selectedCompany.name}</h4>
                          <div className="text-6xl font-black text-blue-600 mb-2">{selectedCompany.trustScore}</div>
                          <p className="text-xs text-slate-400 uppercase font-bold mb-6">Trust Score</p>
                          <div className="space-y-2 text-left">
                              <div className="bg-slate-50 p-3 rounded-lg text-sm flex justify-between"><span className="font-bold">Negotiability:</span> <span>{selectedCompany.userRatings.negotiability}/5</span></div>
                              <div className="bg-slate-50 p-3 rounded-lg text-sm flex justify-between"><span className="font-bold">Transparency:</span> <span>{selectedCompany.userRatings.transparency}/5</span></div>
                          </div>
                      </div>
                      
                      {/* Right Side (Competitor) */}
                      <div className="text-center pl-4">
                          <h4 className="text-xl font-bold text-slate-800 mb-1">{comparisonTarget.name}</h4>
                          <div className={`text-6xl font-black mb-2 ${comparisonTarget.trustScore > selectedCompany.trustScore ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {comparisonTarget.trustScore}
                          </div>
                          <p className="text-xs text-slate-400 uppercase font-bold mb-6">Trust Score</p>
                          <div className="space-y-2 text-left">
                              <div className="bg-slate-50 p-3 rounded-lg text-sm flex justify-between"><span className="font-bold">Negotiability:</span> <span>{comparisonTarget.userRatings.negotiability}/5</span></div>
                              <div className="bg-slate-50 p-3 rounded-lg text-sm flex justify-between"><span className="font-bold">Transparency:</span> <span>{comparisonTarget.userRatings.transparency}/5</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Results List */}
        <div className="space-y-4">
            {isSearching ? (
                <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-center mb-6">
                        <div className="relative flex h-16 w-16">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-16 w-16 bg-blue-50 flex items-center justify-center">
                                <Search className="w-6 h-6 text-blue-500 animate-pulse" />
                            </span>
                        </div>
                    </div>
                    <p className="text-lg font-medium text-slate-600">AI is auditing this company...</p>
                    <p className="text-sm mt-1">Scanning social media, news, and consumer complaints.</p>
                </div>
            ) : results.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-300">
                    <p className="font-medium">No results found.</p>
                    <p className="text-sm mt-1">Try searching to generate a new AI report.</p>
                </div>
            ) : (
                results.map(company => (
                    <div 
                        key={company.id}
                        onClick={() => { setSelectedCompany(company); setShowComparator(false); }}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all group ${
                            selectedCompany?.id === company.id 
                            ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' 
                            : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/50'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all overflow-hidden relative">
                                    <Building className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{company.name}</h3>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{company.industry}</p>
                                        
                                        {/* Community Stat Badge */}
                                        {(reviewStats[company.id]?.count || 0) > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                <Users className="w-3 h-3" />
                                                {reviewStats[company.id].average.toFixed(1)} <span className="text-amber-400">★</span> ({reviewStats[company.id].count})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {/* AI Trust Score Badge */}
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide ${
                                    company.trustScore > 70 ? 'bg-emerald-100 text-emerald-700' :
                                    company.trustScore > 40 ? 'bg-amber-100 text-amber-700' :
                                    'bg-rose-100 text-rose-700'
                                }`}>
                                    <Globe className="w-3.5 h-3.5" />
                                    AI Score: {company.trustScore}
                                </div>
                                
                                <button 
                                    onClick={(e) => toggleWatchlist(e, company)}
                                    className={`text-xs font-bold flex items-center gap-1 transition-colors ${
                                        watchlistMap[company.id] ? 'text-pink-500' : 'text-slate-300 hover:text-pink-400'
                                    }`}
                                >
                                    <Heart className={`w-3.5 h-3.5 ${watchlistMap[company.id] ? 'fill-current' : ''}`} />
                                    {watchlistMap[company.id] ? 'Saved' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Details View */}
        <div className="relative">
             {selectedCompany ? (
                 <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden lg:sticky lg:top-24 animate-fade-in-up">
                     {/* Tab Headers */}
                     <div className="flex border-b border-slate-100">
                         <button 
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === 'overview' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-700'}`}
                         >
                             Reputation Audit
                             {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                         </button>
                         <button 
                            onClick={() => setActiveTab('reviews')}
                            className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 relative ${activeTab === 'reviews' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-700'}`}
                         >
                             <Users className="w-4 h-4" /> Community Voices
                             <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">
                                {reviewStats[selectedCompany.id]?.count || 0}
                             </span>
                             {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                         </button>
                     </div>

                     <div className="p-8">
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-3xl font-extrabold text-slate-900">{selectedCompany.name}</h2>
                                    
                                    {/* Trust Score Gauge */}
                                    <div className="text-center relative">
                                        <svg className="w-20 h-20 transform -rotate-90">
                                            <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                                strokeDasharray={226} 
                                                strokeDashoffset={226 - (226 * selectedCompany.trustScore) / 100}
                                                className={`transition-all duration-1000 ${
                                                    selectedCompany.trustScore > 70 ? 'text-emerald-500' :
                                                    selectedCompany.trustScore > 40 ? 'text-amber-500' : 'text-rose-500'
                                                }`} 
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-xl font-black text-slate-800">{selectedCompany.trustScore}</span>
                                            <span className="text-[8px] font-bold uppercase text-slate-400">Web Trust</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Industry Benchmark Card (Fills space) */}
                                <div className="mb-6 bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                <BarChart3 className="w-4 h-4 text-blue-400" /> Industry Benchmark
                                            </h4>
                                            <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase">
                                                {selectedCompany.industry}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-end gap-4 mb-2">
                                            <div>
                                                <div className="text-xs text-slate-400 mb-1">Market Average</div>
                                                <div className="text-2xl font-bold">{getIndustryAverage(selectedCompany.industry)}/100</div>
                                            </div>
                                            <div className="h-8 w-[1px] bg-slate-700"></div>
                                            <div>
                                                <div className="text-xs text-slate-400 mb-1">Standing</div>
                                                <div className={`text-sm font-bold ${
                                                    selectedCompany.trustScore >= getIndustryAverage(selectedCompany.industry) ? 'text-emerald-400' : 'text-rose-400'
                                                }`}>
                                                    {selectedCompany.trustScore >= getIndustryAverage(selectedCompany.industry) ? 'Above Average' : 'Below Average'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <button 
                                        onClick={handleCompare}
                                        disabled={isComparingLoading}
                                        className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors shadow-sm"
                                    >
                                        {isComparingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                                        {isComparingLoading ? 'Finding Competitor...' : 'Compare with Competitor'}
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="p-1.5 bg-rose-100 rounded text-rose-600">
                                            <AlertTriangle className="w-4 h-4" /> 
                                        </div>
                                        Known Issues & Traps
                                    </h3>
                                    {selectedCompany.commonTraps.length > 0 ? (
                                        <ul className="space-y-3">
                                            {selectedCompany.commonTraps.map((trap, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                                    {trap}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No significant negative patterns detected.</p>
                                    )}
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-100 rounded text-emerald-600">
                                            <ThumbsUp className="w-4 h-4" /> 
                                        </div>
                                        Positive Traits
                                    </h3>
                                     {selectedCompany.positiveTraits.length > 0 ? (
                                        <ul className="space-y-3">
                                            {selectedCompany.positiveTraits.map((trait, i) => (
                                                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                                    {trait}
                                                </li>
                                            ))}
                                        </ul>
                                     ) : (
                                        <p className="text-sm text-slate-400 italic">No specific positive traits listed.</p>
                                     )}
                                </div>

                                {/* Display Search Grounding Sources */}
                                {selectedCompany.sources && selectedCompany.sources.length > 0 && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5" /> Verified via Google Search
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {selectedCompany.sources.map((source, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <ExternalLink className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                                                    <a 
                                                        href={source.uri} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-medium text-blue-600 hover:underline hover:text-blue-800 break-all leading-tight"
                                                    >
                                                        {source.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                             <div className="animate-fade-in">
                                 <div className="flex justify-between items-center mb-6">
                                     <h3 className="font-bold text-slate-900 text-lg">Community Experiences</h3>
                                     <button 
                                        onClick={() => setShowReviewModal(true)}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                                     >
                                         <Plus className="w-4 h-4" /> Write Review
                                     </button>
                                 </div>

                                 {reviews.length === 0 ? (
                                     <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                         <p className="text-slate-500 font-medium">No verified reviews yet.</p>
                                         <p className="text-xs text-slate-400 mt-1">Be the first to share your experience with {selectedCompany.name}.</p>
                                     </div>
                                 ) : (
                                     <div className="space-y-4">
                                         {reviews.map((review) => (
                                             <div key={review.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                                 <div className="flex justify-between items-start mb-2">
                                                     <div className="flex items-center gap-2">
                                                         <div className="bg-white p-1.5 rounded-full border border-slate-100">
                                                             <Users className="w-4 h-4 text-slate-400" />
                                                         </div>
                                                         <span className="text-sm font-bold text-slate-900">{review.authorName}</span>
                                                         {review.verifiedCustomer && (
                                                             <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200" title="Linked a Contract">
                                                                 <ShieldCheck className="w-3 h-3" /> Verified Customer
                                                             </span>
                                                         )}
                                                     </div>
                                                     <span className="text-xs text-slate-400 font-medium">
                                                         {new Date(review.timestamp).toLocaleDateString()}
                                                     </span>
                                                 </div>
                                                 
                                                 <div className="flex text-amber-400 mb-2">
                                                     {[...Array(5)].map((_, i) => (
                                                         <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                                                     ))}
                                                 </div>

                                                 <h4 className="font-bold text-slate-800 text-sm mb-1">{review.title}</h4>
                                                 <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                        )}
                     </div>
                 </div>
             ) : (
                 <div className="hidden lg:flex flex-col items-center justify-center h-96 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center p-8 sticky top-24">
                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                         <Search className="w-8 h-8 text-slate-300" />
                     </div>
                     <h3 className="font-bold text-slate-900 text-lg mb-2">Select a Company</h3>
                     <p className="text-slate-500 max-w-xs mx-auto">Click on a result to view full reputation analysis, traps, and community reviews.</p>
                 </div>
             )}
        </div>
      </div>
      
      {showReviewModal && selectedCompany && (
          <ReviewModal 
            company={selectedCompany} 
            onClose={() => setShowReviewModal(false)}
            onReviewSubmitted={handleReviewSubmitted}
          />
      )}
    </div>
  );
};

export default CompanySearch;
