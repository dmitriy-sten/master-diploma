"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Calendar,
  Hash,
  Scale,
  UserSearch,
  BrainCircuit,
  FileSearch,
  Megaphone,
  Newspaper,
  Settings,
  Terminal,
} from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";

// --- TYPES ---
interface CriterionResult {
  id: string;
  score: number;
  weight: number;
  details: string;
}

interface GroupResult {
  groupId: string;
  title: string;
  score: number;
  criteriaResults: CriterionResult[];
}

interface AnalysisData {
  url: string;
  totalScore: number;
  timestamp: string;
  groups: GroupResult[];
}

// --- HELPERS ---

// Адаптивные цвета: темные для светлой темы, светлые для темной
const getScoreStatusColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const getGroupIcon = (groupId: string) => {
  const baseClass = "w-5 h-5";
  switch (groupId) {
    case "technical":
    case "reputation":
      return <Settings className={cn(baseClass, "text-zinc-500 dark:text-zinc-400")} />;
    case "author":
      return <UserSearch className={cn(baseClass, "text-blue-500 dark:text-blue-400")} />;
    case "verification":
      return <FileSearch className={cn(baseClass, "text-emerald-500 dark:text-emerald-400")} />;
    case "logic":
      return <BrainCircuit className={cn(baseClass, "text-purple-500 dark:text-purple-400")} />;
    case "emotional":
      return <Megaphone className={cn(baseClass, "text-rose-500 dark:text-rose-400")} />;
    case "info_value":
      return <Newspaper className={cn(baseClass, "text-amber-500 dark:text-amber-400")} />;
    default:
      return <Terminal className={cn(baseClass, "text-zinc-500 dark:text-zinc-400")} />;
  }
};

const getStatusIcon = (score: number) => {
  const className = cn("w-10 h-10", getScoreStatusColor(score));
  if (score >= 80) return <ShieldCheck className={className} />;
  if (score >= 50) return <ShieldAlert className={className} />;
  return <ShieldX className={className} />;
};

const getCriterionIcon = (score: number) => {
  if (score === 100) return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />;
  if (score === 0) return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-500" />;
  return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />;
};

// --- COMPONENT ---

export function AnalysisResultCard({ data }: { data: AnalysisData }) {
  const formattedDate = format(new Date(data.timestamp), "d MMMM yyyy, HH:mm", {
    locale: uk,
  });

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors duration-300">
      {/* --- HEADER --- */}
      <CardHeader className="pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-2 flex-1">
            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Результат аналізу
            </CardTitle>

            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors max-w-[300px] md:max-w-lg truncate border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 pb-0.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {data.url}
            </a>
          </div>

          {/* Score Box */}
          <div className="flex items-center gap-5 bg-zinc-50/50 dark:bg-zinc-900/50 px-5 py-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
            {getStatusIcon(data.totalScore)}
            <div className="text-right">
              <div className={cn("text-4xl font-black tracking-tighter leading-none", getScoreStatusColor(data.totalScore))}>
                {data.totalScore}%
              </div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Рівень довіри
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <Separator className="bg-zinc-100 dark:bg-zinc-800" />

      {/* --- CONTENT (GRID LAYOUT) --- */}
      <CardContent className="pt-8 pb-8 space-y-10">
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-10">
          
          {data.groups.map((group) => (
            <div key={group.groupId} className="space-y-4 flex flex-col h-full">
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                   {/* Иконка группы */}
                   <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-100 dark:border-zinc-800">
                      {getGroupIcon(group.groupId)}
                   </div>
                   <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-200">
                      {group.title}
                   </h3>
                </div>
                
                {/* Бейджи: В темной теме используем прозрачность (bg-opacity) для мягкого свечения */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-mono text-xs font-bold px-2.5 py-1 border",
                    group.score >= 80 ? 
                      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                    group.score >= 50 ? 
                      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
                      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                  )}
                >
                  {group.score}%
                </Badge>
              </div>

              {/* Criteria List */}
              <div className="grid gap-2.5 content-start">
                {group.criteriaResults.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                        {getCriterionIcon(criterion.score)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug">
                          {criterion.details}
                        </p>
                        
                        {/* Technical Metadata */}
                        <div className="hidden sm:flex items-center gap-2 mt-2 opacity-50 group-hover:opacity-80 transition-opacity">
                          <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/50">
                             <Hash className="w-2.5 h-2.5" />
                             <span className="font-mono">{criterion.id}</span>
                          </span>
                          {criterion.weight !== 1 && (
                            <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/50">
                              <Scale className="w-2.5 h-2.5" />
                              <span>x{criterion.weight}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Individual Score */}
                    <div className="shrink-0">
                       <span className={cn("text-sm font-bold font-mono", getScoreStatusColor(criterion.score))}>
                          {criterion.score}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}