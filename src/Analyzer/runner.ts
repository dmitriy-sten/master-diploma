import { AnalysisContext, GroupResult } from "./core/types";
import whois from 'whois-json'; // Библиотека для Whois
import * as cheerio from 'cheerio'; // Библиотека для HTML (если нужна предобработка)
import { SslCheck } from "./criteria/technical/ssl-check";
import { TransparencyCheck } from "./criteria/technical/transparency-check";
import { DomainAgeCheck } from "./criteria/technical/domain-age-check";
import { WhitelistCheck } from "./criteria/reputation/white-list";
import { CriteriaGroup } from "./core/criteria-group";
import { AiMetricCriteria } from "./criteria/ai/ai-metrics";
import { analyzeContent } from "@/gemini-service";



export class AnalyzerRunner {
  private groups: CriteriaGroup[];

  constructor() {
    
    const technicalGroup = new CriteriaGroup("technical", "Технічні показники", [
      new SslCheck(),            
      new TransparencyCheck(),   
      new DomainAgeCheck()      
    ]);
    const reputationGroup = new CriteriaGroup("reputation", "Репутаційні фактори", [
      new WhitelistCheck(),      
    ]);
    const authorGroup = new CriteriaGroup("author", "Аналіз авторства", [
      new AiMetricCriteria("auth_spec", 0.5, "author.has_special_symbols", "Спец-символи в імені", 1, 'less_is_good'),
      new AiMetricCriteria("auth_pub", 1.0, "author.publications_count", "Інші публікації", 5, 'more_is_good'),
      new AiMetricCriteria("auth_social", 0.8, "author.social_media_matches", "Соцмережеві профілі", 1, 'more_is_good'),
      new AiMetricCriteria("auth_affil", 0.8, "author.affiliation_mentions", "Згадки афіліації", 1, 'more_is_good'),
      new AiMetricCriteria("auth_bad", 2.0, "author.negative_factchecks", "Негативні фактчеки", 1, 'less_is_good'),
    ]);

    const verificationGroup = new CriteriaGroup("verification", "Верифікація фактів", [
      new AiMetricCriteria("ver_confirm", 1.5, "verification.independent_confirmations", "Незалежні підтвердження", 2, 'more_is_good'),
      new AiMetricCriteria("ver_loc", 1.0, "verification.dates_locations_count", "Дати/Локації", 3, 'more_is_good'),
      new AiMetricCriteria("ver_doc", 1.2, "verification.document_mentions", "Згадки документів", 1, 'more_is_good'),
      new AiMetricCriteria("ver_num", 1.0, "verification.verified_numbers_ratio", "Частка перевірених чисел", 0.5, 'more_is_good'),
      new AiMetricCriteria("ver_age", 0.5, "verification.info_age_days", "Давність події (днів)", 365, 'less_is_good'), // Чим старіше, тим гірше (для новин)
      new AiMetricCriteria("ver_quote", 1.2, "verification.quotes_with_context", "Цитати з контекстом", 2, 'more_is_good'),
      new AiMetricCriteria("ver_gen", 1.0, "verification.generalizations_count", "Кількість узагальнень", 2, 'less_is_good'),
    ]);

    const logicGroup = new CriteriaGroup("logic", "Логічна зв'язність", [
      new AiMetricCriteria("log_conn", 1.0, "logic.dependency_edges", "Логічні зв'язки", 5, 'more_is_good'),
      new AiMetricCriteria("log_fall", 1.5, "logic.fallacies_count", "Логічні помилки", 1, 'less_is_good'),
      new AiMetricCriteria("log_ext", 1.0, "logic.external_links_count", "Зовнішні джерела", 3, 'more_is_good'),
      new AiMetricCriteria("log_contra", 1.5, "logic.contradictions_count", "Суперечливі твердження", 1, 'less_is_good'),
      new AiMetricCriteria("log_sim", 0.8, "logic.title_text_similarity", "Схожість заголовку і тексту", 0.7, 'more_is_good'),
    ]);

    const emotionGroup = new CriteriaGroup("emotional", "Емоційна маніпуляція", [
      new AiMetricCriteria("emo_ratio", 1.2, "emotional.emotional_words_ratio", "Частка емоційних слів", 0.3, 'less_is_good'),
      new AiMetricCriteria("emo_gram", 0.5, "emotional.grammar_errors", "Граматичні помилки", 3, 'less_is_good'),
      new AiMetricCriteria("emo_rep", 0.8, "emotional.repeated_theses_count", "Повторювані тези", 2, 'less_is_good'),
      new AiMetricCriteria("emo_caps", 1.0, "emotional.caps_lock_count", "Слова в CAPS LOCK", 1, 'less_is_good'),
      new AiMetricCriteria("emo_manip", 1.5, "emotional.manipulative_patterns", "Маніпулятивні шаблони", 1, 'less_is_good'),
      new AiMetricCriteria("emo_trig", 1.2, "emotional.title_trigger_words", "Тригери в заголовку", 1, 'less_is_good'),
      new AiMetricCriteria("emo_neg", 1.0, "emotional.negative_sentiment_score", "Рівень негативу", 0.6, 'less_is_good'),
      new AiMetricCriteria("emo_vict", 1.0, "emotional.victim_narratives", "Наратив 'Жертва'", 1, 'less_is_good'),
      new AiMetricCriteria("emo_sent", 1.0, "emotional.emotional_sentences_ratio", "Емоційні речення", 0.4, 'less_is_good'),
      new AiMetricCriteria("emo_hate", 2.0, "emotional.hate_speech_count", "Мова ворожнечі", 1, 'less_is_good'),
    ]);

    // --- 6. ГРУПА: ІНФОРМАЦІЙНА ЦІННІСТЬ (AI) ---
    const infoValueGroup = new CriteriaGroup("info_value", "Інформаційна цінність", [
      new AiMetricCriteria("inf_news", 1.0, "info_value.news_context_similarity", "Схожість з контекстом новин", 0.6, 'more_is_good'),
      new AiMetricCriteria("inf_old", 1.0, "info_value.old_media_count", "Старі медіафайли", 1, 'less_is_good'),
      new AiMetricCriteria("inf_party", 1.0, "info_value.conflict_parties_count", "Згадки сторін конфлікту", 2, 'more_is_good'), // Добре, коли висвітлено різні сторони
      new AiMetricCriteria("inf_back", 0.8, "info_value.background_mentions", "Історичний бекґраунд", 1, 'more_is_good'),
      new AiMetricCriteria("inf_anal", 1.2, "info_value.analytical_statements_ratio", "Аналітичні висловлювання", 0.2, 'more_is_good'),
    ]);

    this.groups = [
      technicalGroup,
      authorGroup,
      verificationGroup,
      logicGroup,
      emotionGroup,
      infoValueGroup,
      reputationGroup
    ];
  }

