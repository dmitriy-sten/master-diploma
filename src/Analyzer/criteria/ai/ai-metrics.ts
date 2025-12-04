import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult, ContentMetrics } from "../../core/types";

type MetricPath = string;

export class AiMetricCriteria extends BaseCriteria {
  constructor(
    id: string,
    weight: number,
    private path: MetricPath,
    private label: string,    
    private threshold: number,
    private mode: 'less_is_good' | 'more_is_good' 
  ) {
    super(id, weight);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    if (!context.contentMetrics) {
      return this.createResult(0, `${this.label}: Дані відсутні`);
    }

    const keys = this.path.split('.');
    let value: any = context.contentMetrics;
    for (const key of keys) {
      value = value ? value[key] : 0;
    }
    const numValue = Number(value) || 0;

    let score = 0;
    
    if (this.mode === 'less_is_good') {
      if (numValue === 0) score = 100;
      else if (numValue >= this.threshold) score = 0;
      else {
        score = 100 - (numValue / this.threshold) * 100;
      }
    } else {
      if (numValue >= this.threshold) score = 100;
      else {
        score = (numValue / this.threshold) * 100;
      }
    }

    const displayValue = this.path.includes('ratio') || this.path.includes('similarity') 
      ? `${(numValue * 100).toFixed(0)}%` 
      : numValue;

    return this.createResult(Math.round(score), `${this.label}: ${displayValue}`, { raw: numValue });
  }
}