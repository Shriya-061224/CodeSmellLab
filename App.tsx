import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewState, UserStats, CodingTopic, TopicExample, Difficulty, AnalysisResult, SupportedLanguage, SolutionFeedback } from './types';
import { CODING_TOPICS, XP_PER_LEVEL } from './constants.tsx';
import { generateTopicExample, analyzeCodeForSmells, evaluateUserSolution } from './services/geminiService';
import { LabIcon, ChartIcon, SparklesIcon, CheckIcon, ArrowRightIcon, BrainIcon } from './components/Icons';
import CodeBlock from './components/CodeBlock';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['TypeScript', 'Python', 'Java', 'C++', 'Go'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('TypeScript');
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('cs-lab-stats');
    return saved ? JSON.parse(saved) : {
      topicsMastered: 0,
      refactorsCompleted: 0,
      currentStreak: 0,
      level: 1,
      xp: 0,
      analysisHistory: []
    };
  });
  const [selectedTopic, setSelectedTopic] = useState<CodingTopic | null>(null);
  const [currentExample, setCurrentExample] = useState<TopicExample | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [userSolution, setUserSolution] = useState('');
  const [feedback, setFeedback] = useState<SolutionFeedback | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem('cs-lab-onboarded'));
  
  // Analyzer State
  const [inputCode, setInputCode] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'diagnosis' | 'refactor'>('diagnosis');

  useEffect(() => {
    localStorage.setItem('cs-lab-stats', JSON.stringify(stats));
  }, [stats]);

  const addXP = useCallback((amount: number) => {
    setStats(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      while (newXp >= XP_PER_LEVEL) {
        newXp -= XP_PER_LEVEL;
        newLevel += 1;
      }
      return { ...prev, xp: newXp, level: newLevel };
    });
  }, []);

  const handleStartLab = async (topic: CodingTopic) => {
    setIsLoading(true);
    setSelectedTopic(topic);
    setView('lab');
    setShowSolution(false);
    setUserSolution('');
    setFeedback(null);
    try {
      const example = await generateTopicExample(topic, selectedLanguage);
      setCurrentExample(example);
    } catch (error) {
      console.error("Failed to fetch example", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!inputCode.trim()) return;
    setIsLoading(true);
    try {
      const result = await analyzeCodeForSmells(inputCode);
      const analysisObj: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        code: inputCode,
        ...result
      };
      setLatestAnalysis(analysisObj);
      setStats(prev => ({
        ...prev,
        analysisHistory: [analysisObj, ...prev.analysisHistory].slice(0, 10)
      }));
      addXP(250);
      setActiveAnalysisTab('diagnosis');
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckSolution = async () => {
    if (!currentExample || !userSolution.trim()) return;
    setIsEvaluating(true);
    try {
      const evaluation = await evaluateUserSolution(
        currentExample.naiveCode,
        userSolution,
        selectedTopic?.name || 'Topic',
        selectedLanguage
      );
      setFeedback(evaluation);
      if (evaluation.isCorrect) {
        addXP(300);
        setStats(prev => ({ 
          ...prev, 
          topicsMastered: prev.topicsMastered + 1,
          currentStreak: prev.currentStreak + 1
        }));
      }
    } catch (error) {
      console.error("Evaluation failed", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const filteredTopics = useMemo(() => {
    if (difficultyFilter === 'All') return CODING_TOPICS;
    return CODING_TOPICS.filter(topic => topic.difficulty === difficultyFilter);
  }, [difficultyFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            <LabIcon />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CodeSmell<span className="text-sky-400">Lab</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <button onClick={() => setView('dashboard')} className={`hover:text-white transition-colors ${view === 'dashboard' ? 'text-sky-400 font-bold underline decoration-sky-400 underline-offset-8' : ''}`}>Dashboard</button>
          <button onClick={() => setView('analyzer')} className={`hover:text-white transition-colors flex items-center gap-2 ${view === 'analyzer' ? 'text-sky-400 font-bold underline decoration-sky-400 underline-offset-8' : ''}`}>Architect Pro</button>
          <button onClick={() => setView('stats')} className={`hover:text-white transition-colors ${view === 'stats' ? 'text-sky-400 font-bold underline decoration-sky-400 underline-offset-8' : ''}`}>Stats</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">LVL {stats.level}</span>
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${(stats.xp / XP_PER_LEVEL) * 100}%` }} />
                </div>
             </div>
             <span className="text-[10px] text-slate-600 font-mono">{stats.xp} XP</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {view === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">Building Blocks <SparklesIcon className="text-sky-400" /></h1>
                <p className="text-slate-400 max-w-2xl text-lg">Master fundamental data structures from Python basics to C++ pointer optimization.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${selectedLanguage === lang ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{lang}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl">
                  {['All', Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.ADVANCED].map((level) => (
                    <button key={level} onClick={() => setDifficultyFilter(level as any)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${difficultyFilter === level ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{level}</button>
                  ))}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTopics.map(topic => (
                <div key={topic.id} className="group relative p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col shadow-lg backdrop-blur-sm" onClick={() => handleStartLab(topic)}>
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${topic.difficulty === Difficulty.BEGINNER ? 'bg-emerald-500/10 text-emerald-400' : topic.difficulty === Difficulty.INTERMEDIATE ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>{topic.difficulty}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">{topic.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-6">{topic.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="text-xs font-medium text-slate-500">{topic.category}</span>
                    <button className="flex items-center gap-2 text-sky-400 text-sm font-bold group-hover:translate-x-1 transition-transform">Initialize Lab <ArrowRightIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'analyzer' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">Architect Pro <SparklesIcon className="text-sky-400" /></h1>
                <p className="text-slate-400">Deep structural audit & algorithmic complexity analysis.</p>
              </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-6 space-y-4">
                <textarea value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="Paste your implementation here for an efficiency audit..." className="w-full h-[600px] bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-200 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/30 resize-none shadow-2xl" />
                <button onClick={handleRunAnalysis} disabled={isLoading || !inputCode} className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-2xl flex items-center justify-center gap-2">
                  {isLoading ? 'Analyzing Complexity...' : 'Run Audit'}
                </button>
              </div>
              <div className="lg:col-span-6 space-y-6 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                {latestAnalysis && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-2xl">
                       <div className="space-y-1">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">System Integrity</span>
                         <h2 className="text-5xl font-extrabold text-white">{latestAnalysis.score}%</h2>
                       </div>
                    </div>
                    {latestAnalysis.issues.map((item, idx) => (
                      <div key={idx} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-lg">
                        <h4 className="font-bold text-slate-100 text-lg">{item.issue}</h4>
                        <p className="text-sm text-slate-300 italic">"{item.reason}"</p>
                        <div className="p-4 bg-black/40 rounded-xl border border-slate-800">
                          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Big O Impact</p>
                          <p className="text-xs text-slate-300">{item.complexityImpact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'lab' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm"><ArrowRightIcon className="rotate-180" /> Back to Dashboard</button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">{selectedTopic?.name} Laboratory</h2>
                <p className="text-sm text-sky-400 font-mono tracking-widest uppercase">{selectedLanguage} Environment</p>
              </div>
              <div className="h-10 w-10" />
            </div>

            {isLoading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm">Initializing {selectedTopic?.name} workspace...</p>
              </div>
            ) : currentExample && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-sm">1</span> Naive Implementation</h3>
                  <CodeBlock code={currentExample.naiveCode} label={`Sub-optimal ${selectedLanguage}`} type="bad" />
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-amber-400 uppercase">Analysis</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{currentExample.explanation}</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-sm">2</span> Your Optimized Refactor</h3>
                    <textarea value={userSolution} onChange={(e) => setUserSolution(e.target.value)} placeholder={`Rewrite the ${selectedTopic?.name} using optimal ${selectedLanguage} patterns...`} className="w-full h-[300px] bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/30 resize-none shadow-xl" />
                    {!feedback && (
                      <button onClick={handleCheckSolution} disabled={isEvaluating || !userSolution.trim()} className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-xl">
                        {isEvaluating ? 'Evaluating Complexity...' : 'Validate Implementation'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {feedback && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className={`p-6 rounded-3xl border ${feedback.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'} shadow-xl`}>
                         <div className="flex items-center justify-between mb-4">
                           <h4 className={`text-xl font-bold ${feedback.isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>{feedback.isCorrect ? 'Optimization Successful!' : 'Improvement Required'}</h4>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${feedback.isCorrect ? 'bg-emerald-500' : 'bg-amber-500'}`}>{feedback.score}%</div>
                         </div>
                         <p className="text-sm text-slate-300 leading-relaxed mb-4">{feedback.comments}</p>
                      </div>
                      <button onClick={() => setShowSolution(!showSolution)} className="text-xs text-sky-400 font-bold hover:underline">
                        {showSolution ? 'HIDE EXPERT REFERENCE' : 'SHOW EXPERT REFERENCE'}
                      </button>
                      {showSolution && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                          <CodeBlock code={currentExample.optimizedCode} label="Production Reference" type="good" />
                          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Time/Space Complexity</p>
                            <p className="text-xs text-slate-400 whitespace-pre-wrap">{currentExample.complexityAnalysis}</p>
                          </div>
                        </div>
                      )}
                      <button onClick={() => setView('dashboard')} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl">Next Challenge</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 flex justify-around sticky bottom-0 z-50">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-sky-400' : 'text-slate-500'}`}><LabIcon /><span className="text-[10px] font-bold">LABS</span></button>
          <button onClick={() => setView('analyzer')} className={`flex flex-col items-center gap-1 ${view === 'analyzer' ? 'text-sky-400' : 'text-slate-500'}`}><SparklesIcon /><span className="text-[10px] font-bold">PRO</span></button>
          <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-1 ${view === 'stats' ? 'text-sky-400' : 'text-slate-500'}`}><ChartIcon /><span className="text-[10px] font-bold">STATS</span></button>
      </footer>
    </div>
  );
};

export default App;
