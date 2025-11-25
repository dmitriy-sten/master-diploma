// app/api/analyze/route.ts
import { AnalyzerRunner } from "@/Analyzer/runner";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();
  
  const runner = new AnalyzerRunner();
  const results = await runner.run(url);

  return NextResponse.json(results);
}