  async run(url: string) {
    const urlObj = new URL(url);
    
    console.log("Fetching resources...");
    
    let html = '';
    let text = '';
    let title = '';
    let whoisData = null;
    let aiMetrics = null;

    try {
        const [res, wData] = await Promise.all([
             fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0...' }}),
             whois(urlObj.hostname).catch(() => null)
        ]);
        
        html = await res.text();
        whoisData = wData;

        const $ = cheerio.load(html);
        $('script, style, nav, footer, iframe').remove();
        title = $('title').text().trim() || $('h1').first().text().trim();
        text = $('body').text().replace(/\s+/g, ' ').trim();

        if (text.length > 100) {
            console.log("Running AI Analysis...");
            aiMetrics = await analyzeContent(text, title);
        }

    } catch (e) {
        console.error("Data fetching error:", e);
    }

    const context: AnalysisContext = {
      url,
      urlObj,
      html,
      text,
      domainData: whoisData,
      contentMetrics: aiMetrics 
    };

    const groupResults = await Promise.all(
      this.groups.map(g => g.analyze(context))
    );

    let totalWeightedScore = 0;
    let totalWeight = 0;

    const totalScore = Math.round(
      groupResults.reduce((acc, g) => acc + g.score, 0) / groupResults.length
    );

    return {
      url,
      totalScore,
      timestamp: new Date().toISOString(),
      groups: groupResults
    };
  }
}