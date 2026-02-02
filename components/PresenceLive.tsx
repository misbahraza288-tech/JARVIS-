
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, Activity, Play, StopCircle, Info } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decodeBase64, encodeToBase64, decodeAudioData } from '../services/geminiService';

const PresenceLive: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active'>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const startSession = async () => {
    setStatus('connecting');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Audio Contexts
    const inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputAudioContext;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOn });
      streamRef.current = stream;
      if (videoRef.current && isVideoOn) videoRef.current.srcObject = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('active');
            setIsActive(true);
            
            // Microphone Streaming
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encodeToBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            // Video Streaming (if enabled)
            if (isVideoOn) {
              intervalRef.current = window.setInterval(() => {
                if (!canvasRef.current || !videoRef.current) return;
                const ctx = canvasRef.current.getContext('2d');
                if (!ctx) return;
                canvasRef.current.width = videoRef.current.videoWidth / 4;
                canvasRef.current.height = videoRef.current.videoHeight / 4;
                ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                
                const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                sessionPromise.then(session => session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'image/jpeg' }
                }));
              }, 1000);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const audioBytes = decodeBase64(audioData);
              const audioBuffer = await decodeAudioData(audioBytes, outputAudioContext, 24000, 1);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const sourceNode = outputAudioContext.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputAudioContext.destination);
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(sourceNode);
              sourceNode.onended = () => sourcesRef.current.delete(sourceNode);
            }

            // Interruption handling
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscript(prev => [...prev.slice(-10), `Gemini: ${text}`]);
            }
          },
          onerror: (e) => console.error("Live API Error:", e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are Lumina, a futuristic AI presence. You can see through the camera and hear the user. Be friendly, observant, and concise.'
        }
      });
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      stopSession();
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setStatus('idle');
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    setTranscript([]);
  };

  return (
    <div className="h-full flex flex-col p-8 items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Visualizer / Camera View */}
        <div className="relative aspect-square glass rounded-[40px] border-gray-800 overflow-hidden shadow-2xl flex items-center justify-center">
          {isVideoOn ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className={`w-32 h-32 rounded-full border-4 border-blue-500/20 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
               <Activity className={`w-12 h-12 text-blue-500 ${isActive ? 'animate-spin' : ''}`} />
            </div>
          )}
          
          <div className="absolute top-6 left-6 px-4 py-2 glass rounded-full flex items-center gap-2 border-white/10">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-ping' : 'bg-gray-600'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{isActive ? 'Live' : 'Offline'}</span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full backdrop-blur-xl border transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </button>
            <button 
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-4 rounded-full backdrop-blur-xl border transition-all ${isVideoOn ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
            >
              {isVideoOn ? <Video /> : <VideoOff />}
            </button>
          </div>
        </div>

        {/* Interaction Details */}
        <div className="space-y-8">
           <div className="space-y-2">
              <h2 className="text-4xl font-bold gradient-text">Presence Live</h2>
              <p className="text-gray-400">Experience Gemini in its most natural form. Real-time voice interaction with visual perception.</p>
           </div>

           <div className="glass p-6 rounded-3xl border-gray-800 min-h-[200px] flex flex-col justify-end">
             {transcript.length > 0 ? (
               <div className="space-y-2">
                 {transcript.map((t, i) => (
                   <p key={i} className={`text-sm ${t.startsWith('Gemini') ? 'text-blue-400' : 'text-gray-400'}`}>
                     {t}
                   </p>
                 ))}
               </div>
             ) : (
               <div className="text-center text-gray-600 italic">
                 {isActive ? "Speak to start conversation..." : "Presence is currently dormant."}
               </div>
             )}
           </div>

           {!isActive ? (
             <button 
               onClick={startSession}
               disabled={status === 'connecting'}
               className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/30"
             >
               {status === 'connecting' ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
               Initialize Multimodal Session
             </button>
           ) : (
             <button 
               onClick={stopSession}
               className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/30"
             >
               <StopCircle className="fill-current" />
               Terminate Session
             </button>
           )}

           <div className="flex gap-4 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <Info className="w-6 h-6 text-yellow-500 shrink-0" />
              <p className="text-xs text-yellow-200/70 leading-relaxed">
                Requires microphone and camera permissions. This mode utilizes high-performance streaming for ultra-low latency.
              </p>
           </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const Loader2 = ({className}: {className?: string}) => <Activity className={className} />;

export default PresenceLive;
