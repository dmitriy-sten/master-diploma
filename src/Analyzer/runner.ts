import { SslCheck } from "./criteria/technical/ssl-check";
import { TransparencyCheck } from "./criteria/technical/transparency-check";
import { DomainAgeCheck } from "./criteria/technical/domain-age-check";
import { WhitelistCheck } from "./criteria/reputation/white-list";
import { analyzeContent } from "@/gemini-service";
import whois from 'whois-json';
import * as cheerio from 'cheerio';
import { CriteriaGroup } from "./core/criteria-group";
import { AnalysisContext } from "./core/types";
import { AiMetricCriteria } from "./criteria/ai/ai-metrics";

export class AnalyzerRunner {
  private groups: CriteriaGroup[];

  constructor() {
    // --- 1. ТЕХНІЧНІ ПОКАЗНИКИ ---
    const technicalGroup = new CriteriaGroup("technical", "Технічні показники", [
      new SslCheck(),
      new TransparencyCheck(),
      // Вага 0.1, щоб закритий Whois не псував картину
      new DomainAgeCheck().setWeight(0.1)
    ]);

    // --- 2. РЕПУТАЦІЯ ("ЯДЕРНИЙ БУСТ") ---
    const reputationGroup = new CriteriaGroup("reputation", "Репутаційні фактори", [
      new WhitelistCheck().setWeight(30.0), // Вага 30! Це головний фактор.
    ]);

    // --- 3. АВТОРСТВО ---
    const authorGroup = new CriteriaGroup("author", "Аналіз авторства", [
      // == ВАЖЛИВО: Видалено префікс "author.", бо JSON від AI плоский ==
      
      // Бонуси
      new AiMetricCriteria("auth_agency", 5.0, "is_reputable_agency", "Авторитетне медіа", 1, 'more_is_good'),
      new AiMetricCriteria("auth_pub", 1.0, "publications_count", "Історія публікацій", 20, 'more_is_good'),
      new AiMetricCriteria("auth_affil", 0.5, "affiliation_mentions", "Афіліація", 1, 'more_is_good'),
      new AiMetricCriteria("auth_social", 0.2, "social_media_matches", "Соцмережі", 1, 'more_is_good'),
      
      // Штрафи
      new AiMetricCriteria("auth_bad", 5.0, "negative_factchecks", "База фейкоробів", 1, 'less_is_good'),
      new AiMetricCriteria("auth_anon", 2.0, "is_generic_admin", "Анонім (Admin)", 1, 'less_is_good'),
      new AiMetricCriteria("auth_sym", 0.5, "has_special_symbols", "Спецсимволи", 1, 'less_is_good'),
    ]);

    // --- 4. ВЕРИФІКАЦІЯ ---
    const verificationGroup = new CriteriaGroup("verification", "Верифікація фактів", [
      // Видалено префікс "verification."
      new AiMetricCriteria("ver_confirm", 5.0, "independent_confirmations", "Незалежні джерела", 1, 'more_is_good'),
      new AiMetricCriteria("ver_loc", 2.0, "dates_locations_count", "Фактаж (дати/місця)", 2, 'more_is_good'),
      new AiMetricCriteria("ver_num", 2.0, "verified_numbers_ratio", "Перевірені цифри", 0.1, 'more_is_good'),
      new AiMetricCriteria("ver_quote", 1.5, "quotes_with_context", "Цитати з контекстом", 2, 'more_is_good'),
      new AiMetricCriteria("ver_doc", 0.5, "document_mentions", "Документи", 1, 'more_is_good'),
      new AiMetricCriteria("ver_gen", 1.0, "generalizations_count", "Узагальнення", 3, 'less_is_good'),
      new AiMetricCriteria("ver_age", 0.2, "info_age_days", "Давність (архів)", 1000, 'less_is_good'),
    ]);

    // --- 5. ЛОГІКА ---
    const logicGroup = new CriteriaGroup("logic", "Логічна зв'язність", [
      // Поріг 0. Дозволяємо BBC не мати зовнішніх посилань.
      new AiMetricCriteria("log_ext", 0.1, "external_links_count", "Зовнішні посилання", 0, 'more_is_good'),
      
      new AiMetricCriteria("log_conn", 1.0, "dependency_edges", "Логічні зв'язки", 2, 'more_is_good'),
      new AiMetricCriteria("log_sim", 1.0, "title_text_similarity", "Відповідність заголовку", 0.6, 'more_is_good'),
      new AiMetricCriteria("log_fall", 3.0, "fallacies_count", "Логічні хиби", 1, 'less_is_good'),
      new AiMetricCriteria("log_contra", 3.0, "contradictions_count", "Суперечливі твердження", 1, 'less_is_good'),
    ]);

    // --- 6. ЕМОЦІЇ (РЕЖИМ "ВІЙСЬКОВА ЖУРНАЛІСТИКА") ---
    const emotionGroup = new CriteriaGroup("emotional", "Емоційна забарвленість", [
      // === ПОВНА ТОЛЕРАНТНІСТЬ ===
      // Негатив: Поріг 1.0. Війна — це негатив.
      new AiMetricCriteria("emo_neg", 0.1, "negative_sentiment_score", "Негативна тональність", 1.0, 'less_is_good'),

      // Жертви: Поріг 50. Дозволяємо говорити про жертв.
      new AiMetricCriteria("emo_vict", 0.1, "victim_narratives", "Згадки про жертв", 50, 'less_is_good'),

      new AiMetricCriteria("emo_sent", 0.1, "emotional_sentences_ratio", "Емоційні речення", 0.9, 'less_is_good'),
      new AiMetricCriteria("emo_ratio", 0.1, "emotional_words_ratio", "Словник емоцій", 0.8, 'less_is_good'),

      // === ЖОРСТКІ ШТРАФИ ЗА СМІТТЯ ===
      new AiMetricCriteria("emo_caps", 3.0, "caps_lock_count", "CAPS LOCK", 1, 'less_is_good'),
      new AiMetricCriteria("emo_hate", 10.0, "hate_speech_count", "Мова ворожнечі", 1, 'less_is_good'),
      new AiMetricCriteria("emo_trig", 2.0, "title_trigger_words", "Клікбейт у заголовку", 1, 'less_is_good'),
      new AiMetricCriteria("emo_manip", 2.0, "manipulative_patterns", "Маніпулятивні патерни", 1, 'less_is_good'),
      new AiMetricCriteria("emo_gram", 0.5, "grammar_errors", "Граматичні помилки", 5, 'less_is_good'),
      new AiMetricCriteria("emo_rep", 0.5, "repeated_theses_count", "Повтори", 3, 'less_is_good'),
    ]);

    // --- 7. ІНФО ЦІННІСТЬ ---
    const infoValueGroup = new CriteriaGroup("info_value", "Інформаційна цінність", [
      new AiMetricCriteria("inf_news", 2.0, "news_context_similarity", "Новинний стиль", 0.5, 'more_is_good'),
      new AiMetricCriteria("inf_party", 1.0, "conflict_parties_count", "Баланс сторін", 2, 'more_is_good'),
      new AiMetricCriteria("inf_anal", 1.0, "analytical_statements_ratio", "Аналітика", 0.1, 'more_is_good'),
      new AiMetricCriteria("inf_back", 0.5, "background_mentions", "Історичний контекст", 1, 'more_is_good'),
      new AiMetricCriteria("inf_old", 1.0, "old_media_count", "Старі медіа", 1, 'less_is_good'),
    ]);

    // Порядок груп важливий для розрахунку ваг за індексом!
    this.groups = [
      technicalGroup,   // 0
      authorGroup,      // 1
      reputationGroup,  // 2
      verificationGroup,// 3
      logicGroup,       // 4
      emotionGroup,     // 5
      infoValueGroup    // 6
    ];
  }

