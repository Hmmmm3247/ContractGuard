
import React, { useEffect, useState } from 'react';
import { VaultContract, CompanyProfile, UserIdentity } from '../types';
import { StorageService } from '../services/storageService';
import { Shield, FileText, Search, Cloud, Loader2, Check, Plus, Heart, AlertTriangle, ChevronRight, Clock, Image as ImageIcon, Briefcase, Zap, Scale } from 'lucide-react';

interface VaultDashboardProps {
  onAddContract: () => void;
  onViewContract: (contract: VaultContract) => void;
  userIdentity?: UserIdentity;
}

const VaultDashboard: React.FC<VaultDashboardProps> = ({ onAddContract, onViewContract, userIdentity = UserIdentity.CONSUMER }) => {
  const [contracts, setContracts] = useState<VaultContract[]>([]);
  const [watchlist, setWatchlist] = useState<CompanyProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'auth' | 'scanning' | 'success'>('idle');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setContracts(StorageService.getContracts());
    setWatchlist(StorageService.getWatchlist());
  };

  const handleCloudImport = () => {
    setImportStatus('auth');
    setIsImporting(true);

    setTimeout(() => {
      setImportStatus('scanning');
      setTimeout(() => {
        setImportStatus('success');
        setTimeout(() => {
          const mockImport: any = {
             contractType: "Employment Contract",
             summary: "Salary Dependent. Standard conditions.",
             parties: ["Tech Corp SA", "User"],
             duration: "Permanent",
             totalCost: "Salary Dependent",
             riskScore: 15,
             riskLevel: "LOW",
             flags: [{type: 'GREEN', clause: 'Leave', explanation: '20 days annual leave', confidence: 95}],
             negotiationPoints: [],
             providerName: "Tech Corp SA"
          };
          StorageService.saveContract(mockImport);
          loadData();
          setIsImporting(false);
          setImportStatus('idle');
        }, 1500);
      }, 2000);
    }, 1500);
  };

  const filteredContracts = contracts.filter(c => 
    c.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExposure = contracts.reduce((acc, curr) => {
      const match = curr.totalCost.match(/R\s?([\d,]+)/);
      if (match) return acc + parseInt(match[1].replace(/,/g, ''));
      return acc;
  }, 0);

  // Dynamic Personalization Logic
  const getSmartAction = () => {
      if (userIdentity === UserIdentity.FREELANCER) {
          return { label: 'Create Non-Payment Notice', icon: Briefcase, color: 'bg-indigo-600' };
      }
      if (userIdentity === UserIdentity.SMALL_BUSINESS) {
          return { label: 'Vendor Compliance Check', icon: Scale, color: 'bg-emerald-600' };
      }
      return { label: 'Download Budget Report', icon: FileText, color: 'bg-slate-900' };
  };

  const smartAction = getSmartAction();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">My Vault</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-500 font-medium">Monthly Exposure:</span>
            <span className="text-2xl font-bold text-slate-900">R {totalExposure.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
            <button 
                className={`${smartAction.color} text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:-translate-y-1`}
            >
                <smartAction.icon className="w-4 h-4" />
                {smartAction.label}
            </button>
            <button 
                onClick={handleCloudImport}
                disabled={isImporting}
                className="bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Cloud className="w-4 h-4" />}
                {isImporting ? 'Syncing...' : 'Sync Cloud'}
            </button>
            <button 
                onClick={onAddContract}
                className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
                <Plus className="w-4 h-4" /> Add Contract
            </button>
        </div>
      </div>

      {/* Cloud Import Overlay */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity">
           <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl scale-100">
              {importStatus === 'auth' && (
                  <>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                         <Cloud className="w-8 h-8 text-blue-500 animate-bounce" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Connecting...</h3>
                    <p className="text-slate-500 text-sm">Verifying credentials</p>
                  </>
              )}
              {importStatus === 'scanning' && (
                  <>
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Scanning Docs</h3>
                    <p className="text-slate-500 text-sm">Looking for agreements...</p>
                  </>
              )}
              {importStatus === 'success' && (
                  <>
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Import Complete</h3>
                    <p className="text-slate-500 text-sm">1 contract added to vault</p>
                  </>
              )}
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FileText className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{contracts.length}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Contracts</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle className="w-5 h-5" /></div>
          </div>
           <div className="text-3xl font-bold text-slate-900 mb-1">{contracts.filter(c => c.riskLevel === 'HIGH').length}</div>
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Risks</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-pink-50 rounded-lg text-pink-600"><Heart className="w-5 h-5" /></div>
          </div>
           <div className="text-3xl font-bold text-slate-900 mb-1">{watchlist.length}</div>
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Watchlist</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Shield className="w-5 h-5" /></div>
          </div>
           <div className="text-3xl font-bold text-slate-900 mb-1">Active</div>
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vault Status</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="relative">
                <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contracts by provider or keywords..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            </div>

            <div className="space-y-4">
                {filteredContracts.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No contracts found.</p>
                        <button onClick={onAddContract} className="mt-4 text-blue-600 font-bold hover:underline">Add your first contract</button>
                    </div>
                ) : (
                    filteredContracts.map(contract => (
                    <div 
                        key={contract.id} 
                        onClick={() => onViewContract(contract)}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-pointer group relative"
                    >
                        {/* Thumbnail Hover Popover */}
                        <div className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-1 bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                            <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-50 flex items-center justify-center">
                                {contract.thumbnail === 'PDF' ? (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <FileText className="w-10 h-10 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">PDF Document</span>
                                    </div>
                                ) : contract.thumbnail ? (
                                    <img src={contract.thumbnail} alt="Contract Thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-300">
                                        <ImageIcon className="w-10 h-10 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">No Preview</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-200"></div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg shadow-sm ${
                                    contract.riskScore > 60 ? 'bg-rose-100 text-rose-600' : 
                                    contract.riskScore > 30 ? 'bg-amber-100 text-amber-600' : 
                                    'bg-emerald-100 text-emerald-600'
                                }`}>
                                    {contract.riskScore}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{contract.providerName}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-1">{contract.summary}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        {contract.contractType && (
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 uppercase tracking-wide">
                                                {contract.contractType}
                                            </span>
                                        )}
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                            {contract.duration}
                                        </span>
                                        {contract.savedDraft && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                                                <FileText className="w-3 h-3" /> Draft
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase mb-1">
                                        <Clock className="w-3 h-3" /> Renewal
                                    </div>
                                    <div className="text-sm font-bold text-slate-700">{contract.renewalDate || 'N/A'}</div>
                                </div>
                                
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                    ))
                )}
            </div>
        </div>

        {/* Watchlist Sidebar */}
        <div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 sticky top-24">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> Watchlist
                </h3>
                {watchlist.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p>No companies saved.</p>
                        <p className="mt-1">Use Search to track companies.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {watchlist.map(company => (
                             <div key={company.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 cursor-default">
                                 <div>
                                     <div className="font-bold text-sm text-slate-900">{company.name}</div>
                                     <div className="text-xs text-slate-500">{company.industry}</div>
                                 </div>
                                 <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                     company.trustScore > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                 }`}>
                                     {company.trustScore}
                                 </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VaultDashboard;
