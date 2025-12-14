import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";

export class WhitelistCheck extends BaseCriteria {
  // Розширений список для тестування
  private readonly WHITELIST = [
    // Global
    'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'cnn.com', 'bloomberg.com',
    // Ukraine - Top Tier
    'pravda.com.ua', 'nv.ua', 'ukrinform.ua', 'liga.net',
    'radiosvoboda.org', 'unian.ua', 'suspilne.media', 
    'hromadske.ua', 'babel.ua', 'interfax.com.ua',
    // Gov
    'gov.ua', 'mil.gov.ua'
  ];

  constructor() {
    super("whitelist_check", 3.0);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    const urlToCheck = context.url.toLowerCase();

    console.log(`🛡️ [WhitelistCheck] Starting verification...`);
    console.log(`   > Input URL: "${urlToCheck}"`);
    console.log(`   > Whitelist size: ${this.WHITELIST.length} domains`);

    const matchedDomain = this.WHITELIST.find(trusted => urlToCheck.includes(trusted));

    if (matchedDomain) {
      console.log(`✅ [WhitelistCheck] MATCH FOUND!`);
      console.log(`   > Matched Entry: "${matchedDomain}"`);
      console.log(`   > Verdict: TRUSTED (Score: 100)`);
      
      return this.createResult(100, `Домен знаходиться у списку довірених медіа (WhiteList: ${matchedDomain}).`);
    }

    console.log(`❌ [WhitelistCheck] No match found.`);
    console.log(`   > Verdict: NEUTRAL (Score: 50)`);
    
    return this.createResult(50, "Домен відсутній у білому списку (Стандартна перевірка).");
  }
}