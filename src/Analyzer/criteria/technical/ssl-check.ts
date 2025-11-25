import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";

export class SslCheck extends BaseCriteria {
  constructor() {
    super("ssl_protocol", 1.0);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    const isHttps = context.urlObj.protocol === 'https:';
    
    return this.createResult(
      isHttps ? 100 : 0,
      isHttps ? "Використовується захищений протокол HTTPS" : "Сайт використовує незахищений HTTP"
    );
  }
}