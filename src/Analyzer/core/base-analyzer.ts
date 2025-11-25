import { AnalysisContext, CriterionResult } from "./types";

export abstract class BaseCriteria {
  constructor(public id: string, public weight: number = 1) {}

  abstract evaluate(context: AnalysisContext): Promise<CriterionResult>;

  protected createResult(score: number, details: string, metadata?: any): CriterionResult {
    return {
      id: this.id,
      score, // 0-100
      weight: this.weight,
      details,
      metadata,
    };
  }
}