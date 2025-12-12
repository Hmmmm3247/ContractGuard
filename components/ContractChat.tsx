
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { ContractAnalysis, ChatMessage, GroundingSource } from '../types';
import { Send, User, Bot, Trash2, Minus, Briefcase, Info, FileText, Sparkles, ExternalLink, Globe } from 'lucide-react';

interface ContractChatProps {
  contract?: ContractAnalysis | null;
  onClose: () => void;
}

const ContractChat: React.FC<ContractChatProps> = ({ contract, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use generic ID if no contract is loaded
  const contractId = contract?.id || 'general_legal_concierge';
  const isGeneralMode = !contract;

  useEffect(() => {
    // Load chat history
    const history = StorageService.getChatHistory(contractId);
    setMessages(history);
  }, [contractId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    // 1. Save and Show User Message
    const userMsg = StorageService.saveChatMessage(contractId, { role: 'user', text: userText });
    setMessages(prev => [...prev, userMsg]);

    try {
      const ai = getGeminiClient();
      
      let systemInstruction = '';
      
      if (isGeneralMode) {
          systemInstruction = `
            You are ContractGuard's "Legal Concierge" - a friendly South African consumer law expert.
            The user is browsing the app (reading resources or checking community stats).
            
            YOUR ROLE:
            1. Answer general questions about the Consumer Protection Act (CPA), National Credit Act (NCA), and Rental Housing Act.
            2. Explain legal concepts in plain English.
            3. If the user asks about specific contract analysis, guide them to use the "Upload/Analyze" feature.
            4. Keep answers concise, helpful, and strictly relevant to South African law.
            
            Avoid giving binding legal advice. Always add a disclaimer if the query is complex.
          `;
      } else {
          // Inject rich context for summarization
          systemInstruction = `
              You are a helpful legal assistant discussing a specific South African contract.
              
              CONTRACT ANALYSIS DATA:
              - Provider: ${contract?.providerName || 'Unknown'}
              - Type: ${contract?.contractType || 'General'}
              - Quick Summary: ${contract?.summary}
              - Risk Score: ${contract?.riskScore}/100 (${contract?.riskLevel})
              
              KEY RISKS IDENTIFIED (FLAGS):
              ${contract?.flags.map(f => `- [${f.type}] ${f.clause}: ${f.explanation}`).join('\n')}
              
              TRICKERY / DARK PATTERNS DETECTED:
              ${contract?.trickery?.map(t => `- ${t.tactic}: ${t.explanation}`).join('\n') || 'None'}
              
              NEGOTIATION ANGLES & LEVERAGE:
              ${contract?.negotiationPoints?.map(p => `- ${p.point} (Confidence: ${p.confidence}%)`).join('\n') || 'None'}

              YOUR TASK:
              Help the user understand this contract, draft replies, or find loopholes.
              
              IF ASKED TO "SUMMARIZE":
              Provide a concise Executive Summary with:
              1. The core financial obligation.
              2. The Top 3 Key Risks (Red Flags).
              3. The Top 3 Negotiation Leverage Points.
              Format with bullet points.
              
              Keep answers short, practical, and South African context aware (CPA/NCA).
            `;
      }

      // 2. Create Chat Context with Search Tool
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
        }
      });

      // Send message
      const result = await chat.sendMessage({ message: userText });
      const responseText = result.text;

      // Extract Grounding Sources
      const sources: GroundingSource[] = [];
      if (result.response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          result.response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
              if (chunk.web?.uri && chunk.web?.title) {
                  if (!sources.some(s => s.uri === chunk.web?.uri)) {
                      sources.push({
                          title: chunk.web.title,
                          uri: chunk.web.uri
                      });
                  }
              }
          });
      }

      // 3. Save and Show Model Response with Sources
      const botMsg = StorageService.saveChatMessage(contractId, { role: 'model', text: responseText, sources });
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg = StorageService.saveChatMessage(contractId, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again." });
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
      StorageService.clearChat(contractId);
      setMessages([]);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className={`p-3 border-b border-slate-100 flex justify-between items-center text-white ${isGeneralMode ? 'bg-indigo-900' : 'bg-slate-900'}`}>
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isGeneralMode ? 'bg-indigo-500' : 'bg-blue-600'}`}>
                {isGeneralMode ? <Briefcase className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
            </div>
            <div>
                <h3 className="font-bold text-xs">{isGeneralMode ? 'Legal Concierge' : 'Contract Assistant'}</h3>
                <p className="text-[10px] text-slate-300 truncate max-w-[150px]">
                    {isGeneralMode ? 'Ask me anything about SA Law' : contract?.providerName}
                </p>
            </div>
        </div>
        <div className="flex gap-1">
            <button onClick={handleClear} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Clear History">
                <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Minimize">
                <Minus className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-8">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <Bot className={`w-6 h-6 ${isGeneralMode ? 'text-indigo-500' : 'text-blue-500'}`} />
                </div>
                <p className="text-sm font-medium text-slate-600">
                    {isGeneralMode ? "Hello! I'm your legal guide." : "How can I help with this contract?"}
                </p>
                <p className="text-xs mt-1">
                    {isGeneralMode ? "Ask about the CPA, your rights, or consumer safety." : "Ask about specific clauses or legal terms."}
                </p>
                
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {isGeneralMode ? (
                        <>
                            <button onClick={() => setInput("What is the cooling-off period?")} className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">Cooling-off Period?</button>
                            <button onClick={() => setInput("Can I cancel my gym contract?")} className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">Cancel Gym?</button>
                            <button onClick={() => setInput("Rights regarding defective goods")} className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">Defective Goods</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setInput("Summarize key risks and negotiation points")} className="flex items-center gap-1 text-[10px] font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm">
                                <Sparkles className="w-3 h-3" /> Summarize Risks
                            </button>
                            <button onClick={() => setInput("How do I cancel this?")} className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">How do I cancel?</button>
                            <button onClick={() => setInput("Is the penalty legal?")} className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">Is the penalty legal?</button>
                        </>
                    )}
                </div>
            </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 shadow-sm text-sm ${
              msg.role === 'user' 
                ? (isGeneralMode ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-blue-600 text-white rounded-br-none')
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              
              {/* Render Search Sources */}
              {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Verified Sources
                      </p>
                      <ul className="space-y-1">
                          {msg.sources.map((source, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                  <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate block max-w-[200px]">
                                      {source.title}
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isGeneralMode ? "Ask legal question..." : "Ask about this contract..."}
            className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg ${isGeneralMode ? 'bg-indigo-900 hover:bg-indigo-800' : 'bg-slate-900 hover:bg-slate-700'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractChat;
