import { AnalysisContext, GroupResult } from "./core/types";
import whois from 'whois-json'; // Библиотека для Whois
import * as cheerio from 'cheerio'; // Библиотека для HTML (если нужна предобработка)
import { SslCheck } from "./criteria/technical/ssl-check";
import { TransparencyCheck } from "./criteria/technical/transparency-check";
import { DomainAgeCheck } from "./criteria/technical/domain-age-check";
import { WhitelistCheck } from "./criteria/reputation/white-list";
import { CriteriaGroup } from "./core/criteria-group";



export class AnalyzerRunner {
  private groups: CriteriaGroup[];

  constructor() {
    
    const technicalGroup = new CriteriaGroup("technical", "Технічні показники", [
      new SslCheck(),            // Проверка HTTPS
      new TransparencyCheck(),   // Проверка Contact/About (юзает HTML)
    //   new DomainLengthCheck(),   // Длина домена
      new DomainAgeCheck()       // Возраст домена (юзает Whois)
    ]);
    const reputationGroup = new CriteriaGroup("reputation", "Репутаційні фактори", [
      new WhitelistCheck(),      // Белый список СМИ
    ]);

    this.groups = [technicalGroup, reputationGroup];
  }

  async run(url: string) {
    console.log(`Starting analysis for: ${url}`);
    
    
    let htmlContent = '';
    let domainData = null;
    let urlObj: URL;

    try {
      urlObj = new URL(url);
    } catch (e) {
      throw new Error("Invalid URL format");
    }

    await Promise.all([
      fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0Bot' } })
        .then(res => res.text())
        .then(text => { htmlContent = text; })
        .catch(err => console.error("HTML fetch failed:", err)),

      whois(urlObj.hostname)
        .then(data => { domainData = data; })
        .catch(err => console.error("Whois lookup failed:", err))
    ]);

    const context: AnalysisContext = {
      url,
      urlObj,
      html: htmlContent, 
      domainData: domainData 
    };

    const groupResults: GroupResult[] = await Promise.all(
      this.groups.map(group => group.analyze(context))
    );

    const totalScore = Math.round(
      groupResults.reduce((sum, g) => sum + g.score, 0) / groupResults.length
    );

    return {
      url,
      totalScore, // 0-100
      timestamp: new Date().toISOString(),
      groups: groupResults
    };
  }
}