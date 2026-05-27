import React, { useState } from 'react';
import { VideoStudySession } from '../types';
import { parseTranscript, getYoutubeId } from '../utils/parser';
import { BookOpen, Youtube, FileText, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface TranscriptImporterProps {
  onImport: (session: VideoStudySession) => void;
  savedSessions: VideoStudySession[];
  onLoadSession: (session: VideoStudySession) => void;
  onDeleteSession: (id: string) => void;
  isDarkMode?: boolean;
}

// Sample templates
const SAMPLES = [
  {
    title: "Mastering Production-Grade RAG Systems (Scaling & Observability)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Standard URL
    transcript: `(00:00) Master the transition from simple prototypes to production-grade rag systems by addressing the critical scaling, debugging, and security challenges that standard tutorials often ignore. This comprehensive course covers the entire rag pipeline from vector database optimization and observability to advanced agentic and multimodal architectures.
(00:27) You'll learn to make sure your AI applications are robust, secure, and ready for deployment. >> So, you follow a rag tutorial. It worked on 10 documents, but then you decide to add 10,000 documents and everything broke. Sound familiar? Now, here's the thing. 90% of rack systems out there, they fail in production. And they all fail for the same reasons.
(01:10) In this section, we will delve deep into the three core failure modes: bad retrieval precision, context window overflow, and hallucination propagation. We'll show you how to optimize chunking strategies, set up hierarchical node parsers, and configure hybrid search with BM25 or Cohere reranking.
(01:52) Next, we talk about vector DB indexing. You can't just use default cosine similarity settings on raw embeddings. We'll cover Hierarchical Navigable Small World (HNSW) vs Inverted File Index (IVF), and when to use scalar quantization (SQ) vs product quantization (PQ) to save up to 75% on memory costs without compromising accuracy.
(02:35) >> The secret to perfect retrieval isn't just better embeddings; it's high-quality chunking combined with metadata filtering. If you search for 'revenue Q3' but don't restrict your query by the document metadata year 2025, your vector search might retrieve Q3 data from 2021. This introduces fatal context noise. We'll build metadata scrapers that auto-populate index filters.
(03:15) Finally, we will cover observability. If you cannot see what your LLM pipeline is retrieving in real-time, you are flying blind. We will integrate OpenInference, Phoenix, or LangSmith tracing telemetry to inspect exact prompt token costs, evaluate retrieval scores, and pinpoint where context leakage occurs. Welcoming back to this advanced developer briefing session!`
  },
  {
    title: "Understanding Attention Mechanics & Transformers from Scratch",
    url: "https://www.youtube.com/watch?v=airAruvnKcY",
    transcript: `(00:00) Scaled Dot-Product Attention is the foundational mathematical innovation behind the GPT transformer architecture. In this tutorial, we will code the manual multi-head attention module from mathematical formulation to raw PyTorch tensors, exploring queries, keys, and values step by step.
(00:45) Why do we divide by the square root of the keys dimension? It's called scaling attention. When the dimension of your embeddings (d_k) becomes very large, the dot products grow extremely large in magnitude, pushing the softmax function into regions where gradients are dangerously small.
(01:20) >> Let's write the PyTorch tensor operations. First, we project our input matrix X into three separate matrices: Q, K, and V. By calculating Q multiplied by K transpose, we compute a custom compatibility matrix that measures how much focus each word should allocate to every other word in the sequence. Next, we apply the scaling factor and softmax to generate our attention map.
(02:10) Once we have the weights, we multiply them by the value matrix V to obtain a context-aware representation of each token. By stacking multiple heads, we allow the transformer network to attend to information from different representation subspaces simultaneously, capturing dual semantic and syntax structures.`
  }
];

export default function TranscriptImporter({
  onImport,
  savedSessions,
  onLoadSession,
  onDeleteSession,
  isDarkMode = false
}: TranscriptImporterProps) {
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcriptRaw, setTranscriptRaw] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title for this study session.');
      return;
    }

    const videoId = getYoutubeId(youtubeUrl);
    if (!videoId) {
      setError('Could not extract a valid YouTube video ID. Please check the URL.');
      return;
    }

    if (!transcriptRaw.trim()) {
      setError('Please upload or paste a transcript to begin.');
      return;
    }

    const segments = parseTranscript(transcriptRaw);
    if (segments.length === 0) {
      setError('Failed to parse any transcript segments. Ensure you include timestamps like (00:00) or 01:23.');
      return;
    }

    const session: VideoStudySession = {
      id: `session_${Date.now()}`,
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeId: videoId,
      transcriptRaw,
      segments,
      highlights: {},
      createdAt: Date.now(),
    };

    onImport(session);
    // Clear inputs
    setTitle('');
    setYoutubeUrl('');
    setTranscriptRaw('');
  };

  const loadSample = (index: number) => {
    const sample = SAMPLES[index];
    const videoId = getYoutubeId(sample.url)!;
    const segments = parseTranscript(sample.transcript);

    const session: VideoStudySession = {
      id: `sample_${index}_${Date.now()}`,
      title: sample.title,
      youtubeUrl: sample.url,
      youtubeId: videoId,
      transcriptRaw: sample.transcript,
      segments,
      highlights: {},
      createdAt: Date.now(),
    };

    onImport(session);
  };

  return (
    <div id="transcript-importer-root" className="w-full max-w-4xl mx-auto space-y-12 py-8 px-4 sm:px-6">
      
      {/* Hero Welcome Unit */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className={`inline-flex items-center justify-center p-3.5 rounded-2xl mb-2 transition-colors duration-200 ${
          isDarkMode ? 'bg-[#1c1c1e] text-neutral-200' : 'bg-neutral-100 text-neutral-800'
        }`}>
          <BookOpen className="w-7 h-7" id="icon-book-open" />
        </div>
        <h1 className={`text-4xl font-sans font-medium tracking-tight sm:text-5xl transition-colors duration-200 ${
          isDarkMode ? 'text-[#f0f0f0]' : 'text-neutral-900'
        }`}>
          Reading-First YouTube Study
        </h1>
        <p className={`text-base leading-relaxed font-sans transition-colors duration-200 ${
          isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          Paste a YouTube tutorial and its transcript below. Read through a clean, distraction-free text article, and instantly jump to the exact video frame to clarify doubts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        
        {/* Import Form */}
        <form 
          id="importer-form"
          onSubmit={handleSubmit} 
          className={`md:col-span-3 border rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-200 ${
            isDarkMode ? 'bg-[#1c1c1e] border-neutral-800/80 text-white' : 'bg-white border-neutral-200'
          }`}
        >
          <div className={`flex items-center justify-between border-b pb-4 transition-colors duration-200 ${
            isDarkMode ? 'border-neutral-800' : 'border-neutral-100'
          }`}>
            <h2 className="text-lg font-sans font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Start a New Session
            </h2>
            <span className="text-xs text-neutral-400 font-mono">No accounts required</span>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="session-title" className={`text-xs font-sans font-medium ${
                isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}>
                Study Session Title
              </label>
              <input
                id="session-title"
                type="text"
                placeholder="e.g. Advanced RAG Pipeline, MIT Lecture 1..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3.5 py-2 text-sm rounded-lg focus:outline-none transition-all placeholder:text-neutral-400 ${
                  isDarkMode 
                    ? 'bg-neutral-900 border-neutral-800 focus:border-neutral-600 focus:bg-[#202022] text-neutral-100' 
                    : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400 focus:bg-white text-neutral-900'
                }`}
              />
            </div>

            {/* YouTube URL */}
            <div className="space-y-1.5">
              <label htmlFor="youtube-url" className={`text-xs font-sans font-medium flex items-center gap-1 ${
                isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}>
                <Youtube className="w-3.5 h-3.5 text-red-500 inline" /> YouTube Video URL
              </label>
              <input
                id="youtube-url"
                type="url"
                placeholder="e.g. https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className={`w-full px-3.5 py-2 text-sm rounded-lg focus:outline-none transition-all placeholder:text-neutral-400 ${
                  isDarkMode 
                    ? 'bg-neutral-900 border-neutral-800 focus:border-neutral-600 focus:bg-[#202022] text-neutral-100' 
                    : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400 focus:bg-white text-neutral-900'
                }`}
              />
            </div>

            {/* Transcript Textbox */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="transcript-raw" className={`text-xs font-sans font-medium flex items-center gap-1 ${
                  isDarkMode ? 'text-neutral-300' : 'text-neutral-700'
                }`}>
                  <FileText className="w-3.5 h-3.5 text-neutral-500 inline" /> Transcript / Captions
                </label>
                <div className="group relative">
                  <span className="text-[11px] text-neutral-400 cursor-help flex items-center gap-0.5 hover:text-neutral-600 transition-colors">
                    <HelpCircle className="w-3 h-3" /> Formats supported
                  </span>
                  <div className="absolute right-0 bottom-full mb-2 bg-neutral-900 text-white text-[11px] p-2.5 rounded-lg w-56 opacity-0 pointer-events-none group-hover:opacity-100 transition-all shadow-md leading-relaxed z-10">
                    Supports line patterns containing timestamps on lines, or nested inline. e.g. <span className="font-mono text-neutral-300">(00:27) Text...</span> or <span className="font-mono text-neutral-300">1:45 Text...</span>
                  </div>
                </div>
              </div>
              <textarea
                id="transcript-raw"
                rows={7}
                placeholder="Paste transcript here. Must contain timestamps like (00:00) or 01:30 so you can tap line segments later..."
                value={transcriptRaw}
                onChange={(e) => setTranscriptRaw(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg focus:outline-none transition-all font-sans leading-relaxed ${
                  isDarkMode 
                    ? 'bg-neutral-900 border-neutral-800 focus:border-neutral-600 focus:bg-[#202022] text-neutral-100' 
                    : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400 focus:bg-white text-neutral-900'
                }`}
              />
            </div>
          </div>

          {error && (
            <p id="error-message" className="text-xs text-red-500 bg-red-50/70 border border-red-100 rounded-lg p-3 font-sans">
              {error}
            </p>
          )}

          <button
            id="btn-create-session"
            type="submit"
            className={`w-full h-11 font-sans font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isDarkMode 
                ? 'bg-white hover:bg-neutral-200 text-neutral-950 font-semibold' 
                : 'bg-neutral-950 hover:bg-neutral-800 text-white'
            }`}
          >
            Create Study Session <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Sidebar Controls & Samples */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Quick Demoplay Box */}
          <div className={`border rounded-2xl p-6 space-y-4 transition-colors duration-200 ${
            isDarkMode ? 'bg-[#1c1c1e] border-neutral-800/85' : 'bg-neutral-50 border-neutral-200/80'
          }`}>
            <h3 className={`text-sm font-sans font-semibold transition-colors duration-200 ${
              isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
            }`}>
              Try Out Pre-loaded Lectures
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Don't have a transcript or video on hand? Test the reading flow instantly with these pre-formatted studies:
            </p>

            <div className="space-y-3 pt-1">
              {SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSample(idx)}
                  className={`w-full text-left p-3.5 border rounded-xl transition-all cursor-pointer group text-xs flex flex-col gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${
                    isDarkMode 
                      ? 'bg-[#18181a] border-neutral-800 hover:border-neutral-700' 
                      : 'bg-white border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <span className={`font-sans font-medium group-hover:text-neutral-950 dark:group-hover:text-white transition-colors line-clamp-2 ${
                    isDarkMode ? 'text-neutral-300' : 'text-neutral-800'
                  }`}>
                    {sample.title}
                  </span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 block mt-1 font-sans">
                    • Includes rich structured timestamps
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Previous History List */}
          {savedSessions.length > 0 && (
            <div className={`border rounded-2xl p-6 space-y-4 transition-colors duration-200 ${
              isDarkMode ? 'bg-[#1c1c1e] border-neutral-800' : 'bg-white border-neutral-200'
            }`}>
              <div className={`flex justify-between items-center border-b pb-2 transition-colors duration-200 ${
                isDarkMode ? 'border-neutral-800' : 'border-neutral-100'
              }`}>
                <h3 className="text-sm font-sans font-semibold">
                  Recent Studies
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">LocalStorage cached</span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {savedSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg group transition-colors ${
                      isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <button
                      onClick={() => onLoadSession(session)}
                      className={`text-left flex-1 min-w-0 font-sans text-xs cursor-pointer truncate ${
                        isDarkMode 
                          ? 'text-neutral-300 hover:text-white' 
                          : 'text-neutral-700 hover:text-neutral-950 hover:underline'
                      }`}
                    >
                      {session.title}
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="text-[10px] text-neutral-400 hover:text-red-600 dark:hover:text-red-400 font-sans px-1 py-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
