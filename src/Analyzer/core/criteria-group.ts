import { BaseCriteria } from "./base-analyzer";
import { AnalysisContext, GroupResult } from "./types";

export class CriteriaGroup {
  constructor(
    public id: string,
    public title: string,
    private criteria: BaseCriteria[]
  ) {}

  async analyze(context: AnalysisContext): Promise<GroupResult> {
    const results = await Promise.all(
      this.criteria.map((c) => c.evaluate(context))
    );

    let totalScore = 0;
    let totalWeight = 0;

    results.forEach((r) => {
      totalScore += r.score * r.weight;
      totalWeight += r.weight;
    });

    const finalGroupScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      groupId: this.id,
      title: this.title,
      score: Math.round(finalGroupScore),
      criteriaResults: results,
    };
  }
}