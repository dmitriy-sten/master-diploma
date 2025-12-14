import { ContentMetrics } from "@/Analyzer/core/types";
import { ENV_CONFIG } from "@/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(ENV_CONFIG.GEMINI_API_KEY!);

export async function analyzeContent(text: string, title: string): Promise<ContentMetrics | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Act as an objective media analyst. Analyze the provided text for credibility, manipulation, and informational value.
      
      CRITICAL OUTPUT RULE:
      Return a **FLAT JSON object** (no nested objects). Use 0 for missing data.

      === ANALYSIS GUIDELINES ===
      1. **OBJECTIVITY**: Do not bias against negative news. 
      Differentiate between "reporting on bad events" (Normal) and "author being aggressive/hostile" (Manipulation).
      2. **FACTUALITY**: Prioritize evidence, data, and verifiable sources.
      3. **AUTHORSHIP**: Look for clear attribution (Author Name / Organization). "Admin" or no signature is suspicious.
      4. **LANGUAGE**: Look for emotional charging, logical fallacies, and clickbait.

      === METRICS TO CALCULATE ===
      
      // 1. Author Credibility
      "is_reputable_agency": 1 if the source is a recognized professional organization (NGO, Media, Institute), else 0.
      "is_generic_admin": 1 if author is "Admin", "Editor", or anonymous.
      "has_special_symbols": 1 if name looks like a nickname (e.g., "Truth_Seeker_99").
      "publications_count": Estimate based on context (0 if unknown/blog, 100 if major media).
      "social_media_matches": Count specific mentions of author's social profiles.
      "affiliation_mentions": Count mentions of the author's credentials/workplace.
      "negative_factchecks": 1 if the text promotes known debunked myths.

      // 2. Verification & Facts
      "independent_confirmations": Count citations of external independent organizations/media.
      "dates_locations_count": Count specific factual details (dates, cities, names).
      "document_mentions": Count references to official documents, laws, studies.
      "verified_numbers_ratio": (0.0 - 1.0) Proportion of statistics that have a source cited.
      "info_age_days": Days since the event. 0 if fresh/timeless.
      "quotes_with_context": Count direct quotes from identified persons.
      "generalizations_count": Count manipulative generalizations ("Everyone knows", "They always").

      // 3. Logic & Structure
      "external_links_count": Count hyperlinks to external domains.
      "dependency_edges": Score (1-10) of how well paragraphs logically follow each other.
      "fallacies_count": Count logical errors (Ad Hominem, Strawman, Slippery Slope).
      "contradictions_count": Count internal contradictions in the text.
      "title_text_similarity": (0.0 - 1.0) Does the title match the content?

      // 4. Emotional Manipulation
      "negative_sentiment_score": (0.0 - 1.0) Overall negativity of the *author's tone*.
      "victim_narratives": Count attempts to trigger pity/victimhood ("We were betrayed", "Poor people suffered").
      "emotional_words_ratio": (0.0 - 1.0) Density of emotional adjectives.
      "emotional_sentences_ratio": (0.0 - 1.0) Ratio of subjective sentences.
      "caps_lock_count": Count of words in CAPS (excluding abbreviations).
      "hate_speech_count": Count of insults, slurs, or calls to violence.
      "title_trigger_words": Count clickbait words in title ("SHOCK", "SECRET", "FINALLY").
      "manipulative_patterns": Count calls to action ("Share this", "Wake up").
      "grammar_errors": Count obvious linguistic errors.
      "repeated_theses_count": Count of same idea repeated multiple times.

      // 5. Informational Value
      "news_context_similarity": (0.0 - 1.0) Semantic score: Is this informative content?
      "conflict_parties_count": How many different viewpoints are presented? (Balance).
      "analytical_statements_ratio": (0.0 - 1.0) Ratio of analysis/reasoning vs simple assertions.
      "background_mentions": Count references to context/history.
      "old_media_count": Count of repurposed/out-of-context media usage.

      === INPUT ===
      Title: "${title}"
      Body: "${text.substring(0, 15000)}"
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });




    return JSON.parse(result.response.text());

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}