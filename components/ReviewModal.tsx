
import React, { useState, useEffect } from 'react';
import { moderateReviewContent } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { CompanyProfile, ReviewStatus, VaultContract } from '../types';
import { X, Star, ShieldCheck, AlertTriangle, Loader2, Link as LinkIcon, Lock, CheckCircle } from 'lucide-react';

interface ReviewModalProps {
  company: CompanyProfile;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ company, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verification State
  const [contracts, setContracts] = useState<VaultContract[]>([]);
  const [linkedContractId, setLinkedContractId] = useState<string>('');
  const [suggestedFix, setSuggestedFix] = useState<string | null>(null);

  useEffect(() => {
      const allContracts = StorageService.getContracts();
      // Filter for potential matches
      const matches = allContracts.filter(c => 
          c.providerName?.toLowerCase().includes(company.name.toLowerCase()) || 
          company.name.toLowerCase().includes(c.providerName?.toLowerCase() || '')
      );
      setContracts(matches);
  }, [company.name]);

  const handleSubmit = async () => {
    if (rating === 0) {
        setError("Please select a star rating.");
        return;
    }
    if (!title.trim() || !content.trim()) {
        setError("Please fill in all fields.");
        return;
    }
    
    setIsVerifying(true);
    setError(null);
    setSuggestedFix(null);

    try {
        // 1. AI Defamation Scan
        const moderation = await moderateReviewContent(content, company.name);
        
        if (!moderation.approved) {
            setError(`Security Block: ${moderation.reason}`);
            if (moderation.suggestedFix) {
                setSuggestedFix(moderation.suggestedFix);
            }
            setIsVerifying(false);
            return;
        }

        // 2. Determine Verification Status
        // STRICT: Is a contract explicitly linked?
        const isVerifiedCustomer = !!linkedContractId;

        // 3. Save Review
        StorageService.addReview({
            companyId: company.id,
            companyName: company.name,
            authorName: isVerifiedCustomer ? "Verified Customer" : "Unverified User",
            rating,
            title,
            content,
            status: ReviewStatus.VERIFIED, // Content is safe
            verifiedCustomer: isVerifiedCustomer,
            linkedContractId: linkedContractId || undefined
        });

        onReviewSubmitted();
        onClose();

    } catch (err) {
        console.error(err);
        setError("System error during security check. Please try again.");
    } finally {
        setIsVerifying(false);
    }
  };

  const applyFix = () => {
      if (suggestedFix) {
          setContent(suggestedFix);
          setSuggestedFix(null);
          setError(null);
      }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-blue-600" />
               Write a Review
           </h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
               <X className="w-5 h-5 text-slate-500" />
           </button>
        </div>
        
        <div className="p-6">
            {/* Error / Warning Box */}
            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-xl animate-shake">
                    <div className="flex items-start gap-2 text-rose-700 text-sm font-bold mb-1">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Security Warning</span>
                    </div>
                    <p className="text-sm text-rose-600 mb-2">{error}</p>
                    
                    {suggestedFix && (
                        <div className="mt-3 bg-white p-3 rounded-lg border border-rose-200 shadow-sm">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-1">AI Suggested Rephrase (Legally Safe)</p>
                            <p className="text-sm text-slate-800 italic mb-3">"{suggestedFix}"</p>
                            <button 
                                onClick={applyFix}
                                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-1"
                            >
                                <CheckCircle className="w-3 h-3" /> Use this wording
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mb-8 flex flex-col items-center">
                <label className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">Overall Rating</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star} 
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Proof of Relationship */}
            <div className={`mb-6 p-5 rounded-2xl border transition-colors ${linkedContractId ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-600" /> 
                        Proof of Contract
                    </label>
                    {linkedContractId ? (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold animate-pulse">
                            <CheckCircle className="w-3 h-3" /> Verified Customer
                        </span>
                    ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">Unverified User</span>
                    )}
                </div>
                
                {contracts.length > 0 ? (
                    <div className="relative">
                        <select 
                            value={linkedContractId}
                            onChange={(e) => setLinkedContractId(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                        >
                            <option value="">-- No Contract Linked (Anonymous) --</option>
                            {contracts.map(c => (
                                <option key={c.id} value={c.id}>
                                    📄 {c.providerName}: {c.summary.substring(0, 30)}...
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 italic bg-white p-3 rounded-xl border border-dashed border-slate-300">
                        No matching contracts found in your Vault for {company.name}. 
                        <br/><span className="text-xs text-slate-400">Your review will be marked as "Unverified". Upload your contract to verify.</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Review Headline</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Hidden fees on cancellation" 
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Experience</label>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your experience clearly. Avoid 'They stole from me' (Fact) and stick to 'I felt misled' (Opinion)." 
                        className="w-full h-32 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm leading-relaxed"
                    />
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-500 bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                        <Lock className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p>
                            <strong>Defamation Shield Active:</strong> Our AI acts as a compliance officer. It will block unproven criminal accusations to protect you from liability.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="mt-8">
                <button 
                    onClick={handleSubmit}
                    disabled={isVerifying}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                >
                    {isVerifying ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" /> Verifying Safety & Posting...
                        </>
                    ) : (
                        "Scan & Publish Review"
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
