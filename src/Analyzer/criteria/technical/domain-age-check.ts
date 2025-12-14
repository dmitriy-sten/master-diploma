import { BaseCriteria } from "@/Analyzer/core/base-analyzer";
import { AnalysisContext, CriterionResult } from "../../core/types";

export class DomainAgeCheck extends BaseCriteria {
  constructor() {
    super("domain_age", 1.0);
  }

  async evaluate(context: AnalysisContext): Promise<CriterionResult> {
    const data = context.domainData;

    console.log("🔍 [DomainAgeCheck] Raw Data Received:", JSON.stringify(data, null, 2));

    // 1. Якщо даних взагалі немає
    if (!data || Object.keys(data).length === 0) {
      console.warn("⚠️ [DomainAgeCheck] Data object is empty or undefined");
      return this.createResult(50, "Дані Whois недоступні (Сервер не відповів)");
    }

    // 2. Пошук дати
    const creationDate = this.findCreationDate(data);

    // 3. Якщо дату не знайдено
    if (!creationDate) {
      console.warn("⚠️ [DomainAgeCheck] Failed to find any valid date in the provided object.");
      return this.createResult(50, "Дата реєстрації прихована (Корпоративний захист або GDPR)");
    }

    console.log(`✅ [DomainAgeCheck] Date Successfully Parsed: ${creationDate.toISOString()}`);

    // 4. Розрахунок віку
    const today = new Date();
    const ageInMilliseconds = today.getTime() - creationDate.getTime();
    const ageYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
    const ageFormatted = ageYears.toFixed(1);

    console.log(`ℹ️ [DomainAgeCheck] Calculated Age: ${ageFormatted} years`);

    // 5. Логіка оцінювання
    if (ageYears < 0) {
      console.error("❌ [DomainAgeCheck] Error: Domain date is in the future!");
      return this.createResult(50, "Помилка читання дати реєстрації (Дата з майбутнього)");
    }

    if (ageYears < 0.25) { 
      console.log("🚨 [DomainAgeCheck] Verdict: High Risk (< 3 months)");
      return this.createResult(0, `Критично новий домен (${ageFormatted} років). Високий ризик фішингу.`);
    }

    if (ageYears < 1) {
      console.log("⚠️ [DomainAgeCheck] Verdict: Warning (< 1 year)");
      return this.createResult(40, `Молодий домен (${ageFormatted} років). Потребує уваги.`);
    }

    if (ageYears > 5) {
      console.log("✅ [DomainAgeCheck] Verdict: Trusted (> 5 years)");
      return this.createResult(100, `Авторитетний домен (${ageFormatted} років).`);
    }

    console.log("✅ [DomainAgeCheck] Verdict: Normal (1-5 years)");
    return this.createResult(80, `Стабільний домен (${ageFormatted} років).`);
  }

  private findCreationDate(data: any): Date | null {
    const possibleKeys = [
      'creationDate',
      'created',
      'creation_date',
      'registered',
      'registrationDate',
      'domainCreateDate',
      'createdDate',
      'regDate' 
    ];

    console.log("🕵️ [DomainAgeCheck] Scanning keys for date...");

    for (const key of possibleKeys) {
      const value = data[key];
      
      if (value) {
        console.log(`   > Checking key '${key}': ${value}`);
        const date = new Date(value);
        
        if (!isNaN(date.getTime())) {
          console.log(`   >>> MATCH! Valid date found in key: '${key}'`);
          return date;
        } else {
          console.log(`   >>> Invalid Date format in key '${key}'`);
        }
      }
    }
    
    console.log("❌ [DomainAgeCheck] No matching keys found.");
    return null;
  }
}