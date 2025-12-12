

import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { NEGOTIATION_SYSTEM_INSTRUCTION } from '../constants';
import { Mic, MicOff, PhoneCall, XCircle, MessageSquare, Send, Bot, User } from 'lucide-react';
import { NegotiationTone, UserIdentity, ChatMessage } from '../types';

interface NegotiationCoachProps {
  onClose: () => void;
  contractContext?: string;
  tone: NegotiationTone;
  identity: UserIdentity;
}

const NegotiationCoach: React.FC<NegotiationCoachProps> = ({ onClose, contractContext, tone, identity }) => {
  const [mode, setMode] = useState<'audio' | 'text'>('audio');
  
  // Audio State
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  // Text State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  
  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Logic Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Common Prompt Construction
  const getDynamicInstruction = () => `
    ${NEGOTIATION_SYSTEM_INSTRUCTION}
    
    The user you are roleplaying with is a: ${identity}.
    The user is trying to adopt a ${tone} tone. 
    If they are too soft (and tone is Aggressive), push them to be harder.
    If they are too rude (and tone is Polite), gently correct them in character.
    
    Detailed Contract Context & Trickery Detected:
    ${contractContext || 'General contract negotiation'}
    
    If 'Trickery' or 'Dark Patterns' are listed in the context, be prepared for the user to call you out on them.
    Defend the trickery weakly at first (like a typical agent), but concede if they use the correct "Counter Move".
  `;

  const startSession = async () => {
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      // Get Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session Opened');
            setIsConnected(true);
            
            // Setup Input Streaming
            if (!inputAudioContextRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              setIsTalking(true);
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsTalking(false);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
            setIsConnected(false);
            console.log('Session Closed');
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection failed. Please refresh.");
            setIsConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: getDynamicInstruction(),
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setError("Failed to access microphone or API.");
    }
  };

  const stopSession = () => {
    // Cleanup
    streamRef.current?.getTracks().forEach(track => track.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sessionPromiseRef.current?.then(session => session.close());
    setIsConnected(false);
    onClose();
  };
  
  // Text Chat Logic
  const handleTextSend = async () => {
      if (!input.trim() || isTyping) return;
      
      const userText = input;
      setInput('');
      setIsTyping(true);
      
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const chat = ai.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                  systemInstruction: getDynamicInstruction()
              },
              history: messages.map(m => ({
                  role: m.role,
                  parts: [{ text: m.text }]
              }))
          });
          
          const result = await chat.sendMessage({ message: userText });
          const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: result.text, timestamp: Date.now() };
          setMessages(prev => [...prev, botMsg]);
          
      } catch (err) {
          setError("Failed to send message.");
      } finally {
          setIsTyping(false);
      }
  };

  // Helper functions for Audio
  function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const binary = encode(new Uint8Array(int16.buffer));
    return {
      data: binary,
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
     const dataInt16 = new Int16Array(data.buffer);
     const frameCount = dataInt16.length / numChannels;
     const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
     for (let channel = 0; channel < numChannels; channel++) {
       const channelData = buffer.getChannelData(channel);
       for (let i = 0; i < frameCount; i++) {
         channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
       }
     }
     return buffer;
  }
  
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
      <div className={`w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col ${mode === 'text' ? 'h-[600px]' : 'h-auto'}`}>
        
        {/* Mode Toggle Header */}
        <div className="relative z-20 flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
             <div className="flex gap-2">
                 <button 
                    onClick={() => setMode('audio')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'audio' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                     <PhoneCall className="w-4 h-4" /> Live Call
                 </button>
                 <button 
                    onClick={() => setMode('text')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                 >
                     <MessageSquare className="w-4 h-4" /> Text Chat
                 </button>
             </div>
             <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                 <XCircle className="w-6 h-6" />
             </button>
        </div>

        {mode === 'audio' ? (
            <div className="relative p-8 flex flex-col items-center">
                 {/* Visualizer Background Effect */}
                <div className={`absolute inset-0 opacity-20 transition-colors duration-500 ${isTalking ? 'bg-emerald-500' : 'bg-blue-500'} blur-3xl`} />
                
                <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                    <h2 className="text-2xl font-bold text-white mb-2">Practice Negotiation</h2>
                    <p className="text-slate-400 text-center mb-6 text-sm">
                        Roleplay with an AI agent. Practice asking for concessions and calling out trickery.
                    </p>
                    
                    <div className="flex gap-2 mb-8">
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 border border-slate-700">{identity}</span>
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 border border-slate-700">{tone}</span>
                    </div>

                    {error ? (
                        <div className="text-red-400 mb-6 bg-red-900/20 p-4 rounded-lg text-sm">{error}</div>
                    ) : (
                        <div className="relative mb-8 group">
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected ? (isTalking ? 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]' : 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.3)]') : 'bg-slate-700'}`}>
                                {isConnected ? <Mic className="w-12 h-12 text-white animate-pulse" /> : <MicOff className="w-12 h-12 text-slate-400" />}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 w-full">
                        {!isConnected ? (
                            <button 
                                onClick={startSession}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/20"
                            >
                                <PhoneCall className="w-5 h-5" /> Start Call
                            </button>
                        ) : (
                            <button 
                                onClick={stopSession}
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                            >
                                <XCircle className="w-5 h-5" /> End Call
                            </button>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col flex-1 bg-slate-900 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {messages.length === 0 && (
                         <div className="text-center text-slate-600 mt-10">
                             <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                             <p className="text-sm">Start the roleplay by typing below.</p>
                             <p className="text-xs mt-1">Example: "Hi, I'm calling about the cancellation fees."</p>
                         </div>
                     )}
                     {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm flex items-start gap-2 ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                            }`}>
                                <span className="mt-1 opacity-50">
                                    {msg.role === 'user' ? <User className="w-4 h-4"/> : <Bot className="w-4 h-4"/>}
                                </span>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                         <div className="flex justify-start">
                             <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1">
                                 <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                 <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                 <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
                            placeholder="Type your response..."
                            className="flex-1 bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                        />
                        <button 
                            onClick={handleTextSend}
                            disabled={!input.trim() || isTyping}
                            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default NegotiationCoach;