
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { CompanyProfile, CommunityReview } from '../types';
import { ShieldCheck, AlertTriangle, Search, Star, MessageSquare, TrendingUp, Users, ArrowRight, Download, FileText, Megaphone } from 'lucide-react';

interface CommunityHubProps {
  onSearchCompany: () => void;
  onViewEducation: () => void;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ onSearchCompany, onViewEducation }) => {
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [trending, setTrending] = useState<{ best: CompanyProfile[], worst: CompanyProfile[] }>({ best: [], worst: [] });

  useEffect(() => {
    setReviews(StorageService.getAllReviews());
    setTrending(StorageService.getTrendingCompanies());
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
      {/* Scam Alert Ticker */}
      <div className="bg-rose-600 text-white py-2 px-6 rounded-full mb-8 flex items-center gap-4 overflow-hidden shadow-lg animate-fade-in-down">
          <Megaphone className="w-4 h-4 animate-pulse flex-shrink-0" />
          <div className="whitespace-nowrap font-bold text-xs uppercase tracking-wider animate-marquee">
              ALERT: Holiday Rental Scam reported in Cape Town • "QuickCash" Loans flagged for illegal interest rates • Solar Installation Deposit Fraud increasing in Gauteng
          </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-slate-900 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl mb-12 text-center md:text-left">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-6">
            <Users className="w-3 h-3" /> Community Watch
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
             Real People.<br />Real <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Experiences.</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mb-8 leading-relaxed">
             Join thousands of South Africans sharing contract insights. Avoid the traps others fell into and find the companies that actually treat you right.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
             <button 
                onClick={onSearchCompany}
                className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95"
             >
                <Search className="w-5 h-5" /> Find Company Intel
             </button>
             <button 
                onClick={onViewEducation}
                className="bg-slate-800/50 text-white border border-slate-700 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all backdrop-blur-md"
             >
                <ShieldCheck className="w-5 h-5" /> Know Your Rights
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Wall of Shame */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <AlertTriangle className="w-24 h-24 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                      <TrendingUp className="w-5 h-5 transform rotate-180" />
                  </div>
                  Caution List
              </h2>
              <div className="space-y-4">
                  {trending.worst.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                          <div className="flex items-center gap-3">
                              <span className="text-rose-300 font-black text-lg w-4">#{i+1}</span>
                              <div>
                                  <p className="font-bold text-slate-800">{c.name}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">{c.industry}</p>
                              </div>
                          </div>
                          <div className="text-xs font-black bg-rose-200 text-rose-700 px-2 py-1 rounded">
                              {c.trustScore}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Hall of Fame */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck className="w-24 h-24 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Star className="w-5 h-5" />
                  </div>
                  Trusted Brands
              </h2>
              <div className="space-y-4">
                  {trending.best.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                          <div className="flex items-center gap-3">
                              <span className="text-emerald-300 font-black text-lg w-4">#{i+1}</span>
                              <div>
                                  <p className="font-bold text-slate-800">{c.name}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">{c.industry}</p>
                              </div>
                          </div>
                          <div className="text-xs font-black bg-emerald-200 text-emerald-700 px-2 py-1 rounded">
                              {c.trustScore}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Live Feed */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl text-white">
               <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
                      <MessageSquare className="w-5 h-5" />
                  </div>
                  Recent Reviews
              </h2>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.length === 0 ? (
                      <p className="text-slate-400 text-sm italic">No recent activity.</p>
                  ) : (
                      reviews.slice(0, 5).map(r => (
                          <div key={r.id} className="bg-white/5 border border-white/10 p-3 rounded-xl">
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-bold text-blue-300">{r.companyName}</span>
                                  <div className="flex text-amber-400">
                                      {[...Array(r.rating)].map((_,i) => <Star key={i} className="w-2 h-2 fill-current" />)}
                                  </div>
                              </div>
                              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">"{r.content}"</p>
                              <div className="mt-2 flex justify-between items-center text-[10px] text-slate-500">
                                  <span>{r.authorName}</span>
                                  <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
              <button onClick={onSearchCompany} className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                  View All Intel <ArrowRight className="w-3 h-3" />
              </button>
          </div>
      </div>

      {/* Community Template Library (New Feature) */}
      <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" /> Safe Contract Templates
              </h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Vetted by Community</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                  { title: "Standard Freelance SLA", desc: "Includes IP protection & late fees.", downloads: "2.4k" },
                  { title: "Domestic Worker Contract", desc: "Compliant with Dept of Labour.", downloads: "5.1k" },
                  { title: "Private Car Sale", desc: "Voetstoots clause included correctly.", downloads: "1.8k" },
                  { title: "Room Rental Agreement", desc: "Fair wear & tear definitions.", downloads: "3.2k" }
              ].map((template, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                          <FileText className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{template.title}</h4>
                      <p className="text-xs text-slate-500 mb-4 h-8">{template.desc}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <span className="text-[10px] font-bold text-slate-400">{template.downloads} downloads</span>
                          <button className="text-blue-600 hover:text-blue-800 transition-colors">
                              <Download className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default CommunityHub;
