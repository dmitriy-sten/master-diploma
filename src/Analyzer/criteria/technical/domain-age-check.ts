import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";

export class DomainAgeCheck extends BaseCriteria {
  constructor() {
    super("domain_age", 1.0);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    const data = context.domainData;

    if (!data || !data.creationDate) {
      return this.createResult(50, "Не вдалося визначити дату реєстрації");
    }

    const creationDate = new Date(data.creationDate);
    const today = new Date();
    
    const ageYears = (today.getFullYear() - creationDate.getFullYear());

    if (ageYears < 1) {
      return this.createResult(0, "Домен зареєстровано менше року тому (Високий ризик)");
    }

    return this.createResult(100, `Домену ${ageYears} років`);
  }
}