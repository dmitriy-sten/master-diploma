// src/lib/analyzer/core/types.ts

// Данные, которые мы собираем один раз и передаем всем проверкам
export interface AnalysisContext {
    url: string;
    urlObj: URL;
    html?: string;   // HTML контент страницы
    text?: string;   // Чистый текст статьи
    domainData?: any; // Данные Whois (чтобы не делать запрос дважды)
  }
  
  // Результат одной проверки
  export interface CriterionResult {
    id: string;          // 'ssl_check'
    score: number;       // 0 to 100
    weight: number;      // Важность этого критерия (0.1 - 1.0)
    details: string;     // Пояснение: "SSL сертификат найден"
    metadata?: any;      // Доп данные (например, имя регистратора)
  }
  
  // Результат группы (например, "Технический анализ")
  export interface GroupResult {
    groupId: string;     // 'technical'
    title: string;       // 'Технічні показники'
    score: number;       // Средневзвешенная оценка группы (0-100)
    criteriaResults: CriterionResult[];
  }