  async run(url: string) {
    let urlObj: URL;
    try {
        urlObj = new URL(url);
    } catch (e) {
        console.error("Invalid URL:", url);
        return { url, totalScore: 0, timestamp: new Date().toISOString(), groups: [] };
    }

    console.log("_____Starting Analysis______");
    console.log(`Target: ${url}`);

    let html = '';
    let text = '';
    let title = '';
    let whoisData = null;
    let aiMetrics = null;

    try {
      console.log("1. Fetching resources...");
      const [res, wData] = await Promise.all([
        fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }).catch(e => { console.error("Fetch failed", e); return null; }),
        whois(urlObj.hostname).catch(() => null)
      ]);

      if (res) {
          html = await res.text();
          whoisData = wData;

          const $ = cheerio.load(html);
          // Чистимо зайве
          $('script, style, nav, footer, iframe, noscript').remove();
          
          title = $('title').text().trim() || $('h1').first().text().trim() || "";
          text = $('body').text().replace(/\s+/g, ' ').trim();

          console.log(`2. Content parsed. Title: "${title.substring(0, 50)}..."`);

          if (text.length > 200) {
            console.log("3. Running AI Semantic Analysis (Gemini)...");
            // Обмежуємо довжину тексту для AI
            aiMetrics = await analyzeContent(text.substring(0, 15000), title);

            console.log(aiMetrics);
            
          }
      }
    } catch (e) {
      console.error("Analysis Error:", e);
    }

    const context: AnalysisContext = {
      url,
      urlObj,
      html,
      text,
      domainData: whoisData,
      contentMetrics: aiMetrics || {},
      aiMetrics: aiMetrics || {}
    };

    console.log('AI metrics analyzed.');

    // Запуск оцінювання по всіх групах
    const groupResults = await Promise.all(
      this.groups.map(g => g.analyze(context))
    );

    // === ФІНАЛЬНИЙ РОЗРАХУНОК (Hardcoded Weights) ===
    // Порядок відповідає масиву this.groups:
    // 0: Technical (1.0)
    // 1: Author (10.0) -> Агентство/ЗМІ
    // 2: Reputation (30.0) -> Whitelist
    // 3: Verification (10.0) -> Факти
    // 4: Logic (1.0) 
    // 5: Emotional (1.0) -> Ігноруємо негатив
    // 6: Info Value (5.0)

    const weights = [1.0, 10.0, 30.0, 10.0, 1.0, 1.0, 5.0];

    let totalScoreSum = 0;
    let totalWeightSum = 0;

    groupResults.forEach((res, index) => {
      const weight = weights[index] || 1.0;
      totalScoreSum += res.score * weight;
      totalWeightSum += weight;
    });

    const totalScore = totalWeightSum > 0 
        ? Math.round(totalScoreSum / totalWeightSum) 
        : 0;

    console.log(`FINAL CALCULATED SCORE: ${totalScore}%`);

    return {
      url,
      totalScore,
      timestamp: new Date().toISOString(),
      groups: groupResults
    };
  }
}