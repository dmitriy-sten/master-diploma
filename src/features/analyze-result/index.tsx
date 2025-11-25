"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Progress } from "@/shared/components/ui/progress";
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
} from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";

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

// Семантические цвета для текста и иконок
const getScoreStatusColor = (score: number) => {
  if (score >= 80) return "text-emerald-600"; // Чуть более строгий зеленый
  if (score >= 50) return "text-amber-600";   // Строгий желтый
  return "text-rose-600";                     // Строгий красный
};

// Классы для прогресс-бара (используем селектор [&>div] для перекраски индикатора shadcn)
const getProgressColorClass = (score: number) => {
  if (score >= 80) return "[&>div]:bg-emerald-600";
  if (score >= 50) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-rose-600";
};

const getStatusIcon = (score: number) => {
  const className = cn("w-10 h-10", getScoreStatusColor(score));
  if (score >= 80) return <ShieldCheck className={className} />;
  if (score >= 50) return <ShieldAlert className={className} />;
  return <ShieldX className={className} />;
};

const getCriterionIcon = (score: number) => {
  if (score === 100) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (score === 0) return <XCircle className="w-4 h-4 text-rose-600" />;
  return <AlertCircle className="w-4 h-4 text-amber-600" />;
};

export function AnalysisResultCard({ data }: { data: AnalysisData }) {
  const formattedDate = format(new Date(data.timestamp), "d MMMM yyyy, HH:mm", {
    locale: uk,
  });

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm border-neutral-200">
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

            <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Результат аналізу
            </CardTitle>

            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors max-w-[300px] md:max-w-lg truncate border-b border-transparent hover:border-neutral-300 pb-0.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {data.url}
            </a>
          </div>

          {/* Score Box: Neutral Style */}
          <div className="flex items-center gap-5 bg-neutral-50 px-5 py-4 rounded-xl border border-neutral-100">
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

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Фейк</span>
            <span>Сумнівно</span>
            <span>Надійно</span>
          </div>
          <Progress
            value={data.totalScore}
            className={cn("h-2 bg-neutral-100", getProgressColorClass(data.totalScore))}
          />
        </div>
      </CardHeader>

      <Separator className="bg-neutral-100" />

      {/* --- CONTENT --- */}
      <CardContent className="pt-8 pb-8 bg-white space-y-10">
        {data.groups.map((group) => (
          <div key={group.groupId} className="space-y-4">
            {/* Group Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                {group.title}
              </h3>
              <Badge
                variant="secondary"
                className="font-mono text-xs font-bold bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              >
                {group.score}%
              </Badge>
            </div>

            {/* Criteria List */}
            <div className="grid gap-3">
              {group.criteriaResults.map((criterion) => (
                <div
                  key={criterion.id}
                  className="group flex items-start justify-between gap-4 p-3 rounded-lg border border-transparent hover:border-neutral-200 hover:bg-neutral-50/50 transition-all duration-200"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      {getCriterionIcon(criterion.score)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700 leading-tight">
                        {criterion.details}
                      </p>
                      
                      {/* Metadata badges */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono">{criterion.id}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                           <Scale className="w-3 h-3" />
                           <span>x{criterion.weight}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 flex flex-col items-end">
                     <span className={cn("text-sm font-bold font-mono", getScoreStatusColor(criterion.score))}>
                        {criterion.score}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}