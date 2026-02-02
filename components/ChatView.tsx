
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Search, MapPin, Loader2, ExternalLink, Paperclip } from 'lucide-react';
import { generateContentWithSearch } from '../services/geminiService';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await generateContentWithSearch(inputValue);
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources,
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered an error while searching for that information. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full px-6 py-8">
      <div className="flex-1 space-y-8 overflow-y-auto pb-8 scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center animate-pulse">
              <Search className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">What can I research for you today?</h3>
              <p className="text-gray-500 max-w-md">Try asking about the latest tech trends, travel recommendations, or deep-dive technical explanations.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {["Best Italian food in NYC?", "Latest developments in Fusion energy?", "Summarize the current market trends"].map(q => (
                <button 
                  key={q} 
                  onClick={() => setInputValue(q)}
                  className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-full text-sm text-gray-400 hover:text-white hover:border-blue-500/50 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block px-5 py-4 rounded-3xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'glass text-gray-200 rounded-tl-none border-gray-700/50'
              }`}>
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.sources.map((src, i) => (
                    <a 
                      key={i} 
                      href={src.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900/80 border border-gray-800 rounded-lg text-xs text-blue-400 hover:bg-gray-800 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {src.title || "Source"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="glass px-5 py-4 rounded-3xl rounded-tl-none border-gray-700/50 flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
             </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 relative">
        <div className="glass rounded-2xl p-2 border border-gray-800 focus-within:border-blue-500/50 transition-colors shadow-2xl">
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-gray-500 hover:text-blue-400 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything... Gemini will search for the latest info"
              className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-1"
            />
            <div className="flex gap-1.5">
              <button className="p-2.5 text-gray-500 hover:text-blue-400 transition-colors hidden sm:block">
                <MapPin className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 p-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-3 uppercase tracking-widest font-bold">
          Powered by Gemini 3 Flash & Search Grounding
        </p>
      </div>
    </div>
  );
};

export default ChatView;
