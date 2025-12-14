import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";
import * as cheerio from 'cheerio'; 

export class TransparencyCheck extends BaseCriteria {
  constructor() {
    super("transparency_check", 0.5); // Вага 0.5, бо це не гарантія правди, але маркер якості
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    if (!context.html) {
      return this.createResult(0, "Не вдалося завантажити контент сторінки");
    }

    const $ = cheerio.load(context.html);
    
    const keywords = {
      about: [
        'about', 'team', 'mission', 'story', 'who we are', // EN
        'про нас', 'про сайт', 'команда', 'редакція', 'хто ми', 'місія', // UA
        'о нас', 'о сайте', 'редакция' // RU
      ],
      contact: [
        'contact', 'support', 'feedback', 'touch', // EN
        'контакти', 'зв\'язок', 'написати', 'адреса', 'телефон', // UA
        'контакты', 'связь', 'адрес' // RU
      ],
      policy: [
        'policy', 'privacy', 'terms', 'agreement', 'rules', 'disclaimer', // EN
        'політика', 'конфіденційність', 'умови', 'правила', 'угода', 'користування', // UA
        'политика', 'конфиденциальность', 'условия', 'правила', 'соглашение' // RU
      ]
    };

    const found = {
      about: false,
      contact: false,
      policy: false
    };

    $('a').each((_, el) => {
      const link = $(el);
      const href = link.attr('href')?.toLowerCase() || '';
      const text = link.text().toLowerCase().trim();
      
      const contentToCheck = `${href} ${text}`;

      if (!found.about && keywords.about.some(k => contentToCheck.includes(k))) {
        found.about = true;
      }
      if (!found.contact && keywords.contact.some(k => contentToCheck.includes(k))) {
        found.contact = true;
      }
      if (!found.policy && keywords.policy.some(k => contentToCheck.includes(k))) {
        found.policy = true;
      }

      if (found.about && found.contact && found.policy) return false;
    });

    // Розрахунок балів (макс 100)
    let score = 0;
    const foundList: string[] = [];

    if (found.about) {
      score += 35;
      foundList.push("Інформація про нас");
    }
    if (found.contact) {
      score += 35;
      foundList.push("Контакти");
    }
    if (found.policy) {
      score += 30; // Трохи менше ваги
      foundList.push("Правила/Політика");
    }

    // Формуємо вердикт
    if (score === 0) {
      return this.createResult(0, "Сайт не містить сторінок прозорості (анонімний ресурс)");
    }

    if (score < 50) {
      return this.createResult(score, `Низька прозорість. Знайдено лише: ${foundList.join(', ')}`);
    }

    return this.createResult(score, `Висока прозорість. Знайдено: ${foundList.join(', ')}`);
  }
}