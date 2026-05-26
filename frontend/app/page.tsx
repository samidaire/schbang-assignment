'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

import { useState, useEffect } from 'react';
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
  Users,
  Compass,
  AlertTriangle,
  ExternalLink,
  Copy,
  X,
  MapPin,
  Zap,
  Clock,
  ThumbsUp,
  Clapperboard,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Custom lightweight SVG icons for Instagram and YouTube since modern lucide-react versions exclude them
const Instagram = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Youtube = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

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
  red_flags?: string[];
  ResponseTime?: number;
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

const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  // Regex for bold **text** and italics *text*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-[#1A73E8] font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="text-slate-600 italic font-semibold">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

function BriefRenderer({ text }: { text: string }) {
  if (!text) return null;

  // 1. Robustly parse the markdown text into sections by detecting headers with regex
  const lines = text.split('\n');
  const sections: { title: string; level: number; content: string[] }[] = [];
  let currentSection: { title: string; level: number; content: string[] } = {
    title: '',
    level: 0,
    content: [],
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    // Support standard headers like #, ##, ###, #### with flexible whitespace
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)/);

    if (headerMatch) {
      if (currentSection.title || currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headerMatch[2].replace(/\*\*|__/g, '').trim(), // strip any bold wrappers inside title
        level: headerMatch[1].length,
        content: [],
      };
    } else {
      currentSection.content.push(line);
    }
  });
  if (currentSection.title || currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  // 2. Render each section based on matched category keywords
  return (
    <div className="space-y-6 text-left">
      {sections.map((section, idx) => {
        const hasContent = section.content.some((line) => line.trim() !== '');
        if (!section.title && !hasContent) return null;

        const titleLower = section.title.toLowerCase();

        // 2a. Intro / Title Header Section (usually level 1 or 2, or no title but first section)
        if (
          section.level === 1 ||
          section.level === 2 ||
          (!section.title && idx === 0)
        ) {
          return (
            <div
              key={idx}
              className="bg-gradient-to-r from-[#4285F4]/10 via-[#34A853]/5 to-transparent border border-black/[0.06] rounded-2xl p-6 shadow-sm relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4285F4]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#34A853]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gradient-to-tr from-[#4285F4] to-[#34A853] rounded-xl flex items-center justify-center shadow-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                    Co-Pilot Brief Synthesis
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5 tracking-tight uppercase bg-gradient-to-r from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
                    {section.title || 'Campaign Creative Brief'}
                  </h3>
                </div>
              </div>

              {hasContent && (
                <div className="mt-4 text-xs md:text-sm text-slate-700 leading-relaxed border-t border-black/[0.05] pt-4 space-y-2">
                  {section.content.map((line, lIdx) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return null;
                    return <p key={lIdx}>{parseInlineMarkdown(trimmedLine)}</p>;
                  })}
                </div>
              )}
            </div>
          );
        }

        // 2b. Hook & Angle Section
        if (
          titleLower.includes('hook') ||
          titleLower.includes('angle') ||
          titleLower.includes('1.')
        ) {
          return (
            <div
              key={idx}
              className="bg-[#4285F4]/5 border border-[#4285F4]/20 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#4285F4]/40 transition duration-300"
            >
              <div className="absolute top-0 right-0 bg-[#4285F4]/10 text-[#1A73E8] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-black/[0.05]">
                Section 1
              </div>

              <h4 className="text-xs font-black text-[#1A73E8] uppercase tracking-widest flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-[#4285F4]" />
                {section.title}
              </h4>

              <div className="space-y-4">
                {section.content.map((line, lIdx) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;

                  // Check if this line is the bold hook quote
                  const isHookQuote =
                    (trimmedLine.startsWith('**') &&
                      trimmedLine.endsWith('**')) ||
                    (trimmedLine.startsWith('"') && trimmedLine.endsWith('"'));

                  if (isHookQuote) {
                    const cleanQuote = trimmedLine.replace(/\*\*|__/g, '');
                    return (
                      <div
                        key={lIdx}
                        className="bg-gradient-to-r from-[#4285F4]/10 to-[#34A853]/4 p-4 rounded-xl border-l-4 border-l-[#34A853] border border-black/[0.04]"
                      >
                        <span className="text-[9px] text-[#34A853] font-black uppercase tracking-widest block mb-1">
                          Recommended Opening Hook (0-3s)
                        </span>
                        <p className="text-xs md:text-sm text-slate-950 font-black tracking-tight leading-relaxed italic">
                          {cleanQuote}
                        </p>
                      </div>
                    );
                  }

                  // Check if this is the visual instruction (usually inside parentheses or italicized)
                  const isVisualInst =
                    (trimmedLine.startsWith('*') &&
                      trimmedLine.endsWith('*')) ||
                    (trimmedLine.startsWith('(') && trimmedLine.endsWith(')'));
                  if (isVisualInst) {
                    const cleanInst = trimmedLine.replace(/\*|__/g, '');
                    return (
                      <div
                        key={lIdx}
                        className="bg-black/[0.02] p-3 rounded-xl border border-black/[0.04] text-xs text-slate-600 italic flex gap-2"
                      >
                        <span className="text-[#4285F4] font-extrabold shrink-0 flex items-center gap-1">
                          <Clapperboard className="h-3.5 w-3.5" />
                          <span>Visual Direction:</span>
                        </span>
                        <span>{cleanInst}</span>
                      </div>
                    );
                  }

                  // Default line
                  return (
                    <p
                      key={lIdx}
                      className="text-xs md:text-sm text-slate-700 leading-relaxed"
                    >
                      {parseInlineMarkdown(trimmedLine)}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        }

        // 2c. Brand Claims Checklist Section
        if (
          titleLower.includes('claim') ||
          titleLower.includes('benefit') ||
          titleLower.includes('2.')
        ) {
          return (
            <div
              key={idx}
              className="bg-[#34A853]/5 border border-[#34A853]/25 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#34A853]/45 transition duration-300"
            >
              <div className="absolute top-0 right-0 bg-[#34A853]/10 text-[#1E8E3E] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-black/[0.05]">
                Section 2
              </div>

              <h4 className="text-xs font-black text-[#1E8E3E] uppercase tracking-widest flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-[#34A853]" />
                {section.title}
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {section.content.map((line, lIdx) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;

                  // Extract standard bullet list or number list
                  let contentText = trimmedLine;
                  let isList = false;

                  const listMatch = trimmedLine.match(/^[\*\-\•]\s+(.*)/);
                  const numMatch = trimmedLine.match(/^\d+\.\s+(.*)/);

                  if (listMatch) {
                    contentText = listMatch[1];
                    isList = true;
                  } else if (numMatch) {
                    contentText = numMatch[1];
                    isList = true;
                  }

                  if (isList) {
                    const labelMatch = contentText.match(/^\*\*(.*?)\*\*:(.*)/);
                    if (labelMatch) {
                      return (
                        <div
                          key={lIdx}
                          className="bg-black/[0.01] p-3 rounded-xl border border-black/[0.04] hover:bg-black/[0.02] transition flex items-start gap-3"
                        >
                          <div className="h-5 w-5 rounded-full bg-[#34A853]/10 border border-[#34A853]/25 flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldCheck className="h-3 w-3 text-[#34A853]" />
                          </div>
                          <div>
                            <strong className="text-slate-900 text-xs md:text-sm font-extrabold tracking-wide block md:inline mr-1">
                              {labelMatch[1]}:
                            </strong>
                            <span className="text-slate-700 text-xs md:text-sm leading-relaxed">
                              {parseInlineMarkdown(labelMatch[2])}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={lIdx}
                        className="bg-black/[0.01] p-3 rounded-xl border border-black/[0.04] flex items-start gap-3"
                      >
                        <div className="h-5 w-5 rounded-full bg-[#34A853]/10 border border-[#34A853]/25 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="h-3 w-3 text-[#34A853]" />
                        </div>
                        <span className="text-slate-700 text-xs md:text-sm leading-relaxed">
                          {parseInlineMarkdown(contentText)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <p
                      key={lIdx}
                      className="text-xs md:text-sm text-slate-700 leading-relaxed pl-1"
                    >
                      {parseInlineMarkdown(trimmedLine)}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        }

        // 2d. Narrative Flow / Step-by-Step Flow Section
        if (
          titleLower.includes('structure') ||
          titleLower.includes('flow') ||
          titleLower.includes('3.') ||
          titleLower.includes('sequence')
        ) {
          const steps: {
            number: string;
            title: string;
            time: string;
            details: string[];
          }[] = [];
          let currentStep: {
            number: string;
            title: string;
            time: string;
            details: string[];
          } = { number: '', title: '', time: '', details: [] };

          section.content.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const stepMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
            if (stepMatch) {
              if (currentStep.number) {
                steps.push(currentStep);
              }
              const num = stepMatch[1];
              let rest = stepMatch[2];

              let time = '';
              const timeMatch = rest.match(/\((.*?s)\)/);
              if (timeMatch) {
                time = timeMatch[1];
                rest = rest.replace(/\(.*?\)/, '').trim();
              }

              let stepTitle = '';
              const titleMatch =
                rest.match(/^\*\*(.*?)\*\*:(.*)/) ||
                rest.match(/^\*\*(.*?)\*\*(.*)/);
              if (titleMatch) {
                stepTitle = titleMatch[1];
                rest = titleMatch[2].trim();
              } else {
                stepTitle = rest;
                rest = '';
              }

              stepTitle = stepTitle
                .replace(/^:\s*/, '')
                .replace(/:\s*$/, '')
                .trim();

              currentStep = {
                number: num,
                title: stepTitle,
                time: time || '0-5s',
                details: rest ? [rest] : [],
              };
            } else {
              if (currentStep.number) {
                const bulletMatch = trimmedLine.match(/^[\*\-\•]\s+(.*)/);
                if (bulletMatch) {
                  currentStep.details.push(bulletMatch[1]);
                } else {
                  currentStep.details.push(trimmedLine);
                }
              } else {
                steps.push({
                  number: '',
                  title: '',
                  time: '',
                  details: [trimmedLine],
                });
              }
            }
          });
          if (currentStep.number) {
            steps.push(currentStep);
          }

          return (
            <div
              key={idx}
              className="bg-[#4285F4]/5 border border-[#4285F4]/20 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#4285F4]/40 transition duration-300"
            >
              <div className="absolute top-0 right-0 bg-[#4285F4]/10 text-[#1A73E8] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-black/[0.05]">
                Section 3
              </div>

              <h4 className="text-xs font-black text-[#1A73E8] uppercase tracking-widest flex items-center gap-2 mb-6">
                <Compass className="h-4 w-4 text-[#34A853]" />
                {section.title}
              </h4>

              <div className="relative pl-6 md:pl-8 border-l border-black/[0.08] ml-2.5 space-y-6">
                {steps.map((step, sIdx) => {
                  if (!step.number) {
                    return (
                      <div
                        key={sIdx}
                        className="text-xs md:text-sm text-slate-500 mb-4 pl-2 leading-relaxed"
                      >
                        {step.details.map((d, dIdx) => (
                          <p key={dIdx}>{parseInlineMarkdown(d)}</p>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div key={sIdx} className="relative group/item">
                      <div className="absolute -left-[35px] md:-left-[43px] top-1.5 h-6 w-6 rounded-full bg-white border-2 border-[#4285F4] group-hover/item:border-[#34A853] flex items-center justify-center font-black text-[9px] text-[#4285F4] group-hover/item:text-[#34A853] transition duration-300 shadow-sm">
                        {step.number}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h5 className="font-extrabold text-slate-900 text-xs md:text-sm tracking-tight">
                          {step.title}
                        </h5>
                        {step.time && (
                          <span className="bg-[#4285F4]/10 text-[#1A73E8] border border-[#4285F4]/20 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase flex items-center justify-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{step.time}</span>
                          </span>
                        )}
                      </div>

                      <div className="bg-black/[0.01] border border-black/[0.03] p-3 rounded-xl space-y-1.5 group-hover/item:border-black/[0.06] transition duration-300">
                        {step.details.map((detail, dIdx) => {
                          const isBullet =
                            detail.startsWith('-') || detail.startsWith('*');
                          const cleanDetail = isBullet
                            ? detail.slice(1).trim()
                            : detail;

                          return (
                            <div
                              key={dIdx}
                              className="text-xs md:text-sm text-slate-700 leading-relaxed flex items-start gap-1.5"
                            >
                              <span className="mt-1.5 h-1 w-1 bg-[#34A853] rounded-full shrink-0" />
                              <span>{parseInlineMarkdown(cleanDetail)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 2e. Tonality & Compliance / Brand Rules Section
        if (
          titleLower.includes('tonality') ||
          titleLower.includes('compliance') ||
          titleLower.includes('rules') ||
          titleLower.includes('4.')
        ) {
          const positiveToneLines: string[] = [];
          const complianceBans: string[] = [];

          section.content.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const isNegative =
              trimmedLine.toLowerCase().includes('avoid') ||
              trimmedLine.toLowerCase().includes('warning') ||
              trimmedLine.toLowerCase().includes('no ') ||
              trimmedLine.toLowerCase().includes('strict') ||
              trimmedLine.toLowerCase().includes('not ');
            if (isNegative) {
              complianceBans.push(trimmedLine);
            } else {
              positiveToneLines.push(trimmedLine);
            }
          });

          return (
            <div
              key={idx}
              className="bg-[#FBBC05]/5 border border-[#FBBC05]/20 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-[#FBBC05]/40 transition duration-300"
            >
              <div className="absolute top-0 right-0 bg-[#FBBC05]/10 text-[#B06000] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-black/[0.05]">
                Section 4
              </div>

              <h4 className="text-xs font-black text-[#B06000] uppercase tracking-widest flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-[#FBBC05] animate-pulse" />
                {section.title}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#34A853]/5 border border-[#34A853]/10 p-4 rounded-xl space-y-3">
                  <span className="bg-[#34A853]/10 text-[#1E8E3E] border border-[#34A853]/25 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded inline-flex items-center gap-1">
                    <ThumbsUp className="h-2.5 w-2.5" />
                    <span>Recommended Tonality</span>
                  </span>

                  <div className="space-y-2">
                    {positiveToneLines.map((line, lIdx) => {
                      let textToRender = line.replace(/^[\*\-\•\d\.]\s*/, '');
                      return (
                        <div
                          key={lIdx}
                          className="text-xs md:text-sm text-slate-700 leading-relaxed flex items-start gap-2"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 bg-[#34A853] rounded-full shrink-0" />
                          <span>{parseInlineMarkdown(textToRender)}</span>
                        </div>
                      );
                    })}
                    {positiveToneLines.length === 0 && (
                      <div className="text-xs md:text-sm text-slate-500 leading-relaxed italic">
                        Educative, aesthetic, friendly, and dermatology-centric.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#EA4335]/5 border border-[#EA4335]/10 p-4 rounded-xl space-y-3">
                  <span className="bg-[#EA4335]/10 text-[#D93025] border border-[#EA4335]/25 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded inline-flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#D93025]" />{' '}
                    Strict Compliance Bans
                  </span>

                  <div className="space-y-2">
                    {complianceBans.map((line, lIdx) => {
                      let textToRender = line.replace(/^[\*\-\•\d\.]\s*/, '');
                      return (
                        <div
                          key={lIdx}
                          className="text-xs md:text-sm text-[#D93025] leading-relaxed flex items-start gap-2"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 bg-[#EA4335] rounded-full shrink-0" />
                          <span>{parseInlineMarkdown(textToRender)}</span>
                        </div>
                      );
                    })}
                    {complianceBans.length === 0 && (
                      <div className="text-xs md:text-sm text-[#D93025] leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 bg-[#EA4335] rounded-full shrink-0" />
                        <span>
                          Do not claim "cures skin conditions". Avoid comparing
                          directly to other competitor brands.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // 2f. Default Card Layout for General Sections (e.g. How to use, Footer notes)
        return (
          <div
            key={idx}
            className="bg-black/[0.01] border border-black/[0.04] rounded-2xl p-5 shadow-sm"
          >
            {section.title && (
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-black/[0.03] pb-1.5">
                {section.title}
              </h4>
            )}

            <div className="space-y-2">
              {section.content.map((line, lIdx) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;

                const bulletMatch = trimmedLine.match(/^[\*\-\•]\s+(.*)/);
                if (bulletMatch) {
                  return (
                    <div
                      key={lIdx}
                      className="text-xs md:text-sm text-slate-700 leading-relaxed flex items-start gap-1.5 pl-2"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 bg-slate-400 rounded-full shrink-0" />
                      <span>{parseInlineMarkdown(bulletMatch[1])}</span>
                    </div>
                  );
                }

                return (
                  <p
                    key={lIdx}
                    className="text-xs md:text-sm text-slate-700 leading-relaxed"
                  >
                    {parseInlineMarkdown(trimmedLine)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  // Tabs
  const [activeTab, setActiveTab] = useState<
    'optimizer' | 'auditor' | 'analytics'
  >('optimizer');

  // Roster Optimizer States
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);

  // Filters & Sorting
  const [platformFilter, setPlatformFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'followers' | 'rate'>('score');
  const [showExcluded, setShowExcluded] = useState(false);

  // Expanded Influencer Cards (Store index of expanded ones)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );

  // Exclusivity Auditor States
  const [auditHandle, setAuditHandle] = useState('');
  const [auditPlatform, setAuditPlatform] = useState('instagram');
  const [auditLookback, setAuditLookback] = useState(90);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Drag and Drop Zone State
  const [isDragOver, setIsDragOver] = useState(false);

  // Live AI Reviews States (maps influencer Name -> live review string)
  const [liveReviews, setLiveReviews] = useState<Record<string, string>>({});
  const [liveReviewsLoading, setLiveReviewsLoading] = useState<
    Record<string, boolean>
  >({});

  // Campaign Analytics & Trends States
  const [trendsInterval, setTrendsInterval] = useState<
    'weekly' | 'monthly' | 'quarterly'
  >('monthly');
  const [trendsMetric, setTrendsMetric] = useState<
    'budget' | 'engagement' | 'score' | 'creators'
  >('budget');
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Dynamic features for Analytics Workspace
  const [selectedPeriodDetail, setSelectedPeriodDetail] = useState<any | null>(
    null,
  );
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<number[]>([]);

  const fetchAiInsights = async () => {
    setAiInsightsLoading(true);
    setAiInsightsError(null);
    try {
      const res = await fetch(`${API_BASE}/analytics/ai-insights`);
      if (!res.ok) throw new Error('Failed to load strategic AI insights');
      const json = await res.json();
      setAiInsights(json.insights);
    } catch (err) {
      console.error(err);
      setAiInsightsError(
        'Could not retrieve AI CMO insights. Ensure backend server is connected.',
      );
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const trendsRes = await fetch(
        `${API_BASE}/analytics/trends?interval=${trendsInterval}`,
      );
      if (!trendsRes.ok) throw new Error('Failed to load trends data');
      const trendsJson = await trendsRes.json();
      setTrendsData(trendsJson);

      // Autoselect the latest period when trends are loaded
      if (trendsJson && trendsJson.length > 0) {
        setSelectedPeriodDetail(trendsJson[trendsJson.length - 1]);
      }

      const listRes = await fetch(`${API_BASE}/analytics/campaigns`);
      if (!listRes.ok) throw new Error('Failed to load campaigns list');
      const listJson = await listRes.json();
      setCampaignHistory(listJson);
    } catch (err) {
      console.error(err);
      setAnalyticsError(
        'Failed to connect to backend server. Make sure FastAPI server is running on port 8000.',
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab, trendsInterval]);

  // Load default optimized roster automatically on initial mount
  useEffect(() => {
    const loadDefaultRoster = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/analyze/default`);
        if (!response.ok) {
          // If default database is not available (404), that's okay - user can upload manually
          if (response.status === 404) {
            console.log('Default database not available - user can upload manually');
          } else {
            throw new Error('Failed to load default roster');
          }
        } else {
          const data = await response.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Could not auto-load default roster:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDefaultRoster();
  }, []);

  const handleDeleteCampaign = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this campaign snapshot from history?',
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE}/analytics/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Deletion failed');
      fetchAnalyticsData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete campaign from history.');
    }
  };

  const handleFetchLiveReview = async (influencer: Influencer) => {
    const key = influencer.Name;
    setLiveReviewsLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const payload = {
        influencer: {
          Name: influencer.Name,
          Handle: influencer.Handle,
          Platform: influencer.Platform,
          Category: influencer.Category,
          City: influencer.City,
          Followers: influencer.Followers,
          'Engagement Rate (%)': influencer['Engagement Rate (%)'],
          'Avg Reel Views': influencer['Avg Reel Views'],
          'Rate (INR)': influencer['Rate (INR)'],
          'Past Brand Collabs': influencer['Past Brand Collabs'],
          'Content Quality': influencer['Content Quality'],
          'Competitor Collab?':
            influencer['Past Brand Collabs']?.includes('Minimalist') ||
            influencer['Past Brand Collabs']?.includes('mCaffeine')
              ? 'Yes'
              : 'No',
          'Avg Response Time (hrs)': 24,
          Notes: influencer.reasons.join(', '),
        },
      };

      const response = await fetch(`${API_BASE}/live-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to get live review');
      const data = await response.json();
      setLiveReviews((prev) => ({ ...prev, [key]: data.ai_review }));
    } catch (err) {
      console.error(err);
      setLiveReviews((prev) => ({
        ...prev,
        [key]: 'Error generating live review. Please check backend connection.',
      }));
    } finally {
      setLiveReviewsLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Personalized AI Creative Briefs States
  const [briefs, setBriefs] = useState<Record<string, string>>({});
  const [briefsLoading, setBriefsLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedBriefInfluencer, setSelectedBriefInfluencer] =
    useState<Influencer | null>(null);

  const handleFetchBrief = async (influencer: Influencer) => {
    const key = influencer.Name;
    setSelectedBriefInfluencer(influencer); // Open modal instantly to show loading layout

    // Cache check
    if (briefs[key]) return;

    setBriefsLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const payload = {
        influencer: {
          Name: influencer.Name,
          Handle: influencer.Handle,
          Platform: influencer.Platform,
          Category: influencer.Category,
          City: influencer.City,
          Followers: influencer.Followers,
          'Engagement Rate (%)': influencer['Engagement Rate (%)'],
          'Avg Reel Views': influencer['Avg Reel Views'],
          'Rate (INR)': influencer['Rate (INR)'],
          'Past Brand Collabs': influencer['Past Brand Collabs'],
          'Content Quality': influencer['Content Quality'],
          'Competitor Collab?': 'No',
          'Avg Response Time (hrs)': 24,
          Notes: influencer.reasons.join(', '),
        },
      };

      const response = await fetch(`${API_BASE}/live-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to get creative brief');
      const data = await response.json();
      setBriefs((prev) => ({ ...prev, [key]: data.brief }));
    } catch (err) {
      console.error(err);
      setBriefs((prev) => ({
        ...prev,
        [key]:
          '### [Warning] Error Generating Brief\n\nFailed to connect to the backend server. Please verify the FastAPI process is running on port 8000.',
      }));
    } finally {
      setBriefsLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

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

      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Server returned error: ${response.status} ${response.statusText}`,
        );
      }

      const data: AnalysisResults = await response.json();
      setResults(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
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
        `${API_BASE}/apify/check-competitor?username=${cleanHandle}&platform=${auditPlatform}&lookback_days=${auditLookback}`,
      );

      if (!response.ok) {
        throw new Error(`Audit failed: ${response.statusText}`);
      }

      const data: AuditResult = await response.json();
      setAuditResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Scraper audit failed';
      setAuditError(message);
      console.error('Audit failed:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Toggle Card Expansion
  const toggleCard = (key: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [key]: !prev[key],
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
  const filteredInfluencers =
    results?.shortlisted
      ?.filter((influencer: Influencer) => {
        const platformMatch =
          platformFilter === 'All' ||
          influencer.Platform.toLowerCase() === platformFilter.toLowerCase();
        const typeMatch =
          typeFilter === 'All' || influencer.influencer_type === typeFilter;
        const tierMatch =
          tierFilter === 'All' || influencer.tier === tierFilter;
        return platformMatch && typeMatch && tierMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'followers') return b.Followers - a.Followers;
        if (sortBy === 'rate')
          return (a['Rate (INR)'] || 0) - (b['Rate (INR)'] || 0);
        return 0;
      }) || [];

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as any)}
      className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col selection:bg-[#4285F4]/10 selection:text-[#4285F4] relative overflow-hidden"
    >
      {/* Ambient Google-colored background blur blobs */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#4285F4]/[0.035] rounded-full blur-[120px] pointer-events-none translate-x-1/4 -translate-y-1/4 animate-blob-1" />
      <div className="absolute top-[20%] left-0 w-[400px] h-[400px] bg-[#EA4335]/[0.03] rounded-full blur-[120px] pointer-events-none -translate-x-1/4 animate-blob-2" />
      <div className="absolute top-[50%] right-0 w-[450px] h-[450px] bg-[#FBBC05]/[0.025] rounded-full blur-[130px] pointer-events-none translate-x-1/3 animate-blob-3" />
      <div className="absolute bottom-0 left-[10%] w-[500px] h-[500px] bg-[#34A853]/[0.025] rounded-full blur-[140px] pointer-events-none -translate-y-1/10 animate-blob-4" />

      {/* HEADER NAVBAR */}
      <header className="bg-white/85 backdrop-blur-md border-b border-border py-3 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-sm/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-[#4285F4] via-[#EA4335] to-[#FBBC05] rounded-lg flex items-center justify-center shadow-md animate-float">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center">
              <span className="bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] bg-clip-text text-transparent">
                Schbang
              </span>
              <span className="bg-gradient-to-r from-[#34A853] to-[#4285F4] bg-clip-text text-transparent ml-0.5 font-extrabold">
                AI
              </span>
            </h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-extrabold">
              Influencer Transformation Co-Pilot
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <TabsList className="flex bg-[#F1F3F4] p-[3px] rounded-lg border border-border h-auto">
          <TabsTrigger
            value="optimizer"
            className="px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-[#4285F4] data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer"
          >
            Roster Optimizer
          </TabsTrigger>
          <TabsTrigger
            value="auditor"
            className="px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-[#4285F4] data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer"
          >
            Exclusivity Auditor
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-[#4285F4] data-[state=active]:shadow-sm text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer"
          >
            Analytics & Trends
          </TabsTrigger>
        </TabsList>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col">
        {/* ==================== TAB 1: ROSTER OPTIMIZER ==================== */}
        <TabsContent value="optimizer" className="flex flex-col flex-1">
          {/* UPLOAD PROMPT - When user clicks "Upload Different File" */}
          {showUploadPrompt && !results && (
            <div className="flex flex-col items-center justify-center flex-1 max-w-lg mx-auto text-center py-16 md:py-24">
              <div className="h-12 w-12 rounded-2xl bg-[#4285F4]/5 flex items-center justify-center mb-6">
                <UploadCloud className="h-6 w-6 text-[#4285F4]" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">
                Upload Custom Spreadsheet
              </h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-sm">
                Upload your own influencer list to optimize and shortlist based
                on campaign constraints.
              </p>

              {/* DRAG & DROP ZONE */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full p-8 rounded-2xl border border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                  isDragOver
                    ? 'border-[#FBBC05] bg-[#FBBC05]/[0.02] shadow-sm'
                    : 'border-border bg-white hover:border-[#FBBC05]/50 hover:bg-white/80'
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
                      setShowUploadPrompt(false);
                      handleUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <UploadCloud className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-bold text-sm text-foreground mb-1">
                  {file ? file.name : 'Select or drag your Excel file'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports .xlsx and .xls formats
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadPrompt(false);
                }}
                className="mt-6 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 rounded-lg hover:bg-muted h-auto cursor-pointer font-bold transition"
              >
                Back to Default Roster
              </Button>

              {error && (
                <Alert
                  variant="destructive"
                  className="w-full mt-6 border border-red-200 bg-red-50 text-[#EA4335] p-3.5 rounded-xl text-left flex items-start gap-3"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <AlertTitle className="font-bold text-xs">
                      Upload Failed
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-0.5">
                      {error}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
          )}

          {/* LOADING STATE - Auto-loading default roster */}
          {!showUploadPrompt && loading && (
            <div className="flex flex-col items-center justify-center flex-1 max-w-lg mx-auto text-center py-16 md:py-24">
              <div className="h-12 w-12 rounded-2xl bg-[#4285F4]/5 flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-[#4285F4]" />
              </div>
              <Card className="w-full p-5 border border-border rounded-xl flex flex-col items-center gap-2.5">
                <RefreshCw className="h-6 w-6 text-[#4285F4] animate-spin" />
                <p className="font-bold text-xs text-[#4285F4]">
                  AI & Optimization Pipeline Active...
                </p>
                <p className="text-[10px] text-muted-foreground text-center max-w-xs">
                  Scoring metrics, satisfying campaign constraints, and rotating
                  models for AI-reviews.
                </p>
              </Card>
            </div>
          )}

          {/* ERROR STATE - Show error if loading fails */}
          {!showUploadPrompt && error && !loading && (
            <div className="flex flex-col items-center justify-center flex-1 max-w-lg mx-auto text-center py-16 md:py-24">
              <div className="h-12 w-12 rounded-2xl bg-[#EA4335]/5 flex items-center justify-center mb-6">
                <AlertTriangle className="h-6 w-6 text-[#EA4335]" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">
                Unable to Load Roster
              </h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-sm">
                The default roster could not be loaded. Please try again or
                upload a custom Excel file.
              </p>

              {/* FALLBACK UPLOAD OPTION */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full p-8 rounded-2xl border border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                  isDragOver
                    ? 'border-[#FBBC05] bg-[#FBBC05]/[0.02] shadow-sm'
                    : 'border-border bg-white hover:border-[#FBBC05]/50 hover:bg-white/80'
                }`}
                onClick={() =>
                  document.getElementById('file-upload-error')?.click()
                }
              >
                <input
                  type="file"
                  id="file-upload-error"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      handleUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <UploadCloud className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-bold text-sm text-foreground mb-1">
                  {file ? file.name : 'Select or drag your Excel file'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports .xlsx and .xls formats
                </p>
              </div>

              <Alert
                variant="destructive"
                className="w-full mt-6 border border-red-200 bg-red-50 text-[#EA4335] p-3.5 rounded-xl text-left flex items-start gap-3"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <AlertTitle className="font-bold text-xs">
                    Analysis Failed
                  </AlertTitle>
                  <AlertDescription className="text-xs mt-0.5">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}

          {/* RESULTS DASHBOARD */}
          {results && (
            <div className="flex flex-col gap-6">
              {/* BACK TO UPLOAD HEADER */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                      Campaign Roster Workspace
                    </h2>
                    <Badge className="bg-[#FBBC05]/10 border border-[#FBBC05]/20 text-[#B78103] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse-glow inline-flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-[#B78103]" /> Budget
                      Optimized
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage and inspect optimized rosters under rigid ₹15L
                    campaign limits
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadPrompt(true);
                    setResults(null);
                    setFile(null);
                    setError(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 rounded-lg hover:bg-muted h-auto cursor-pointer font-bold transition"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Upload Different File
                </Button>
              </div>

              {/* UNIFIED HORIZONTAL METRICS RIBBON */}
              <Card className="bg-white border border-border rounded-2xl p-5 shadow-sm/5 grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-2 md:gap-0 relative overflow-hidden">
                {/* Google Products Linear Gradient Line Accent */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] via-[#34A853]" />

                {/* Segment 1: Shortlisted */}
                <div className="flex flex-col justify-between h-full pt-1 md:pt-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Shortlisted
                    </span>
                    <Badge className="bg-[#4285F4]/10 hover:bg-[#4285F4]/15 text-[#4285F4] border-none text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      Active
                    </Badge>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-3xl font-black tracking-tight text-[#4285F4]">
                      {results.total_shortlisted}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Optimal size
                    </span>
                  </div>
                </div>

                {/* Segment 2: Excluded */}
                <div className="flex flex-col justify-between h-full pl-4 md:pl-6 pt-1 md:pt-0 border-l border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Excluded
                    </span>
                    <Badge className="bg-[#EA4335]/10 hover:bg-[#EA4335]/15 text-[#EA4335] border-none text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      Breaches
                    </Badge>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-3xl font-black tracking-tight text-[#EA4335]">
                      {results.total_rejected}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Exclusion flags
                    </span>
                  </div>
                </div>

                {/* Segment 3: Budget Spent */}
                <div className="flex flex-col justify-between h-full pl-0 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Budget Spent
                    </span>
                    <Badge className="bg-[#34A853]/10 hover:bg-[#34A853]/15 text-[#34A853] border-none text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      Spent
                    </Badge>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black tracking-tight text-[#34A853]">
                      ₹{results.budget_used?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Limit: ₹15,00,000
                    </span>
                  </div>
                </div>

                {/* Segment 4: Remaining */}
                <div className="flex flex-col justify-between h-full pl-4 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 border-l border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Remaining
                    </span>
                    <Badge className="bg-[#FBBC05]/10 hover:bg-[#FBBC05]/15 text-[#B78103] border-none text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      Buffer
                    </Badge>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-black tracking-tight text-[#B78103]">
                      ₹{results.remaining_budget?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">
                      Safety buffer
                    </span>
                  </div>
                </div>

                {/* Segment 5: Tier 2/3 Ratio */}
                <div className="flex flex-col justify-between h-full pl-0 md:pl-6 pt-4 md:pt-0 col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tier 2/3 Ratio
                    </span>
                    <Badge className="bg-[#4285F4]/10 hover:bg-[#4285F4]/15 text-[#4285F4] border-none text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      Min 40%
                    </Badge>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-3xl font-black tracking-tight text-[#4285F4]">
                      {results.tier23_percentage}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      City representation
                    </span>
                  </div>
                </div>
              </Card>

              {/* FILTERS & SORTER CAPSULES */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-border/80">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-[#4285F4]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filters
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter Platform */}
                  <div className="flex items-center gap-1.5 bg-white border border-border pl-2.5 pr-1 py-1 rounded-full text-xs font-semibold hover:border-muted-foreground/30 transition">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      Platform:
                    </span>
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="bg-transparent border-none py-0.5 pr-6 pl-1 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                    >
                      <option className="bg-white text-foreground">All</option>
                      <option className="bg-white text-foreground">
                        Instagram
                      </option>
                      <option className="bg-white text-foreground">
                        YouTube
                      </option>
                    </select>
                  </div>

                  {/* Filter Creator Size */}
                  <div className="flex items-center gap-1.5 bg-white border border-border pl-2.5 pr-1 py-1 rounded-full text-xs font-semibold hover:border-muted-foreground/30 transition">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      Size:
                    </span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-transparent border-none py-0.5 pr-6 pl-1 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                    >
                      <option className="bg-white text-foreground">All</option>
                      <option className="bg-white text-foreground">
                        Macro
                      </option>
                      <option className="bg-white text-foreground">Mid</option>
                      <option className="bg-white text-foreground">
                        Micro
                      </option>
                      <option className="bg-white text-foreground">Nano</option>
                    </select>
                  </div>

                  {/* Filter Geographic Tier */}
                  <div className="flex items-center gap-1.5 bg-white border border-border pl-2.5 pr-1 py-1 rounded-full text-xs font-semibold hover:border-muted-foreground/30 transition">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      Tier:
                    </span>
                    <select
                      value={tierFilter}
                      onChange={(e) => setTierFilter(e.target.value)}
                      className="bg-transparent border-none py-0.5 pr-6 pl-1 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                    >
                      <option className="bg-white text-foreground">All</option>
                      <option className="bg-white text-foreground">
                        Tier 1
                      </option>
                      <option className="bg-white text-foreground">
                        Tier 2/3
                      </option>
                    </select>
                  </div>

                  {/* Sort Order Selector */}
                  <div className="flex items-center gap-1.5 bg-white border border-border pl-2.5 pr-1 py-1 rounded-full text-xs font-semibold hover:border-muted-foreground/30 transition">
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      Sort:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent border-none py-0.5 pr-6 pl-1 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                    >
                      <option
                        className="bg-white text-foreground"
                        value="score"
                      >
                        Composite Score
                      </option>
                      <option
                        className="bg-white text-foreground"
                        value="followers"
                      >
                        Followers Size
                      </option>
                      <option className="bg-white text-foreground" value="rate">
                        Rate (Lowest First)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Responsive Collapsible Excluded Profiles Toggle */}
              <div className="flex justify-between items-center xl:hidden mt-2">
                <Button
                  onClick={() => setShowExcluded(!showExcluded)}
                  variant="outline"
                  className="w-full text-xs border border-border bg-white px-4 py-2.5 rounded-xl hover:bg-muted text-foreground flex items-center justify-center gap-2 font-bold cursor-pointer transition shadow-sm"
                >
                  <ShieldAlert className="h-4 w-4 text-[#EA4335]" />
                  <span>
                    {showExcluded
                      ? 'Hide Excluded Profiles'
                      : `Show Excluded Profiles (${results.rejected.length})`}
                  </span>
                </Button>
              </div>

              {/* ROSTERS GRID */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* SHORTLISTED LIST (2/3 Grid Width) */}
                <div className="xl:col-span-2 flex flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-bold flex items-center gap-2 text-foreground">
                      <ShieldCheck className="h-5 w-5 text-[#34A853]" />
                      Shortlisted Creators ({filteredInfluencers.length})
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                      Optimal budget allocation
                    </p>
                  </div>

                  {filteredInfluencers.length === 0 ? (
                    <Card className="bg-white border border-border border-dashed p-12 rounded-2xl text-center flex flex-col items-center justify-center">
                      <Filter className="h-6 w-6 text-muted-foreground/60 mb-2" />
                      <p className="font-bold text-sm text-foreground/80">
                        No creators match filters
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Try relaxing Platform, Size, or Tier selectors.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredInfluencers.map(
                        (influencer: Influencer, index: number) => {
                          return (
                            <Card
                              key={index}
                              className="glass-card p-5 rounded-2xl flex flex-col justify-between relative group"
                            >
                              {/* Platforms Badge overlay */}
                              <div className="absolute top-4 right-4">
                                {influencer.Platform.toLowerCase() ===
                                'instagram' ? (
                                  <Badge
                                    variant="outline"
                                    className="text-pink-600 bg-pink-50/50 border-pink-100 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                  >
                                    Instagram
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[#EA4335] bg-[#EA4335]/5 border-[#EA4335]/15 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                  >
                                    YouTube
                                  </Badge>
                                )}
                              </div>

                              <div>
                                {/* Name and Handle */}
                                <div className="pr-16">
                                  <h4 className="text-md font-extrabold tracking-tight text-foreground leading-snug">
                                    {influencer.Name}
                                  </h4>
                                  <a
                                    href={`https://${influencer.Platform.toLowerCase() === 'instagram' ? 'instagram' : 'youtube'}.com/${influencer.Handle?.replace('@', '')}`}
                                    target="_blank"
                                    className="text-[10px] text-muted-foreground hover:text-[#4285F4] transition inline-flex items-center gap-0.5 mt-0.5 font-bold"
                                  >
                                    {influencer.Handle || '@anonymous'}
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                </div>

                                {/* Compact Metric Widgets */}
                                <div className="grid grid-cols-3 gap-1.5 mt-4">
                                  <div className="bg-[#F8F9FA] p-2 rounded-xl border border-border/40 text-center">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                                      Followers
                                    </p>
                                    <p className="text-xs font-black text-foreground mt-0.5">
                                      {influencer.Followers >= 1000000
                                        ? `${(influencer.Followers / 1000000).toFixed(1)}M`
                                        : influencer.Followers >= 1000
                                          ? `${(influencer.Followers / 1000).toFixed(0)}K`
                                          : influencer.Followers}
                                    </p>
                                  </div>
                                  <div className="bg-[#F8F9FA] p-2 rounded-xl border border-border/40 text-center">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                                      Engagement
                                    </p>
                                    <p className="text-xs font-black text-foreground mt-0.5">
                                      {influencer['Engagement Rate (%)']}%
                                    </p>
                                  </div>
                                  <div className="bg-[#F8F9FA] p-2 rounded-xl border border-border/40 text-center">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                                      Estimated Rate
                                    </p>
                                    <p className="text-xs font-black text-[#34A853] mt-0.5">
                                      ₹
                                      {influencer['Rate (INR)']?.toLocaleString(
                                        'en-IN',
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Badges & Scores */}
                                <div className="flex items-center justify-between mt-4">
                                  <div className="flex flex-wrap gap-1.5 max-w-[80%]">
                                    <Badge className="bg-[#4285F4]/5 hover:bg-[#4285F4]/10 text-[#4285F4] border-none text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                                      {influencer.influencer_type}
                                    </Badge>
                                    <Badge className="bg-[#FBBC05]/5 hover:bg-[#FBBC05]/10 text-[#B78103] border-none text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                                      {influencer.tier}
                                    </Badge>
                                    {influencer.City && (
                                      <Badge className="bg-muted text-muted-foreground border-none text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                        <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                                        <span>{influencer.City}</span>
                                      </Badge>
                                    )}
                                    {influencer.ResponseTime !== undefined &&
                                      influencer.ResponseTime > 0 && (
                                        <Badge className="bg-muted text-muted-foreground border-none text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                          <Zap className="h-2.5 w-2.5 text-muted-foreground" />
                                          <span>
                                            {influencer.ResponseTime}h response
                                          </span>
                                        </Badge>
                                      )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-muted-foreground">
                                      Score:
                                    </span>
                                    <Badge className="h-6 w-6 rounded-full bg-[#34A853]/10 border border-[#34A853]/25 flex items-center justify-center font-black text-[9px] text-[#34A853] p-0">
                                      {influencer.score}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Accordion details */}
                                <Accordion className="mt-4 pt-1.5 border-t border-border/60">
                                  <AccordionItem
                                    value="insights"
                                    className="border-none"
                                  >
                                    <AccordionTrigger className="w-full py-1 text-[9px] text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1 hover:no-underline font-bold cursor-pointer">
                                      Inspect Selection Insights
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-3.5 flex flex-col gap-3.5">
                                      {/* Selection Reasons */}
                                      <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                                          Selection Reasons
                                        </p>
                                        <ul className="flex flex-col gap-1">
                                          {influencer.reasons.map(
                                            (reason, rIdx) => (
                                              <li
                                                key={rIdx}
                                                className="text-xs text-[#34A853] flex items-start gap-1"
                                              >
                                                <span className="mt-1.5 h-1 w-1 bg-[#34A853] rounded-full shrink-0" />
                                                <span>{reason}</span>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>

                                      {/* Red Flags / Risk Alerts */}
                                      {influencer.red_flags &&
                                        influencer.red_flags.length > 0 && (
                                          <div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                              <ShieldAlert className="h-3.5 w-3.5 text-[#EA4335]" />{' '}
                                              Risk Alerts
                                            </p>
                                            <ul className="flex flex-col gap-1.5">
                                              {influencer.red_flags.map(
                                                (flag, fIdx) => (
                                                  <li
                                                    key={fIdx}
                                                    className="text-xs text-[#EA4335] bg-[#EA4335]/5 border border-[#EA4335]/10 px-2.5 py-1.5 rounded-xl flex items-start gap-1.5 font-bold"
                                                  >
                                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                    <span>{flag}</span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          </div>
                                        )}

                                      {/* AI Review */}
                                      {(influencer.ai_review ||
                                        liveReviews[influencer.Name]) && (
                                        <div className="bg-[#F8F9FA] p-3 rounded-xl border border-border/50">
                                          <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-[8px] font-black text-[#4285F4] uppercase tracking-widest flex items-center gap-1">
                                              <Sparkles className="h-3 w-3" />{' '}
                                              AI Review
                                            </p>
                                            <button
                                              onClick={() =>
                                                handleFetchLiveReview(
                                                  influencer,
                                                )
                                              }
                                              disabled={
                                                liveReviewsLoading[
                                                  influencer.Name
                                                ]
                                              }
                                              className="text-[8px] text-[#4285F4] hover:underline flex items-center gap-0.5 font-black disabled:opacity-50 cursor-pointer bg-transparent border-none"
                                            >
                                              {liveReviewsLoading[
                                                influencer.Name
                                              ] ? (
                                                'Generating...'
                                              ) : (
                                                <>
                                                  <Sparkles className="h-2.5 w-2.5 text-[#4285F4]" />
                                                  <span>Ask AI</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                          <p className="text-xs text-foreground/80 leading-relaxed italic">
                                            "
                                            {liveReviews[influencer.Name] ||
                                              influencer.ai_review}
                                            "
                                          </p>
                                        </div>
                                      )}

                                      {/* Campaign Brief */}
                                      <div className="mt-1">
                                        <Button
                                          onClick={() =>
                                            handleFetchBrief(influencer)
                                          }
                                          className="w-full bg-[#4285F4]/5 hover:bg-[#4285F4]/10 border border-[#4285F4]/15 hover:border-[#4285F4]/30 text-xs font-bold py-2 rounded-xl text-foreground flex items-center justify-center gap-1.5 transition cursor-pointer h-auto"
                                        >
                                          <Sparkles className="h-3.5 w-3.5 text-[#4285F4]" />
                                          <span>Create Content Brief</span>
                                        </Button>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </Card>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>

                {/* REJECTED LIST (1/3 Grid Width) */}
                <div
                  className={`xl:col-span-1 flex flex-col gap-5 ${showExcluded ? 'flex' : 'hidden xl:flex'}`}
                >
                  <h3 className="text-md font-bold flex items-center gap-2 text-foreground">
                    <ShieldAlert className="h-5 w-5 text-[#EA4335]" />
                    Excluded Profiles ({results.rejected.length})
                  </h3>

                  <ScrollArea className="max-h-[850px] pr-1">
                    <div className="flex flex-col gap-3">
                      {results.rejected.map(
                        (influencer: Influencer, index: number) => {
                          const isCompetitor =
                            influencer.rejection_reasons?.some((r) =>
                              r.includes('Competitor'),
                            );
                          return (
                            <Card
                              key={index}
                              className={`glass-card p-4 rounded-xl flex flex-col justify-between border-l-4 transition duration-200 ${
                                isCompetitor
                                  ? 'border-l-[#EA4335]'
                                  : 'border-l-muted-foreground/30'
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-extrabold text-sm text-foreground leading-tight">
                                      {influencer.Name}
                                    </h4>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">
                                      {influencer.Handle || '@anonymous'}
                                    </p>
                                  </div>
                                  <Badge className="text-[8px] font-black text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                                    Score: {influencer.score}
                                  </Badge>
                                </div>

                                {isCompetitor && (
                                  <div className="mt-1.5">
                                    <Badge className="bg-[#EA4335]/5 text-[#EA4335] border border-[#EA4335]/15 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                      Exclusivity Breach
                                    </Badge>
                                  </div>
                                )}

                                <div className="mt-2.5">
                                  <ul className="flex flex-col gap-0.5">
                                    {influencer.rejection_reasons?.map(
                                      (reason, idx) => (
                                        <li
                                          key={idx}
                                          className="text-xs text-foreground/80 flex items-start gap-1"
                                        >
                                          <span className="mt-1.5 h-1 w-1 bg-[#EA4335] rounded-full shrink-0" />
                                          <span className="text-xs">
                                            {reason}
                                          </span>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </Card>
                          );
                        },
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== TAB 2: EXCLUSIVITY AUDITOR ==================== */}
        <TabsContent
          value="auditor"
          className="max-w-2xl w-full mx-auto py-8 flex flex-col gap-6 flex-1"
        >
          <div className="text-center max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Real-Time Exclusivity Auditor
              </h2>
              <Badge className="bg-[#FBBC05]/10 border border-[#FBBC05]/20 text-[#B78103] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse-glow inline-flex items-center gap-1">
                <Search className="h-2.5 w-2.5 text-[#B78103]" />
                <span>Live Audits</span>
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Verify brand exclusivity rules dynamically. Enter a handle to
              audit feed looked-back posts for conflicts with skincare
              competitors (Minimalist, mCaffeine, Mamaearth).
            </p>
          </div>

          {/* AUDIT SEARCH BLOCK */}
          <Card className="bg-white border border-border p-5 rounded-2xl shadow-sm/5 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter handle e.g. shreya_kulkarni"
                  value={auditHandle}
                  onChange={(e) => setAuditHandle(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4285F4] transition text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <select
                  value={auditPlatform}
                  onChange={(e) => setAuditPlatform(e.target.value)}
                  className="bg-white border border-border px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#4285F4] transition cursor-pointer text-foreground"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>

                <Button
                  onClick={handleAudit}
                  disabled={auditLoading || !auditHandle}
                  className="flex-1 md:flex-initial bg-[#4285F4] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#4285F4]/90 transition disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer h-auto shadow-sm"
                >
                  {auditLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Audit Exclusivity</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Slider Control for Lookback Days */}
            <div className="pt-3.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  Audit Lookback Window
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Scrape and check posts up to this lookback range
                </span>
              </div>
              <div className="flex items-center gap-4 flex-1 sm:max-w-md w-full">
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="30"
                  value={auditLookback}
                  onChange={(e) => setAuditLookback(parseInt(e.target.value))}
                  className="flex-1 accent-[#4285F4] h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <Badge className="bg-[#4285F4]/10 border-none text-[#4285F4] text-xs font-bold px-3 py-1 rounded-full shrink-0">
                  {auditLookback} Days ({Math.round(auditLookback / 30)} Months)
                </Badge>
              </div>
            </div>
          </Card>

          {/* ERROR BANNER */}
          {auditError && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-[#EA4335] p-3.5 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <AlertTitle className="font-bold text-xs">
                  Exclusivity Audit Failed
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5">
                  {auditError}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* LOADING SKELETON */}
          {auditLoading && (
            <Card className="bg-white border border-border p-8 rounded-2xl flex flex-col items-center justify-center gap-3.5 text-center border-dashed py-12">
              <RefreshCw className="h-8 w-8 text-[#4285F4] animate-spin mb-1" />
              <h4 className="font-bold text-foreground text-sm">
                Apify Scraper Engine Active
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Parsing captions, executing API requests, and comparing timeline
                records for competitor mentions.
              </p>
              <Progress
                value={65}
                className="w-40 h-1 mt-2 border border-border"
              />
            </Card>
          )}

          {/* AUDIT RESULTS REPORT CARD */}
          {auditResult && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* HEAD SUMMARY */}
              <Card className="bg-white border border-border p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm/5">
                <div>
                  <h3 className="text-md font-bold flex items-center gap-1.5 text-foreground">
                    Audit Report: @{auditResult.username}
                    <Badge className="text-[8px] font-black text-muted-foreground capitalize bg-muted border border-border px-2 py-0.5 rounded-full">
                      {auditResult.platform}
                    </Badge>
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Analyzed the feed lookback of {auditResult.posts_scraped}{' '}
                    posts.
                  </p>
                </div>

                {auditResult.has_competitor_conflict ? (
                  <Badge className="bg-[#EA4335]/10 text-[#EA4335] border border-[#EA4335]/20 px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 h-auto">
                    <ShieldAlert className="h-4 w-4" /> Conflict Detected
                  </Badge>
                ) : (
                  <Badge className="bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/20 px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 h-auto">
                    <ShieldCheck className="h-4 w-4" /> Compliant
                  </Badge>
                )}
              </Card>

              {/* DETAILED RESULTS LIST */}
              {auditResult.has_competitor_conflict ? (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#EA4335] uppercase tracking-widest">
                    Violations Timeline ({auditResult.conflict_count})
                  </h4>

                  {auditResult.conflicts.map((post, pIdx) => (
                    <Card
                      key={pIdx}
                      className="bg-white border border-border p-4 rounded-xl relative overflow-hidden shadow-sm/5"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#EA4335]" />
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Badge className="bg-[#EA4335]/10 text-[#EA4335] border border-[#EA4335]/25 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                            Competitor: {post.brand}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">
                            Post Date: {post.date.substring(0, 10)}
                          </p>
                        </div>

                        <a
                          href={post.post_url}
                          target="_blank"
                          className="text-[10px] text-[#4285F4] hover:underline flex items-center gap-0.5 font-bold shrink-0"
                        >
                          View Feed Post{' '}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>

                      <div className="bg-muted/40 p-3 rounded-xl border border-border/50 mt-3">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                          Breach Excerpt
                        </p>
                        <p className="text-xs text-[#EA4335] font-semibold leading-relaxed italic">
                          "{post.caption_snippet}"
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-white border border-border border-dashed p-10 rounded-2xl text-center flex flex-col items-center">
                  <ShieldCheck className="h-8 w-8 text-[#34A853] mb-2 animate-pulse-glow" />
                  <h4 className="text-sm font-bold text-foreground">
                    Exclusivity Fully Clear
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                    No competitor mentions of Minimalist, mCaffeine, or
                    Mamaearth detected in audited posts.
                  </p>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ==================== TAB 3: CAMPAIGN ANALYTICS ==================== */}
        <TabsContent value="analytics" className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Programmatic Campaign Trends
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Historical roster intelligence and spend optimization metrics
                synced via SQLite local database.
              </p>
            </div>
            <Button
              onClick={fetchAnalyticsData}
              variant="outline"
              className="text-xs border border-border bg-white px-3 py-1.5 rounded-lg hover:bg-muted font-bold transition flex items-center gap-1.5 h-auto cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync Database
            </Button>
          </div>

          {analyticsError && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 text-[#EA4335] p-3.5 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <AlertTitle className="font-bold text-xs">
                  Analytics Sync Failed
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5">
                  {analyticsError}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* DYNAMIC METRICS RIBBON */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-border p-4 rounded-2xl relative overflow-hidden shadow-sm/5">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#4285F4]" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Cumulative Spend
              </p>
              <h3 className="text-xl font-black text-[#4285F4] mt-1.5">
                ₹
                {campaignHistory
                  .reduce((sum, c) => sum + (c.budget_used || 0), 0)
                  .toLocaleString('en-IN')}
              </h3>
              <span className="text-[9px] text-muted-foreground block mt-0.5">
                ₹15 Lakhs limit per campaign
              </span>
            </Card>

            <Card className="bg-white border border-border p-4 rounded-2xl relative overflow-hidden shadow-sm/5">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#34A853]" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Average Engagement
              </p>
              <h3 className="text-xl font-black text-[#34A853] mt-1.5">
                {campaignHistory.length
                  ? (
                      campaignHistory.reduce(
                        (sum, c) => sum + (c.avg_engagement_rate || 0),
                        0,
                      ) / campaignHistory.length
                    ).toFixed(2)
                  : '0.00'}
                %
              </h3>
              <span className="text-[9px] text-muted-foreground block mt-0.5">
                Campaign baseline target
              </span>
            </Card>

            <Card className="bg-white border border-border p-4 rounded-2xl relative overflow-hidden shadow-sm/5">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FBBC05]" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Quality Score Avg
              </p>
              <h3 className="text-xl font-black text-[#B78103] mt-1.5">
                {campaignHistory.length
                  ? (
                      campaignHistory.reduce(
                        (sum, c) => sum + (c.avg_score || 0),
                        0,
                      ) / campaignHistory.length
                    ).toFixed(1)
                  : '0.0'}
              </h3>
              <span className="text-[9px] text-muted-foreground block mt-0.5">
                Scale of 0-100 composite
              </span>
            </Card>

            <Card className="bg-white border border-border p-4 rounded-2xl relative overflow-hidden shadow-sm/5">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#EA4335]" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Shortlist Run History
              </p>
              <h3 className="text-xl font-black text-[#EA4335] mt-1.5">
                {campaignHistory.length} Campaigns
              </h3>
              <span className="text-[9px] text-muted-foreground block mt-0.5">
                SQLite database records
              </span>
            </Card>
          </div>

          {/* DUAL SELECTORS AND SVG CHART BLOCK */}
          <Card className="bg-white border border-border p-5 rounded-3xl shadow-sm/5 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-1.5 border-b border-border/60">
              {/* Metric Selectors */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setTrendsMetric('budget')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    trendsMetric === 'budget'
                      ? 'bg-[#4285F4]/10 text-[#4285F4] border-none'
                      : 'bg-transparent border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Spend Allocations
                </button>
                <button
                  onClick={() => setTrendsMetric('engagement')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    trendsMetric === 'engagement'
                      ? 'bg-[#34A853]/10 text-[#34A853] border-none'
                      : 'bg-transparent border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Engagement Rate
                </button>
                <button
                  onClick={() => setTrendsMetric('score')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    trendsMetric === 'score'
                      ? 'bg-[#FBBC05]/10 text-[#B78103] border-none'
                      : 'bg-transparent border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Creator Quality Score
                </button>
                <button
                  onClick={() => setTrendsMetric('creators')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    trendsMetric === 'creators'
                      ? 'bg-[#EA4335]/10 text-[#EA4335] border-none'
                      : 'bg-transparent border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Shortlist Sizes
                </button>
              </div>

              {/* Interval selectors */}
              <div className="flex bg-[#F1F3F4] p-[3px] rounded-lg border border-border h-auto">
                {(['weekly', 'monthly', 'quarterly'] as const).map(
                  (interval) => (
                    <button
                      key={interval}
                      onClick={() => setTrendsInterval(interval)}
                      className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-extrabold transition-all duration-200 cursor-pointer ${
                        trendsInterval === interval
                          ? 'bg-white text-[#4285F4] shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {interval}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* CHART DISPLAY AREA */}
            <div className="relative h-[320px] w-full flex items-center justify-center">
              {analyticsLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-7 w-7 text-[#4285F4] animate-spin" />
                  <p className="text-xs font-bold text-[#4285F4]">
                    Compiling local trends...
                  </p>
                </div>
              )}

              {trendsData.length === 0 ? (
                <div className="flex flex-col items-center text-center justify-center p-8 border border-border border-dashed rounded-2xl w-full h-full">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <h4 className="font-bold text-sm text-foreground/80">
                    No historical trends compiled
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload campaigns or trigger optimizer snapshots to populate
                    SQLite records.
                  </p>
                </div>
              ) : (
                (() => {
                  const width = 800;
                  const height = 300;
                  const paddingX = 60;
                  const paddingY = 40;
                  const chartWidth = width - 2 * paddingX;
                  const chartHeight = height - 2 * paddingY;
                  const N = trendsData.length;

                  const values = trendsData.map((d) => {
                    if (trendsMetric === 'budget') return d.budget_used || 0;
                    if (trendsMetric === 'engagement')
                      return d.avg_engagement_rate || 0;
                    if (trendsMetric === 'score') return d.avg_score || 0;
                    return d.total_shortlisted || 0;
                  });

                  const maxVal = Math.max(...values, 1) * 1.15;

                  const coords = trendsData.map((d, i) => {
                    const x =
                      paddingX +
                      (N > 1 ? (i / (N - 1)) * chartWidth : chartWidth / 2);
                    const val =
                      trendsMetric === 'budget'
                        ? d.budget_used
                        : trendsMetric === 'engagement'
                          ? d.avg_engagement_rate
                          : trendsMetric === 'score'
                            ? d.avg_score
                            : d.total_shortlisted;
                    const y = height - paddingY - (val / maxVal) * chartHeight;
                    return { x, y, val, period: d.period };
                  });

                  const pathD = coords
                    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
                    .join(' ');
                  const fillD = coords.length
                    ? `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
                    : '';

                  return (
                    <div className="w-full h-full p-2 flex justify-center items-center">
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-full overflow-visible"
                      >
                        <defs>
                          <linearGradient
                            id="chartGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={
                                trendsMetric === 'budget'
                                  ? '#4285F4'
                                  : trendsMetric === 'engagement'
                                    ? '#34A853'
                                    : trendsMetric === 'score'
                                      ? '#FBBC05'
                                      : '#EA4335'
                              }
                              stopOpacity="0.25"
                            />
                            <stop
                              offset="100%"
                              stopColor={
                                trendsMetric === 'budget'
                                  ? '#4285F4'
                                  : trendsMetric === 'engagement'
                                    ? '#34A853'
                                    : trendsMetric === 'score'
                                      ? '#FBBC05'
                                      : '#EA4335'
                              }
                              stopOpacity="0.00"
                            />
                          </linearGradient>
                          <filter
                            id="lineGlow"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                          >
                            <feDropShadow
                              dx="0"
                              dy="5"
                              stdDeviation="6"
                              floodColor={
                                trendsMetric === 'budget'
                                  ? '#4285F4'
                                  : trendsMetric === 'engagement'
                                    ? '#34A853'
                                    : trendsMetric === 'score'
                                      ? '#FBBC05'
                                      : '#EA4335'
                              }
                              floodOpacity="0.18"
                            />
                          </filter>
                        </defs>

                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                          const yVal = height - paddingY - ratio * chartHeight;
                          const gridLabel = (1 - ratio) * maxVal;
                          return (
                            <g key={gridIdx} className="opacity-45">
                              <line
                                x1={paddingX}
                                y1={yVal}
                                x2={width - paddingX}
                                y2={yVal}
                                stroke="#DADCE0"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />
                              <text
                                x={paddingX - 10}
                                y={yVal + 3.5}
                                textAnchor="end"
                                className="text-[9px] font-black fill-muted-foreground"
                              >
                                {trendsMetric === 'budget'
                                  ? `₹${Math.round(gridLabel / 1000)}k`
                                  : trendsMetric === 'engagement'
                                    ? `${gridLabel.toFixed(1)}%`
                                    : trendsMetric === 'score'
                                      ? `${gridLabel.toFixed(0)}`
                                      : `${gridLabel.toFixed(0)}`}
                              </text>
                            </g>
                          );
                        })}

                        {/* X Axis Labels */}
                        {trendsData.map((d, i) => {
                          const x =
                            paddingX +
                            (trendsData.length > 1
                              ? (i / (trendsData.length - 1)) * chartWidth
                              : chartWidth / 2);
                          return (
                            <text
                              key={i}
                              x={x}
                              y={height - paddingY + 18}
                              textAnchor="middle"
                              className="text-[8px] font-black fill-muted-foreground uppercase tracking-wider rotate-12 origin-top"
                            >
                              {d.period}
                            </text>
                          );
                        })}

                        {/* Area Fill */}
                        <path d={fillD} fill="url(#chartGradient)" />

                        {/* Line Stroke */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={
                            trendsMetric === 'budget'
                              ? '#4285F4'
                              : trendsMetric === 'engagement'
                                ? '#34A853'
                                : trendsMetric === 'score'
                                  ? '#B78103'
                                  : '#EA4335'
                          }
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#lineGlow)"
                        />

                        {/* Coordinate Dots */}
                        {coords.map((c, i) => (
                          <g
                            key={i}
                            className="group/dot cursor-pointer"
                            onClick={() =>
                              setSelectedPeriodDetail(trendsData[i])
                            }
                          >
                            {selectedPeriodDetail?.period === c.period && (
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r="12"
                                className="fill-none stroke-2 animate-ping"
                                stroke={
                                  trendsMetric === 'budget'
                                    ? '#4285F4'
                                    : trendsMetric === 'engagement'
                                      ? '#34A853'
                                      : trendsMetric === 'score'
                                        ? '#FBBC05'
                                        : '#EA4335'
                                }
                              />
                            )}
                            {selectedPeriodDetail?.period === c.period && (
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r="8.5"
                                className={`${
                                  trendsMetric === 'budget'
                                    ? 'fill-[#4285F4]/20 stroke-[#4285F4]'
                                    : trendsMetric === 'engagement'
                                      ? 'fill-[#34A853]/20 stroke-[#34A853]'
                                      : trendsMetric === 'score'
                                        ? 'fill-[#FBBC05]/20 stroke-[#FBBC05]'
                                        : 'fill-[#EA4335]/20 stroke-[#EA4335]'
                                } stroke-[2]`}
                              />
                            )}
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r="8.5"
                              className={`opacity-0 group-hover/dot:opacity-100 transition duration-150 ${
                                trendsMetric === 'budget'
                                  ? 'fill-[#4285F4]/10'
                                  : trendsMetric === 'engagement'
                                    ? 'fill-[#34A853]/10'
                                    : trendsMetric === 'score'
                                      ? 'fill-[#FBBC05]/10'
                                      : 'fill-[#EA4335]/10'
                              }`}
                            />
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r="4.5"
                              className={`fill-white stroke-[3.5] transition duration-150 ${
                                trendsMetric === 'budget'
                                  ? 'stroke-[#4285F4]'
                                  : trendsMetric === 'engagement'
                                    ? 'stroke-[#34A853]'
                                    : trendsMetric === 'score'
                                      ? 'stroke-[#B78103]'
                                      : 'stroke-[#EA4335]'
                              }`}
                            />

                            {/* Dynamic Tooltip */}
                            <g className="opacity-0 group-hover/dot:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover/dot:translate-y-0">
                              <rect
                                x={c.x - 65}
                                y={c.y - 45}
                                width="130"
                                height="32"
                                rx="6"
                                className="fill-white stroke-border stroke-[1.5] shadow-lg"
                              />
                              <text
                                x={c.x}
                                y={c.y - 32}
                                textAnchor="middle"
                                className="text-[8px] font-black fill-muted-foreground uppercase tracking-widest"
                              >
                                {c.period}
                              </text>
                              <text
                                x={c.x}
                                y={c.y - 20}
                                textAnchor="middle"
                                className={`text-[10px] font-black ${
                                  trendsMetric === 'budget'
                                    ? 'fill-[#4285F4]'
                                    : trendsMetric === 'engagement'
                                      ? 'fill-[#34A853]'
                                      : trendsMetric === 'score'
                                        ? 'fill-[#B78103]'
                                        : 'fill-[#EA4335]'
                                }`}
                              >
                                {trendsMetric === 'budget'
                                  ? `₹${Math.round(c.val).toLocaleString('en-IN')}`
                                  : trendsMetric === 'engagement'
                                    ? `${c.val.toFixed(2)}% ER`
                                    : trendsMetric === 'score'
                                      ? `${c.val.toFixed(1)} score`
                                      : `${c.val} creators`}
                              </text>
                            </g>
                          </g>
                        ))}
                      </svg>
                    </div>
                  );
                })()
              )}
            </div>
          </Card>

          {/* DYNAMIC TWO-COLUMN GRID BELOW CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: INTERACTIVE DRILL-DOWN PANEL & COMPARISON MATRIX (2/3 width) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* INTERACTIVE DRILL-DOWN PERIOD FOCUS PANEL */}
              {selectedPeriodDetail && (
                <Card className="bg-white border border-border p-5 rounded-2xl relative overflow-hidden shadow-sm/5 transition duration-300 hover:border-black/[0.08]">
                  {/* Glowing vertical line accent based on metric */}
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${
                      trendsMetric === 'budget'
                        ? 'bg-[#4285F4]'
                        : trendsMetric === 'engagement'
                          ? 'bg-[#34A853]'
                          : trendsMetric === 'score'
                            ? 'bg-[#FBBC05]'
                            : 'bg-[#EA4335]'
                    }`}
                  />

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest block">
                        Interactive Period Drilldown
                      </span>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                        Performance Focus: {selectedPeriodDetail.period}
                      </h3>
                    </div>

                    <Badge className="bg-[#4285F4]/10 hover:bg-[#4285F4]/15 border-none text-[#4285F4] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center">
                      Focused
                    </Badge>
                  </div>

                  {/* Focused Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-[#F8F9FA] p-3 rounded-xl border border-border/40">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                        Avg Spend Allocations
                      </p>
                      <p className="text-sm font-black text-[#4285F4] mt-1">
                        ₹
                        {selectedPeriodDetail.budget_used?.toLocaleString(
                          'en-IN',
                        )}
                      </p>
                    </div>
                    <div className="bg-[#F8F9FA] p-3 rounded-xl border border-border/40">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                        Avg Engagement Rate
                      </p>
                      <p className="text-sm font-black text-[#34A853] mt-1">
                        {selectedPeriodDetail.avg_engagement_rate}%
                      </p>
                    </div>
                    <div className="bg-[#F8F9FA] p-3 rounded-xl border border-border/40">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                        Avg Quality Score
                      </p>
                      <p className="text-sm font-black text-[#B78103] mt-1">
                        {selectedPeriodDetail.avg_score}
                      </p>
                    </div>
                    <div className="bg-[#F8F9FA] p-3 rounded-xl border border-border/40">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
                        Campaign Snapshot Count
                      </p>
                      <p className="text-sm font-black text-[#EA4335] mt-1">
                        {selectedPeriodDetail.campaigns_count} snap runs
                      </p>
                    </div>
                  </div>

                  <p className="text-[9px] text-muted-foreground mt-3 italic text-right">
                    💡 Click on any coordinate dot on the SVG line chart above
                    to focus another period dynamically.
                  </p>
                </Card>
              )}

              {/* DYNAMIC CAMPAIGN SIDE-BY-SIDE COMPARISON MATRIX */}
              {selectedCampaignIds.length === 2 &&
                (() => {
                  const compA = campaignHistory.find(
                    (c) => c.id === selectedCampaignIds[0],
                  );
                  const compB = campaignHistory.find(
                    (c) => c.id === selectedCampaignIds[1],
                  );
                  if (!compA || !compB) return null;

                  return (
                    <Card className="bg-gradient-to-tr from-[#4285F4]/5 via-[#34A853]/2 to-transparent border border-[#4285F4]/15 p-5 rounded-2xl shadow-md animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[#4285F4]/10 text-[#4285F4] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-black/[0.05]">
                        Comparison Matrix Active
                      </div>

                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-4">
                        <ArrowUpDown className="h-4 w-4 text-[#4285F4]" />
                        Campaign Workspace Comparison
                      </h3>

                      <div className="grid grid-cols-3 gap-3 border-collapse text-xs">
                        {/* Headers */}
                        <div className="font-extrabold text-muted-foreground py-2">
                          Parameter
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-border/40 font-black text-center truncate text-[#4285F4]">
                          {compA.campaign_name}
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-border/40 font-black text-center truncate text-[#34A853]">
                          {compB.campaign_name}
                        </div>

                        {/* Date Row */}
                        <div className="font-bold text-muted-foreground py-2 border-t border-border/40">
                          Upload Date
                        </div>
                        <div className="p-2 text-center border-t border-border/40 font-semibold">
                          {compA.uploaded_at.substring(0, 10)}
                        </div>
                        <div className="p-2 text-center border-t border-border/40 font-semibold">
                          {compB.uploaded_at.substring(0, 10)}
                        </div>

                        {/* Shortlisted Row */}
                        <div className="font-bold text-muted-foreground py-2 border-t border-border/40">
                          Shortlist Size
                        </div>
                        <div className="p-2 text-center border-t border-border/40 font-black text-[#4285F4]">
                          {compA.total_shortlisted} creators
                        </div>
                        <div className="p-2 text-center border-t border-border/40 font-black text-[#34A853]">
                          {compB.total_shortlisted} creators
                        </div>

                        {/* Spend Row */}
                        <div className="font-bold text-muted-foreground py-2 border-t border-border/40">
                          Total Spend
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compA.budget_used < compB.budget_used ? 'bg-[#34A853]/10 text-[#34A853]' : ''}`}
                        >
                          ₹{compA.budget_used.toLocaleString('en-IN')}
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compB.budget_used < compA.budget_used ? 'bg-[#34A853]/10 text-[#34A853]' : ''}`}
                        >
                          ₹{compB.budget_used.toLocaleString('en-IN')}
                        </div>

                        {/* ER Row */}
                        <div className="font-bold text-muted-foreground py-2 border-t border-border/40">
                          Avg Engagement
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compA.avg_engagement_rate > compB.avg_engagement_rate ? 'bg-[#34A853]/10 text-[#34A853]' : ''}`}
                        >
                          {compA.avg_engagement_rate}%
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compB.avg_engagement_rate > compA.avg_engagement_rate ? 'bg-[#34A853]/10 text-[#34A853]' : ''}`}
                        >
                          {compB.avg_engagement_rate}%
                        </div>

                        {/* Score Row */}
                        <div className="font-bold text-muted-foreground py-2 border-t border-border/40">
                          Avg Creator Quality
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compA.avg_score > compB.avg_score ? 'bg-[#34A853]/10 text-[#34A853]' : ''}`}
                        >
                          {compA.avg_score}
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compB.avg_score > compA.avg_score ? 'bg-[#34A853]/10 text-[#34A853]' : ''}`}
                        >
                          {compB.avg_score}
                        </div>

                        {/* Tier Row */}
                        <div className="font-bold text-muted-foreground py-2 border-t border-border/40">
                          Tier 2/3 Representation
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compA.tier23_percentage >= 40 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}
                        >
                          {compA.tier23_percentage}%{' '}
                          {compA.tier23_percentage >= 40 ? '✓' : '✗'}
                        </div>
                        <div
                          className={`p-2 text-center border-t border-border/40 font-black rounded-lg ${compB.tier23_percentage >= 40 ? 'text-[#34A853]' : 'text-[#EA4335]'}`}
                        >
                          {compB.tier23_percentage}%{' '}
                          {compB.tier23_percentage >= 40 ? '✓' : '✗'}
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={() => setSelectedCampaignIds([])}
                          variant="outline"
                          className="text-[10px] uppercase font-black tracking-wider text-muted-foreground border-border bg-white hover:bg-muted py-1.5 px-3 rounded-lg h-auto cursor-pointer"
                        >
                          Reset Comparison
                        </Button>
                      </div>
                    </Card>
                  );
                })()}

              {/* TABLE SNAPSHOT HISTORY BLOCK */}
              <div className="flex flex-col gap-4">
                <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-5 w-5 text-[#4285F4]" />
                  Local Campaign Snapshot History ({campaignHistory.length})
                </h3>

                {campaignHistory.length === 0 ? (
                  <Card className="bg-white border border-border border-dashed p-10 rounded-2xl text-center flex flex-col items-center">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <h4 className="text-sm font-bold text-foreground">
                      No historical snapshots saved
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Database history list is currently clear.
                    </p>
                  </Card>
                ) : (
                  <Card className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm/5">
                    <ScrollArea className="w-full max-h-[350px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border/80 text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                            <th className="p-3.5 text-center w-10">Compare</th>
                            <th className="p-3.5">Campaign Workspace Name</th>
                            <th className="p-3.5">Uploaded Date</th>
                            <th className="p-3.5 text-center">Shortlisted</th>
                            <th className="p-3.5 text-center">Spend</th>
                            <th className="p-3.5 text-center">Avg ER%</th>
                            <th className="p-3.5 text-center">Avg Score</th>
                            <th className="p-3.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignHistory.map((c: any, index: number) => {
                            const isChecked = selectedCampaignIds.includes(
                              c.id,
                            );
                            return (
                              <tr
                                key={index}
                                className="border-b border-border/50 hover:bg-muted/30 transition"
                              >
                                <td className="p-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        if (selectedCampaignIds.length >= 2) {
                                          alert(
                                            'You can select up to 2 campaigns to compare at the same time.',
                                          );
                                          return;
                                        }
                                        setSelectedCampaignIds((prev) => [
                                          ...prev,
                                          c.id,
                                        ]);
                                      } else {
                                        setSelectedCampaignIds((prev) =>
                                          prev.filter((id) => id !== c.id),
                                        );
                                      }
                                    }}
                                    className="accent-[#4285F4] h-3.5 w-3.5 rounded cursor-pointer"
                                  />
                                </td>
                                <td className="p-3.5 font-bold text-foreground max-w-[180px] truncate">
                                  {c.campaign_name}
                                </td>
                                <td className="p-3.5 text-muted-foreground font-semibold">
                                  {c.uploaded_at.substring(0, 10)}{' '}
                                  {c.uploaded_at.substring(11, 16)}
                                </td>
                                <td className="p-3.5 text-center font-bold text-[#4285F4]">
                                  {c.total_shortlisted}
                                </td>
                                <td className="p-3.5 text-center font-extrabold text-[#34A853]">
                                  ₹{c.budget_used?.toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5 text-center font-bold text-[#34A853]">
                                  {c.avg_engagement_rate}%
                                </td>
                                <td className="p-3.5 text-center">
                                  <Badge className="bg-[#4285F4]/10 hover:bg-[#4285F4]/15 border-none text-[#4285F4] text-[10px] font-black px-2 py-0.5 rounded-full inline-flex">
                                    {c.avg_score}
                                  </Badge>
                                </td>
                                <td className="p-3.5 text-center">
                                  <button
                                    onClick={() => handleDeleteCampaign(c.id)}
                                    className="text-muted-foreground hover:text-[#EA4335] transition p-1 hover:bg-[#EA4335]/5 rounded-lg cursor-pointer border-none bg-transparent"
                                    title="Delete from history"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </Card>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: CMO STRATEGIC AI INSIGHTS COPILOT (1/3 width) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <Card className="bg-white border border-border p-5 rounded-2xl relative overflow-hidden shadow-sm/5 flex flex-col gap-4">
                <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[#4285F4]/[0.025] rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gradient-to-tr from-[#4285F4] to-[#34A853] rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black block">
                      Analytics Executive Copilot
                    </span>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight mt-0.5">
                      CMO Strategic AI Insights
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Run a real-time, dynamic marketing audit using standard OpenAI
                  models to diagnose budget flows, anomalies, and outcome
                  forecasts based on SQLite history.
                </p>

                {aiInsightsError && (
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50 text-[#EA4335] p-3 rounded-xl flex items-start gap-2.5"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="text-[10px] leading-snug">
                      {aiInsightsError}
                    </span>
                  </Alert>
                )}

                <Button
                  onClick={fetchAiInsights}
                  disabled={aiInsightsLoading || campaignHistory.length === 0}
                  className="w-full bg-[#4285F4] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-sm hover:shadow h-auto cursor-pointer border-none"
                >
                  {aiInsightsLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Synthesizing CMO Audit...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate AI Marketing Audit</span>
                    </>
                  )}
                </Button>

                {/* Insights Display Section */}
                {aiInsights && (
                  <Card className="bg-[#F8F9FA] p-4 rounded-xl border border-border shadow-inner text-left max-h-[480px] overflow-hidden flex flex-col gap-3 animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-border/60 shrink-0">
                      <span className="text-[9px] font-black text-[#4285F4] uppercase tracking-wider">
                        Dynamic Report
                      </span>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(aiInsights);
                          alert('Strategic audit copied to clipboard!');
                        }}
                        className="bg-transparent text-muted-foreground hover:text-foreground p-1 rounded-lg h-auto cursor-pointer border-none flex items-center gap-1 text-[9px] font-bold"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 pr-1 overflow-y-auto">
                      <div className="text-xs space-y-4">
                        <BriefRenderer text={aiInsights} />
                      </div>
                    </ScrollArea>
                  </Card>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </main>

      {/* CREATIVE BRIEF MODAL USING SHADCN DIALOG */}
      <Dialog
        open={!!selectedBriefInfluencer}
        onOpenChange={(open) => {
          if (!open) setSelectedBriefInfluencer(null);
        }}
      >
        <DialogContent className="max-w-2xl bg-white border border-border text-foreground rounded-3xl p-0 overflow-hidden shadow-2xl">
          {selectedBriefInfluencer && (
            <div className="flex flex-col max-h-[80vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex justify-between items-center bg-gradient-to-r from-muted/20 to-transparent">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#4285F4]" />
                  <div>
                    <DialogTitle className="text-md font-bold tracking-tight text-foreground">
                      Campaign Content Brief
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Tailored strategic brief for{' '}
                      <span className="text-[#4285F4] font-bold">
                        {selectedBriefInfluencer.Name}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-hidden flex-1 bg-white/40 flex flex-col">
                <ScrollArea className="flex-1 pr-4 max-h-[45vh]">
                  {briefsLoading[selectedBriefInfluencer.Name] ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                      <RefreshCw className="h-8 w-8 text-[#4285F4] animate-spin" />
                      <h4 className="font-bold text-foreground text-sm">
                        Synthesizing Creative Brief...
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                        Assembling creator parameters, matching brand claims,
                        and drafting hooks.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-border shadow-inner">
                      <BriefRenderer
                        text={briefs[selectedBriefInfluencer.Name]}
                      />
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="p-4 border-t border-border flex justify-between items-center bg-[#F8F9FA] rounded-b-3xl">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBriefInfluencer(null)}
                  className="px-4 py-2 border border-border hover:border-muted-foreground/30 bg-white hover:bg-[#F8F9FA] rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition h-auto cursor-pointer"
                >
                  Close
                </Button>

                {!briefsLoading[selectedBriefInfluencer.Name] &&
                  briefs[selectedBriefInfluencer.Name] && (
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          briefs[selectedBriefInfluencer.Name],
                        );
                        alert('Brief copied to clipboard successfully!');
                      }}
                      className="bg-[#4285F4] text-white hover:bg-[#4285F4]/90 px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition h-auto cursor-pointer shadow-sm"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Brief</span>
                    </Button>
                  )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FOOTER */}
      <footer className="bg-white border-t border-border py-4 text-center text-[10px] text-muted-foreground flex flex-col gap-1 shrink-0 mt-8">
        <p className="font-bold tracking-wide">
          Influencer AI Platform v0.2.0 — Programmatic Optimizer & Live
          Exclusivity Auditor
        </p>
        <p>
          © {new Date().getFullYear()} Schbang Technology Services. Optimized
          under rigid budget constraints.
        </p>
      </footer>
    </Tabs>
  );
}
