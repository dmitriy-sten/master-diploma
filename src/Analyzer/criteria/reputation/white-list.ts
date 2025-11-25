import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";

const APPROVED_DOMAINS = ['bbc.com', 'reuters.com', 'pravda.com.ua'];

export class WhitelistCheck extends BaseCriteria {
  constructor() {
    super("whitelist_check", 3.0);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    const domain = context.urlObj.hostname.replace('www.', '');
    const isTrusted = APPROVED_DOMAINS.includes(domain);

    return this.createResult(
      isTrusted ? 100 : 0,
      isTrusted ? "Ресурс знайдено у списку перевірених медіа" : "Ресурс відсутній у білому списку"
    );
  }
}