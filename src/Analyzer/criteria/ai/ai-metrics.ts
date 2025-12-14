import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";

export class AiMetricCriteria extends BaseCriteria {
  constructor(
    id: string,
    weight: number,
    private path: string,      // Наприклад "author.publications_count"
    private label: string,     // Наприклад "Кількість публікацій"
    private threshold: number, // Наприклад 5
    private mode: 'less_is_good' | 'more_is_good'
  ) {
    super(id, weight);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    const metrics = context.contentMetrics;

    if (!metrics) {
      return this.createResult(0, `${this.label}: Дані AI відсутні`);
    }

    const keys = this.path.split('.');
    let value: any = metrics;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = 0; // Якщо поля немає в JSON, вважаємо його 0
        break;
      }
    }

    const numValue = Number(value) || 0;
    let score = 0;

    // 2. Логіка розрахунку (Калібрована)
    if (this.mode === 'less_is_good') {
      // Чим менше, тим краще (наприклад, помилки)
      if (numValue === 0) {
        score = 100;
      } else if (numValue >= this.threshold) {
        score = 0; // Перевищили ліміт
      } else {
        // Пропорційний штраф
        score = 100 - (numValue / this.threshold) * 100;
        // Захист від від'ємних чисел (на всяк випадок)
        score = Math.max(0, score);
      }
    } else {
      // Чим більше, тим краще (наприклад, джерела)
      if (numValue >= this.threshold) {
        score = 100; // Досягли мети
      } else {
        // Пропорційна нагорода
        score = (numValue / this.threshold) * 100;
      }
    }

    const isPercentage = this.path.includes('ratio') ||
      this.path.includes('similarity') ||
      this.path.includes('score');

    const displayValue = isPercentage
      ? `${(numValue * 100).toFixed(0)}%`
      : numValue;


    return this.createResult(
      Math.round(score),
      `${this.label}: ${displayValue}`,
      { raw: numValue, threshold: this.threshold }
    );
  }
}