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
      new SslCheck(),            // weight за замовчуванням 1
      new TransparencyCheck(),   // weight 1
      new DomainAgeCheck()       // weight 1
    ]);

 
    const reputationGroup = new CriteriaGroup("reputation", "Репутаційні фактори", [
      new WhitelistCheck(), // Якщо 100 - супер. Якщо 0 - ну ок, перевіряємо далі.
    ]);

    // --- 3. АВТОР (Пом'якшуємо вимоги) ---
    const authorGroup = new CriteriaGroup("author", "Аналіз авторства", [
      new AiMetricCriteria("auth_spec", 0.3, "author.has_special_symbols", "Спец-символи", 1, 'less_is_good'),
      new AiMetricCriteria("auth_pub", 1.0, "author.publications_count", "Інші публікації", 2, 'more_is_good'),
      new AiMetricCriteria("auth_social", 0.5, "author.social_media_matches", "Соцмережі", 1, 'more_is_good'),
      new AiMetricCriteria("auth_affil", 0.5, "author.affiliation_mentions", "Афіліація", 1, 'more_is_good'),
      new AiMetricCriteria("auth_bad", 2.0, "author.negative_factchecks", "Негативні фактчеки", 1, 'less_is_good'),
    ]);

    const verificationGroup = new CriteriaGroup("verification", "Верифікація фактів", [
      new AiMetricCriteria("ver_confirm", 2.0, "verification.independent_confirmations", "Джерела", 1, 'more_is_good'),
      new AiMetricCriteria("ver_loc", 1.0, "verification.dates_locations_count", "Фактаж (дати/місця)", 2, 'more_is_good'),
      new AiMetricCriteria("ver_doc", 0.5, "verification.document_mentions", "Офіційні документи", 1, 'more_is_good'),
      new AiMetricCriteria("ver_num", 1.5, "verification.verified_numbers_ratio", "Підтверджені цифри", 0.2, 'more_is_good'),
      new AiMetricCriteria("ver_age", 0.3, "verification.info_age_days", "Давність події", 730, 'less_is_good'),
      new AiMetricCriteria("ver_quote", 1.5, "verification.quotes_with_context", "Цитати", 1, 'more_is_good'),
      new AiMetricCriteria("ver_gen", 1.0, "verification.generalizations_count", "Маніпулятивні узагальнення", 3, 'less_is_good'),
    ]);

    const logicGroup = new CriteriaGroup("logic", "Логічна зв'язність", [
      new AiMetricCriteria("log_conn", 0.8, "logic.dependency_edges", "Логічні зв'язки", 3, 'more_is_good'),
      new AiMetricCriteria("log_fall", 2.0, "logic.fallacies_count", "Логічні хиби", 1, 'less_is_good'),
      new AiMetricCriteria("log_contra", 2.0, "logic.contradictions_count", "Протиріччя", 1, 'less_is_good'),
      new AiMetricCriteria("log_ext", 1.0, "logic.external_links_count", "Зовнішні посилання", 1, 'more_is_good'),
      new AiMetricCriteria("log_sim", 1.5, "logic.title_text_similarity", "Відповідність заголовку", 0.5, 'more_is_good'),
    ]);

    const emotionGroup = new CriteriaGroup("emotional", "Емоційна маніпуляція", [
      new AiMetricCriteria("emo_ratio", 1.0, "emotional.emotional_words_ratio", "Емоційна лексика", 0.4, 'less_is_good'),
      new AiMetricCriteria("emo_gram", 0.5, "emotional.grammar_errors", "Помилки", 5, 'less_is_good'),
      new AiMetricCriteria("emo_caps", 1.5, "emotional.caps_lock_count", "CAPS LOCK", 1, 'less_is_good'),
      new AiMetricCriteria("emo_manip", 2.0, "emotional.manipulative_patterns", "Маніпулятивні патерни", 1, 'less_is_good'),
      new AiMetricCriteria("emo_trig", 2.0, "emotional.title_trigger_words", "Тригери в заголовку", 1, 'less_is_good'),
      new AiMetricCriteria("emo_neg", 0.5, "emotional.negative_sentiment_score", "Негативна тональність", 0.8, 'less_is_good'),
      new AiMetricCriteria("emo_hate", 3.0, "emotional.hate_speech_count", "Мова ворожнечі", 1, 'less_is_good'),
    ]);

    const infoValueGroup = new CriteriaGroup("info_value", "Інформаційна цінність", [
      new AiMetricCriteria("inf_news", 1.0, "info_value.news_context_similarity", "Контекст новин", 0.5, 'more_is_good'),
      new AiMetricCriteria("inf_old", 1.5, "info_value.old_media_count", "Старі фото/відео", 1, 'less_is_good'),
      new AiMetricCriteria("inf_party", 0.8, "info_value.conflict_parties_count", "Сторони конфлікту", 1, 'more_is_good'),
      new AiMetricCriteria("inf_anal", 1.0, "info_value.analytical_statements_ratio", "Аналітика", 0.1, 'more_is_good'),
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