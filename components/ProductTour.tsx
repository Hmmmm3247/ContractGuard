import React, { useState, useEffect } from 'react';
import { X, Play, Pause, ChevronRight, ChevronLeft, Scan, ShieldAlert, MessageSquare, Users, Search, Zap, CheckCircle, FileText } from 'lucide-react';

interface ProductTourProps {
  onClose: () => void;
  onStartApp: () => void;
}

const TOUR_SLIDES = [
  {
    id: 'scan',
    title: 'AI Contract Scanning',
    subtitle: 'We read the fine print instantly.',
    color: 'bg-blue-600',
    icon: Scan,
    duration: 6000
  },
  {
    id: 'risk',
    title: 'Risk Detection',
    subtitle: 'Spot hidden traps & unfair terms.',
    color: 'bg-rose-600',
    icon: ShieldAlert,
    duration: 6000
  },
  {
    id: 'negotiate',
    title: 'Negotiation Coach',
    subtitle: 'Roleplay with AI to get better terms.',
    color: 'bg-emerald-600',
    icon: MessageSquare,
    duration: 7000
  },
  {
    id: 'community',
    title: 'Community Intel',
    subtitle: 'See real reviews before you sign.',
    color: 'bg-indigo-600',
    icon: Users,
    duration: 6000
  }
];

