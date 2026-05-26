'use client';

import { useState } from 'react';
import { 
  UploadCloud, 
  Sparkles, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  FileSpreadsheet, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  IndianRupee, 
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Instagram,
  Youtube,
  Users,
  Compass,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface Influencer {
  Name: string;
  Handle?: string;
  Platform: string;
  Category: string;
  Followers: number;
  'Engagement Rate (%)': number;
  'Avg Reel Views'?: number;
  'Past Brand Collabs'?: string;
  'Content Quality'?: string;
  'Rate (INR)'?: number;
  City?: string;
  score: number;
  reasons: string[];
  rejection_reasons?: string[];
  ai_review: string;
  influencer_type: string;
  tier: string;
}

interface AnalysisResults {
  shortlisted: Influencer[];
  rejected: Influencer[];
  total_shortlisted: number;
  total_rejected: number;
  budget_used: number;
  remaining_budget: number;
  tier23_percentage: number;
}

interface ConflictPost {
  brand: string;
  post_url: string;
  caption_snippet: string;
  date: string;
}

interface AuditResult {
  username: string;
  platform: string;
  has_competitor_conflict: boolean;
  conflict_count: number;
  conflicts: ConflictPost[];
  posts_scraped: number;
}

export default function Home() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'optimizer' | 'auditor'>('optimizer');

  // Roster Optimizer States
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters & Sorting
  const [platformFilter, setPlatformFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'followers' | 'rate'>('score');

  // Expanded Influencer Cards (Store index of expanded ones)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Exclusivity Auditor States
  const [auditHandle, setAuditHandle] = useState('');
  const [auditPlatform, setAuditPlatform] = useState('instagram');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Drag and Drop Zone State
  const [isDragOver, setIsDragOver] = useState(false);

  // Trigger Excel File Upload
  const handleUpload = async (uploadFile?: File) => {
    const targetFile = uploadFile || file;
    if (!targetFile) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      const data: AnalysisResults = await response.json();
      setResults(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run Apify Competitor Exclusivity Audit
  const handleAudit = async () => {
    if (!auditHandle) return;

    setAuditLoading(true);
    setAuditError(null);
    setAuditResult(null);

    const cleanHandle = auditHandle.trim().replace('@', '');

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/apify/check-competitor?username=${cleanHandle}&platform=${auditPlatform}`
      );

      if (!response.ok) {
        throw new Error(`Audit failed: ${response.statusText}`);
      }

      const data: AuditResult = await response.json();
      setAuditResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scraper audit failed';
      setAuditError(message);
      console.error('Audit failed:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Toggle Card Expansion
  const toggleCard = (key: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      handleUpload(droppedFile);
    }
  };

  // Filter and Sort Roster logic
  const filteredInfluencers = results?.shortlisted?.filter((influencer: Influencer) => {
    const platformMatch = platformFilter === 'All' || influencer.Platform.toLowerCase() === platformFilter.toLowerCase();
    const typeMatch = typeFilter === 'All' || influencer.influencer_type === typeFilter;
    const tierMatch = tierFilter === 'All' || influencer.tier === tierFilter;
    return platformMatch && typeMatch && tierMatch;
  }).sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'followers') return b.Followers - a.Followers;
    if (sortBy === 'rate') return (a['Rate (INR)'] || 0) - (b['Rate (INR)'] || 0);
    return 0;
  }) || [];

  return (
    <div className="min-h-screen bg-[#000819] text-white flex flex-col selection:bg-[#00FFAA] selection:text-[#000819]">
      {/* HEADER NAVBAR */}
      <header className="glass-panel border-b border-white/[0.05] py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Logo animation glow block */}
          <div className="h-10 w-10 bg-gradient-to-tr from-[#00FFAA] to-[#2252FF] rounded-xl flex items-center justify-center shadow-lg shadow-[#00FFAA]/20 animate-pulse-glow">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#00FFAA] via-white to-[#2252FF] bg-clip-text text-transparent">
              SCHBANG.AI
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              Influencer Transformation Co-Pilot
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'optimizer'
                ? 'bg-[#00FFAA] text-black shadow-md shadow-[#00FFAA]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            Roster Optimizer
          </button>
          <button
            onClick={() => setActiveTab('auditor')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'auditor'
                ? 'bg-[#00FFAA] text-black shadow-md shadow-[#00FFAA]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            Exclusivity Auditor
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col">
        
        {/* ==================== TAB 1: ROSTER OPTIMIZER ==================== */}
        {activeTab === 'optimizer' && (
          <div className="flex flex-col flex-1">
            {/* INTRO AND DROPZONE */}
            {!results && (
              <div className="flex flex-col items-center justify-center flex-1 max-w-xl mx-auto text-center py-12 md:py-24">
                <Sparkles className="h-12 w-12 text-[#00FFAA] animate-float mb-6" />
                <h2 className="text-4xl font-extrabold tracking-tight mb-4">
                  Optimize Your Influencer Campaign in Seconds
                </h2>
                <p className="text-gray-400 text-base mb-8 leading-relaxed">
                  Upload your messy influencer spreadsheet database. Our programmatic optimizer instantly ranks, scores, enforces strict competitor exclusions, and outputs a custom ₹15 Lakhs budget-optimized roster.
                </p>

                {/* DRAG & DROP ZONE */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
                    isDragOver
                      ? 'border-[#00FFAA] bg-[#00FFAA]/5 shadow-lg shadow-[#00FFAA]/10'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
                  }`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                        handleUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud className="h-14 w-14 text-gray-500 mb-4" />
                  <p className="font-bold text-lg mb-1">
                    {file ? file.name : 'Select or drag your Excel file'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .xlsx and .xls databases
                  </p>
                </div>

                {error && (
                  <div className="w-full mt-6 border border-red-500/20 bg-red-500/5 text-red-400 p-4 rounded-xl text-left flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-500">Analysis Failed</h4>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="w-full mt-8 p-6 glass-card rounded-2xl flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 text-[#00FFAA] animate-spin" />
                    <p className="font-semibold text-[#00FFAA]">AI & Optimization Pipeline Active...</p>
                    <p className="text-xs text-gray-500 text-center">
                      Scoring metrics, satisfying campaign constraints, and rotating models for AI-reviews.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* RESULTS DASHBOARD */}
            {results && (
              <div className="flex flex-col gap-8 animate-pulse-glow/[0.02] duration-1000">
                {/* BACK TO UPLOAD BUTTON */}
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    Campaign Roster Dashboard
                  </h2>
                  <button
                    onClick={() => {
                      setResults(null);
                      setFile(null);
                    }}
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-2 border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload Another File
                  </button>
                </div>

                {/* STATS HIGHLIGHT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00FFAA]" />
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Shortlisted
                      </p>
                      <Users className="h-4 w-4 text-[#00FFAA]" />
                    </div>
                    <h3 className="text-3xl font-black text-[#00FFAA] mt-4">
                      {results.total_shortlisted}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-2">Optimal Roster Size</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Rejected
                      </p>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <h3 className="text-3xl font-black text-red-500 mt-4">
                      {results.total_rejected}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-2">Hard & Soft Exclusions</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#2252FF]" />
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Budget Spent
                      </p>
                      <IndianRupee className="h-4 w-4 text-[#2252FF]" />
                    </div>
                    <h3 className="text-3xl font-black text-white mt-4">
                      ₹{results.budget_used?.toLocaleString('en-IN')}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-2">Max Limit: ₹15,00,000</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Remaining
                      </p>
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                    </div>
                    <h3 className="text-3xl font-black text-orange-400 mt-4">
                      ₹{results.remaining_budget?.toLocaleString('en-IN')}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-2">Buffer Safety Fund</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between col-span-2 lg:col-span-1">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FCD031]" />
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Tier 2/3 Ratio
                      </p>
                      <Compass className="h-4 w-4 text-[#FCD031]" />
                    </div>
                    <h3 className="text-3xl font-black text-[#FCD031] mt-4">
                      {results.tier23_percentage}%
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-2">Constraint Min: 40%</p>
                  </div>
                </div>

                {/* FILTERS & SORTER */}
                <div className="glass-card p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-[#00FFAA]" />
                    <span className="font-bold text-sm tracking-wide uppercase text-gray-400">
                      Roster Filters
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 flex-1 md:flex-none justify-end">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Platform
                      </label>
                      <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="bg-black border border-white/[0.08] px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#00FFAA] transition duration-200"
                      >
                        <option>All</option>
                        <option>Instagram</option>
                        <option>YouTube</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Creator Size
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-black border border-white/[0.08] px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#00FFAA] transition duration-200"
                      >
                        <option>All</option>
                        <option>Macro</option>
                        <option>Mid</option>
                        <option>Micro</option>
                        <option>Nano</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        Geographic Tier
                      </label>
                      <select
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                        className="bg-black border border-white/[0.08] px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#00FFAA] transition duration-200"
                      >
                        <option>All</option>
                        <option>Tier 1</option>
                        <option>Tier 2/3</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <ArrowUpDown className="h-3 w-3" /> Sort Roster By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-black border border-white/[0.08] px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#00FFAA] transition duration-200"
                      >
                        <option value="score">Composite Score</option>
                        <option value="followers">Followers Size</option>
                        <option value="rate">Rate (Lowest First)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ROSTERS GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* SHORTLISTED LIST (2/3 Grid Width) */}
                  <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-[#00FFAA]" />
                        Shortlisted Creators ({filteredInfluencers.length})
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                        Roster fits ₹15L budget exactly
                      </p>
                    </div>

                    {filteredInfluencers.length === 0 ? (
                      <div className="glass-panel p-10 rounded-2xl text-center border-dashed flex flex-col items-center">
                        <Filter className="h-8 w-8 text-gray-500 mb-2" />
                        <p className="font-bold text-gray-400">No creators match your active filters</p>
                        <p className="text-xs text-gray-500 mt-1">Try relaxing some filters in the selector bar.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredInfluencers.map((influencer: Influencer, index: number) => {
                          const cardKey = `short-${index}`;
                          const isExpanded = expandedCards[cardKey];
                          return (
                            <div key={index} className="glass-card p-5 rounded-2xl flex flex-col justify-between border-l-2 border-l-[#00FFAA] relative">
                              
                              {/* Platforms Badge overlay */}
                              <div className="absolute top-4 right-4">
                                {influencer.Platform.toLowerCase() === 'instagram' ? (
                                  <Instagram className="h-5 w-5 text-pink-500" />
                                ) : (
                                  <Youtube className="h-5 w-5 text-red-500" />
                                )}
                              </div>

                              <div>
                                {/* Name and Handle */}
                                <div className="pr-8">
                                  <h4 className="text-lg font-black tracking-tight text-white">{influencer.Name}</h4>
                                  <a 
                                    href={`https://${influencer.Platform.toLowerCase() === 'instagram' ? 'instagram' : 'youtube'}.com/${influencer.Handle?.replace('@','')}`}
                                    target="_blank" 
                                    className="text-xs text-gray-500 hover:text-[#00FFAA] transition flex items-center gap-1 mt-1 font-semibold"
                                  >
                                    {influencer.Handle || '@anonymous'}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>

                                {/* Meta Metrics Row */}
                                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                  <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Followers</p>
                                    <p className="text-xs font-black text-white mt-0.5">
                                      {influencer.Followers >= 1000000 
                                        ? `${(influencer.Followers / 1000000).toFixed(1)}M`
                                        : influencer.Followers >= 1000 
                                          ? `${(influencer.Followers / 1000).toFixed(0)}K`
                                          : influencer.Followers
                                      }
                                    </p>
                                  </div>
                                  <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Engagement</p>
                                    <p className="text-xs font-black text-white mt-0.5">{influencer['Engagement Rate (%)']}%</p>
                                  </div>
                                  <div className="bg-white/[0.02] p-2 rounded-xl border border-white/[0.04]">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Estimated Rate</p>
                                    <p className="text-xs font-black text-[#00FFAA] mt-0.5">₹{influencer['Rate (INR)']?.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>

                                {/* Score & Constraints Row */}
                                <div className="flex flex-wrap gap-2 mt-4 items-center justify-between">
                                  <div className="flex gap-2">
                                    <span className="bg-[#2252FF]/10 text-[#2252FF] border border-[#2252FF]/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                      {influencer.influencer_type}
                                    </span>
                                    <span className="bg-[#FCD031]/10 text-[#FCD031] border border-[#FCD031]/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                      {influencer.tier}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-semibold text-gray-500">Score</span>
                                    <div className="h-7 w-7 rounded-full bg-[#00FFAA]/10 border border-[#00FFAA]/30 flex items-center justify-center font-black text-[10px] text-[#00FFAA]">
                                      {influencer.score}
                                    </div>
                                  </div>
                                </div>

                                {/* Expandable details panel */}
                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-col gap-4 animate-pulse-glow/[0.01]">
                                    {/* Selection Reasons */}
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Selection Reasons</p>
                                      <ul className="flex flex-col gap-1">
                                        {influencer.reasons.map((reason, rIdx) => (
                                          <li key={rIdx} className="text-xs text-[#00FFAA] flex items-start gap-1.5">
                                            <span className="mt-1 h-1 w-1 bg-[#00FFAA] rounded-full shrink-0" />
                                            {reason}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* AI Review text */}
                                    {influencer.ai_review && (
                                      <div className="bg-[#000D26]/60 p-3 rounded-xl border border-white/[0.04]">
                                        <p className="text-[9px] font-bold text-[#2252FF] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3" /> AI Strategic Review
                                        </p>
                                        <p className="text-xs text-gray-300 leading-relaxed italic">
                                          "{influencer.ai_review}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Toggle expanded details button */}
                              <button
                                onClick={() => toggleCard(cardKey)}
                                className="w-full mt-4 py-1 flex items-center justify-center border-t border-white/[0.04] text-[10px] text-gray-400 hover:text-white transition duration-200 hover:bg-white/[0.01] rounded-b-xl"
                              >
                                {isExpanded ? (
                                  <span className="flex items-center gap-1">Collapse Details <ChevronUp className="h-3 w-3" /></span>
                                ) : (
                                  <span className="flex items-center gap-1">Expand Insights & AI Review <ChevronDown className="h-3 w-3" /></span>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* REJECTED LIST (1/3 Grid Width) */}
                  <div className="xl:col-span-1 flex flex-col gap-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                      Excluded Profiles ({results.rejected.length})
                    </h3>

                    <div className="flex flex-col gap-4 max-h-[800px] overflow-y-auto pr-1">
                      {results.rejected.map((influencer: Influencer, index: number) => {
                        const cardKey = `reject-${index}`;
                        const isExpanded = expandedCards[cardKey];
                        const isCompetitor = influencer.rejection_reasons?.some(r => r.includes('Competitor'));
                        return (
                          <div 
                            key={index} 
                            className={`glass-card p-4 rounded-xl flex flex-col justify-between border-l-2 transition duration-300 ${
                              isCompetitor ? 'border-l-red-600 bg-red-950/5' : 'border-l-red-500/50'
                            }`}
                          >
                            <div>
                              {/* Header */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-white leading-tight">{influencer.Name}</h4>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{influencer.Handle || '@anonymous'}</p>
                                </div>
                                <div className="text-[10px] font-black text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08]">
                                  Score: {influencer.score}
                                </div>
                              </div>

                              {/* Reject tag labels */}
                              {isCompetitor && (
                                <div className="mt-2.5">
                                  <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <AlertTriangle className="h-2.5 w-2.5" /> Exclusivity Breach
                                  </span>
                                </div>
                              )}

                              {/* Rejection Reasons */}
                              <div className="mt-3 flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Exclusion Reason</p>
                                <ul className="flex flex-col gap-1">
                                  {influencer.rejection_reasons?.map((reason, idx) => (
                                    <li key={idx} className="text-xs text-red-300 flex items-start gap-1 leading-relaxed">
                                      <span className="mt-1.5 h-1 w-1 bg-red-500 rounded-full shrink-0" />
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Expanded panel details */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-white/[0.05]">
                                  {/* AI Review */}
                                  {influencer.ai_review && (
                                    <div className="bg-black/60 p-2.5 rounded-lg border border-white/[0.04]">
                                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">AI Strategic Review</p>
                                      <p className="text-xs text-gray-400 leading-relaxed italic">
                                        "{influencer.ai_review}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Toggle card */}
                            <button
                              onClick={() => toggleCard(cardKey)}
                              className="w-full mt-3 pt-2 flex items-center justify-center border-t border-white/[0.04] text-[9px] text-gray-500 hover:text-white transition duration-200"
                            >
                              {isExpanded ? 'Collapse' : 'Expand AI Review'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: EXCLUSIVITY AUDITOR ==================== */}
        {activeTab === 'auditor' && (
          <div className="max-w-3xl w-full mx-auto py-6 flex flex-col gap-8 flex-1">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                Real-Time Exclusivity Auditor
              </h2>
              <p className="text-gray-400 text-sm max-w-lg mx-auto">
                Auditing social feeds for exclusivity breaches. Enter an influencer handle, and Apify's scrapers will audit their recent posts for competitor collaborations (Minimalist, mCaffeine, Mamaearth).
              </p>
            </div>

            {/* AUDIT SEARCH BLOCK */}
            <div className="glass-card p-6 rounded-2xl border border-white/[0.08] flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. shreya_kulkarni"
                  value={auditHandle}
                  onChange={(e) => setAuditHandle(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black border border-white/[0.08] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#00FFAA] transition duration-200"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <select
                  value={auditPlatform}
                  onChange={(e) => setAuditPlatform(e.target.value)}
                  className="bg-black border border-white/[0.08] px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#00FFAA] transition duration-200"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>

                <button
                  onClick={handleAudit}
                  disabled={auditLoading || !auditHandle}
                  className="flex-1 md:flex-initial bg-[#00FFAA] text-black px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-[#00FFAA]/20 transition duration-300 disabled:opacity-40 disabled:hover:shadow-none flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {auditLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Auditing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Audit Exclusivity
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ERROR BANNER */}
            {auditError && (
              <div className="border border-red-500/20 bg-red-500/5 text-red-400 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-500">Exclusivity Audit Failed</h4>
                  <p className="text-sm mt-1">{auditError}</p>
                </div>
              </div>
            )}

            {/* LOADING SCRAPER SKELETON */}
            {auditLoading && (
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-center border-dashed py-12">
                <RefreshCw className="h-10 w-10 text-[#00FFAA] animate-spin mb-2" />
                <h4 className="font-bold text-[#00FFAA] text-lg">Apify Social Media Scraper Active</h4>
                <p className="text-xs text-gray-500 max-w-sm">
                  Connecting to live API scrapers, executing run commands, fetching dataset nodes, and parsing captions for competitor mentions.
                </p>
                <div className="w-48 h-1.5 bg-white/[0.04] rounded-full overflow-hidden mt-2 border border-white/[0.08]">
                  <div className="h-full bg-gradient-to-r from-[#2252FF] to-[#00FFAA] rounded-full animate-pulse-glow" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {/* AUDIT RESULTS REPORT CARD */}
            {auditResult && (
              <div className="flex flex-col gap-6 animate-pulse-glow/[0.01]">
                
                {/* HEAD SUMMARY */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      Report: @{auditResult.username}
                      <span className="text-xs text-gray-500 capitalize bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
                        {auditResult.platform}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Audited the last {auditResult.posts_scraped} posts in feed lookback window.
                    </p>
                  </div>

                  {auditResult.has_competitor_conflict ? (
                    <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-3.5 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1.5 shrink-0">
                      <ShieldAlert className="h-5 w-5" /> Exclusivity Breach Flagged
                    </div>
                  ) : (
                    <div className="bg-[#00FFAA]/10 text-[#00FFAA] border border-[#00FFAA]/30 px-3.5 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1.5 shrink-0">
                      <ShieldCheck className="h-5 w-5" /> Exclusivity Clear
                    </div>
                  )}
                </div>

                {/* DETAILED RESULTS LIST */}
                {auditResult.has_competitor_conflict ? (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-md font-bold text-red-400 uppercase tracking-widest">
                      Exclusivity Violations Detected ({auditResult.conflict_count})
                    </h4>

                    {auditResult.conflicts.map((post, pIdx) => (
                      <div key={pIdx} className="glass-card p-5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">
                              Flagged Competitor: {post.brand}
                            </span>
                            <p className="text-xs text-gray-400 font-semibold mt-2">
                              Post Date: {post.date.substring(0,10)}
                            </p>
                          </div>
                          
                          <a 
                            href={post.post_url} 
                            target="_blank" 
                            className="text-xs text-[#00FFAA] hover:underline flex items-center gap-1 font-semibold shrink-0"
                          >
                            View Post Feed <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        <div className="bg-[#000D26]/70 p-3 rounded-xl border border-white/[0.04] mt-4">
                          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                            Breach Caption Excerpt
                          </p>
                          <p className="text-xs text-red-300 font-medium leading-relaxed italic">
                            "{post.caption_snippet}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel p-10 rounded-2xl text-center border-dashed border-[#00FFAA]/25 bg-[#00FFAA]/[0.01] flex flex-col items-center">
                    <ShieldCheck className="h-10 w-10 text-[#00FFAA] mb-3 animate-pulse-glow" />
                    <h4 className="text-lg font-bold text-white">No Competitor Collaborations Found</h4>
                    <p className="text-xs text-gray-400 max-w-sm mt-1">
                      Scraper audits report 100% compliance with brand exclusivity rules. No mentions of Minimalist, mCaffeine, or Mamaearth found.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="glass-panel border-t border-white/[0.05] py-6 text-center text-xs text-gray-500 flex flex-col gap-2">
        <p className="font-semibold tracking-wide bg-gradient-to-r from-gray-500 via-[#00FFAA] to-gray-500 bg-clip-text text-transparent">
          Influencer AI Platform v0.1.0 — Fulfilling Part 3 & 4 of Schbang Assignment Brief
        </p>
        <p className="text-[10px]">
          © {new Date().getFullYear()} Schbang Technology Services. Developed under rigid campaign constraints.
        </p>
      </footer>
    </div>
  );
}
