
import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Video, Download, RefreshCw, Loader2, Wand2, Info } from 'lucide-react';
import { generateImage, generateVideo } from '../services/geminiService';
import { GenerationResult } from '../types';

const VisionStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const checkAndPromptApiKey = async () => {
    if (typeof window.aistudio === 'undefined') return true; // Local dev mock
    const selected = await window.aistudio.hasSelectedApiKey();
    if (!selected) {
      await window.aistudio.openSelectKey();
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    await checkAndPromptApiKey();

    const newId = Date.now().toString();
    const placeholder: GenerationResult = {
      id: newId,
      type: mode,
      url: '',
      prompt: prompt,
      status: 'loading'
    };
    
    setResults(prev => [placeholder, ...prev]);

    try {
      let url = '';
      if (mode === 'image') {
        url = await generateImage(prompt, "1K");
      } else {
        url = await generateVideo(prompt);
      }

      setResults(prev => prev.map(res => 
        res.id === newId ? { ...res, url, status: 'completed' } : res
      ));
    } catch (error) {
      console.error(error);
      setResults(prev => prev.map(res => 
        res.id === newId ? { ...res, status: 'error' } : res
      ));
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6 border-gray-800 shadow-xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Wand2 className="text-blue-500 w-5 h-5" />
              Creator Settings
            </h3>
            
            <div className="flex p-1 bg-gray-950 rounded-xl border border-gray-800">
              <button 
                onClick={() => setMode('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'image' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Image
              </button>
              <button 
                onClick={() => setMode('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'video' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Video className="w-4 h-4" /> Video
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase">Prompt</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'image' ? "A hyper-realistic cyberpunk city at dusk..." : "A neon hologram of a cat driving at top speed..."}
                className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm focus:border-blue-500 outline-none resize-none transition-colors"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate {mode === 'image' ? "Art" : "Video"}
            </button>

            <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex gap-3">
              <Info className="w-12 h-12 text-blue-400 shrink-0" />
              <p className="text-[11px] text-blue-300 leading-relaxed">
                {mode === 'image' ? 'Gemini 3 Pro Image supports 1K, 2K, and 4K resolutions with superior prompt adherence.' : 'Veo 3.1 Fast provides rapid video generation up to 1080p resolution in seconds.'}
              </p>
            </div>
          </div>
        </div>

        {/* Display Area */}
        <div className="lg:col-span-3">
          <div className="h-full bg-gray-950/30 rounded-3xl border border-dashed border-gray-800 flex flex-col items-center justify-start p-6 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <Sparkles className="w-16 h-16 text-gray-700" />
                <div>
                  <h4 className="text-xl font-medium text-gray-400">Studio is empty</h4>
                  <p className="text-sm text-gray-600">Start creating to populate your gallery</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {results.map((res) => (
                  <div key={res.id} className="glass rounded-2xl overflow-hidden group border-gray-800 hover:border-blue-500/30 transition-all shadow-lg">
                    <div className="aspect-video bg-gray-900 relative">
                      {res.status === 'loading' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                           <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                           <p className="text-xs text-gray-500 animate-pulse">Lumina is imagining your {res.type}...</p>
                        </div>
                      ) : res.status === 'error' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-500/5">
                           <RefreshCw className="w-8 h-8 text-red-500/50" />
                           <p className="text-xs text-red-500/70 font-medium">Generation Failed</p>
                        </div>
                      ) : (
                        <>
                          {res.type === 'image' ? (
                            <img src={res.url} alt={res.prompt} className="w-full h-full object-cover" />
                          ) : (
                            <video src={res.url} autoPlay loop muted className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => window.open(res.url)}
                              className="bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md"
                            >
                              <Download className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-4 bg-gray-900/50">
                      <p className="text-xs text-gray-400 line-clamp-2">{res.prompt}</p>
                      <div className="mt-2 flex items-center justify-between">
                         <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">
                           {res.type === 'image' ? 'Imagen Model' : 'Veo 3.1 Fast'}
                         </span>
                         <span className="text-[10px] text-gray-600">
                           {new Date(parseInt(res.id)).toLocaleTimeString()}
                         </span>
                      </div>
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

export default VisionStudio;