const ProductTour: React.FC<ProductTourProps> = ({ onClose, onStartApp }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // Animation States for "Video" feel
  const [animStep, setAnimStep] = useState(0);

  const slide = TOUR_SLIDES[currentSlideIndex];

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      const step = 50; // Update every 50ms
      const totalSteps = slide.duration / step;
      const increment = 100 / totalSteps;

      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
             handleNext();
             return 0;
          }
          return prev + increment;
        });
      }, step);
    }
    return () => clearInterval(interval);
  }, [currentSlideIndex, isPlaying]);

  // Reset internal animation step on slide change
  useEffect(() => {
    setAnimStep(0);
    // Sequence internal animations
    const timers: any[] = [];
    timers.push(setTimeout(() => setAnimStep(1), 500));
    timers.push(setTimeout(() => setAnimStep(2), 1500));
    timers.push(setTimeout(() => setAnimStep(3), 2500));
    timers.push(setTimeout(() => setAnimStep(4), 4000));
    return () => timers.forEach(t => clearTimeout(t));
  }, [currentSlideIndex]);

  const handleNext = () => {
    if (currentSlideIndex < TOUR_SLIDES.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      // End of tour
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const renderVisual = () => {
      switch(slide.id) {
          case 'scan':
              return (
                  <div className="relative w-64 h-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transform transition-all duration-700">
                      {/* Document Content Mockup */}
                      <div className="space-y-4 p-6 opacity-30">
                          <div className="flex justify-between items-center mb-4">
                              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                              <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                          </div>
                          <div className="h-2 bg-slate-800 rounded w-full"></div>
                          <div className="h-2 bg-slate-800 rounded w-5/6"></div>
                          <div className="h-2 bg-slate-800 rounded w-full"></div>
                          <div className="space-y-2 mt-4">
                            <div className="h-2 bg-slate-800 rounded w-4/5"></div>
                            <div className="h-2 bg-slate-800 rounded w-full"></div>
                            <div className="h-2 bg-slate-800 rounded w-3/4"></div>
                          </div>
                      </div>
                      
                      {/* Scanning Laser */}
                      <div className={`absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all duration-[2000ms] ease-in-out top-0 ${animStep > 0 ? 'top-full' : ''}`} />
                      
                      {/* Analysis Bubbles */}
                      <div className={`absolute top-1/3 right-4 bg-blue-600 text-white p-2 rounded-xl rounded-tr-none shadow-lg text-[10px] font-bold transition-all duration-500 ${animStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                          Reading OCR...
                      </div>
                      <div className={`absolute bottom-1/3 left-4 bg-indigo-600 text-white p-2 rounded-xl rounded-tl-none shadow-lg text-[10px] font-bold transition-all duration-500 ${animStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                          Parsing Clauses...
                      </div>
                  </div>
              );
          case 'risk':
               return (
                  <div className="relative w-72 h-80 flex items-center justify-center">
                      {/* Card Stack Effect */}
                      <div className={`absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-100 transition-all duration-500 ${animStep >= 1 ? 'scale-95 opacity-50 translate-y-4' : 'scale-100'}`}></div>
                      
                      {/* Main Risk Card */}
                      <div className={`relative w-full bg-white p-6 rounded-2xl shadow-2xl border border-slate-200 transition-all duration-500 ${animStep >= 2 ? 'scale-100 opacity-100 rotate-0' : 'scale-90 opacity-0 rotate-6'}`}>
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                                  <ShieldAlert className="w-6 h-6" />
                              </div>
                              <div>
                                  <div className="text-xs font-bold text-slate-400 uppercase">Risk Level</div>
                                  <div className="text-xl font-black text-rose-600">HIGH (85/100)</div>
                              </div>
                          </div>
                          
                          <div className="space-y-3">
                              <div className={`p-3 bg-rose-50 rounded-lg border border-rose-100 transition-all delay-100 duration-500 ${animStep >= 3 ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                                  <div className="text-xs font-bold text-rose-700 mb-1">AUTOMATIC RENEWAL</div>
                                  <div className="text-[10px] text-rose-600/80">Clause 4.2 binds you for another 12 months without notice.</div>
                              </div>
                              <div className={`p-3 bg-amber-50 rounded-lg border border-amber-100 transition-all delay-300 duration-500 ${animStep >= 3 ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                                  <div className="text-xs font-bold text-amber-700 mb-1">HIDDEN FEES</div>
                                  <div className="text-[10px] text-amber-600/80">Annual escalation of 15% exceeds CPI.</div>
                              </div>
                          </div>
                      </div>
                  </div>
               );
          case 'negotiate':
              return (
                  <div className="w-72 space-y-4">
                       {/* Context Label */}
                       <div className="flex justify-center mb-2">
                           <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">AI Roleplay Mode</span>
                       </div>

                       {/* Bot Message */}
                       <div className={`flex justify-start transition-all duration-500 ${animStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                           <div className="bg-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-none text-xs shadow-sm max-w-[80%]">
                               <strong>Agent:</strong> "I'm afraid the cancellation fee is standard policy. We can't waive it."
                           </div>
                       </div>
                       
                       {/* AI Coach Hint */}
                       <div className={`flex justify-center my-2 transition-all duration-500 ${animStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                            <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse">
                                <Zap className="w-3 h-3" /> Tip: Quote CPA Section 14 (Reasonable Penalty)
                            </div>
                       </div>

                       {/* User Reply */}
                       <div className={`flex justify-end transition-all duration-500 ${animStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                           <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-xs shadow-lg max-w-[80%]">
                               <strong>You:</strong> "Actually, under the CPA Section 14, a 'reasonable' penalty cannot be 75%. I can offer 10%."
                           </div>
                       </div>

                       {/* Success Stamp */}
                       <div className={`flex justify-center transition-all duration-500 ${animStep >= 4 ? 'opacity-100 scale-110' : 'opacity-0 scale-50'}`}>
                            <div className="border-2 border-emerald-500 text-emerald-500 px-4 py-1 rounded-lg text-sm font-black uppercase -rotate-6">
                                Negotiation Won!
                            </div>
                       </div>
                  </div>
              );
          case 'community':
              return (
                  <div className="w-72 bg-white rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                       <div className="flex items-center justify-between mb-6">
                           <div>
                                <div className="font-bold text-slate-900 text-lg">GymCo SA</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Health & Fitness</div>
                           </div>
                           <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                               <Users className="w-5 h-5 text-slate-400" />
                           </div>
                       </div>
                       
                       <div className="flex justify-center mb-6 relative">
                            {/* Gauge Animation */}
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                                <circle cx="64" cy="64" r="56" stroke="#4f46e5" strokeWidth="12" fill="transparent" 
                                    strokeDasharray={351} 
                                    strokeDashoffset={animStep >= 1 ? 351 - (351 * 0.45) : 351} // Fill to 45%
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-900 transition-all duration-500">{animStep >= 1 ? '45' : '0'}</span>
                                <span className="text-[10px] font-bold uppercase text-slate-400">Trust Score</span>
                            </div>
                       </div>

                       {/* Reviews Popping Up */}
                       <div className={`absolute bottom-0 left-0 right-0 bg-indigo-50 p-4 border-t border-indigo-100 transition-all duration-500 ${animStep >= 2 ? 'translate-y-0' : 'translate-y-full'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-200 border-2 border-white"></div>
                                    <div className="w-6 h-6 rounded-full bg-green-200 border-2 border-white"></div>
                                    <div className="w-6 h-6 rounded-full bg-purple-200 border-2 border-white"></div>
                                </div>
                                <span className="text-xs font-bold text-indigo-900">124 users reported issues</span>
                            </div>
                            <p className="text-[10px] text-indigo-700/70 truncate">"Impossible to cancel contract..."</p>
                       </div>
                  </div>
              );
      }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-sans">
        {/* Background Blur Effect */}
        <div className={`absolute inset-0 opacity-20 transition-colors duration-700 ${slide.color}`}></div>
        
        <div className="relative w-full max-w-md h-full md:h-[85vh] bg-slate-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
            
            {/* Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex gap-1.5">
                {TOUR_SLIDES.map((s, i) => (
                    <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ 
                                width: i < currentSlideIndex ? '100%' : 
                                       i === currentSlideIndex ? `${progress}%` : '0%' 
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header Controls */}
            <div className="absolute top-8 left-0 right-0 z-20 px-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                     <div className={`w-8 h-8 rounded-full ${slide.color} flex items-center justify-center shadow-lg`}>
                        <slide.icon className="w-4 h-4 text-white" />
                     </div>
                     <span className="font-bold text-white text-sm tracking-wide">{slide.title}</span>
                </div>
                <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            {/* Main Visual Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 pt-20">
                 <div className="transform scale-90 md:scale-100 transition-transform duration-500">
                     {renderVisual()}
                 </div>
            </div>

            {/* Bottom Text Content */}
            <div className="relative z-20 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-8 flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white mb-2 leading-tight">{slide.title}</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">{slide.subtitle}</p>
                </div>

                <div className="flex items-center gap-4">
                    {currentSlideIndex === TOUR_SLIDES.length - 1 ? (
                        <button 
                            onClick={onStartApp}
                            className="flex-1 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/10"
                        >
                            Get Started <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={onClose}
                                className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:text-white transition-colors"
                            >
                                Skip
                            </button>
                            <button 
                                onClick={handleNext}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
                            >
                                Next <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

        </div>
    </div>
  );
};

export default ProductTour;
