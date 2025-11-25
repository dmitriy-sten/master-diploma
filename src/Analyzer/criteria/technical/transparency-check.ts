import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";
import * as cheerio from 'cheerio'; 

export class TransparencyCheck extends BaseCriteria {
  constructor() {
    super("transparency_check", 0.5);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    if (!context.html) {
      return this.createResult(0, "Не вдалося завантажити контент сторінки");
    }

    const $ = cheerio.load(context.html);

    const links = $('a').map((i, el) => $(el).attr('href')?.toLowerCase()).get();

    const hasAbout = links.some(l => l && (l.includes('/about') || l.includes('про-нас')));
    const hasContact = links.some(l => l && (l.includes('/contact') || l.includes('контакти')));
    const hasPolicy = links.some(l => l && (l.includes('policy') || l.includes('privacy')));

    let score = 0;
    if (hasAbout) score += 33;
    if (hasContact) score += 33;
    if (hasPolicy) score += 34;

    return this.createResult(
      score, 
      `Знайдено сторінок: ${hasAbout ? 'About ' : ''}${hasContact ? 'Contacts ' : ''}`
    );
  }
}