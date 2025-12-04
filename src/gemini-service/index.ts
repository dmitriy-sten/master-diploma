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


    console.log();
    

    const prompt = `
      Act as a professional disinformation analyst and NLP engineer.
      Analyze the text provided below.
      
      Output a STRICT JSON object matching the requested schema. 
      Use 0 for missing data. Estimate values if precise calculation requires external DB access.

      Text Title: "${title}"
      Text Body: "${text.substring(0, 20000)}"

      CALCULATE THE FOLLOWING METRICS:

      --- GROUP 2: AUTHOR ---
      - has_special_symbols: 1 if author name has suspicious symbols (@, numbers), else 0.
      - publications_count: Estimate author's article count based on context/fame (0 if unknown).
      - social_media_matches: Count mentions of LinkedIn, Twitter, Facebook profiles.
      - affiliation_mentions: Count mentions of universities, companies the author works for.
      - negative_factchecks: 1 if author sounds like a known fake-spreader, else 0.

      --- GROUP 3: VERIFICATION ---
      - independent_confirmations: Count references to Reuters, AP, BBC, Gov sites.
      - dates_locations_count: Count specific dates (YYYY-MM-DD) and City/Country names.
      - document_mentions: Count mentions of "Report No...", "Law...", "Protocol...".
      - verified_numbers_ratio: (Float 0.0-1.0) Ratio of numbers with citations / total numbers.
      - info_age_days: Days since the event described. 0 if today/unclear.
      - quotes_with_context: Count quotes that have "Name said..." and context.
      - generalizations_count: Count words: "all", "never", "always", "everyone", "nobody" (and UA/RU equivalents).

      --- GROUP 4: LOGIC ---
      - dependency_edges: Estimate logical connection density (count of "because", "therefore", "due to").
      - fallacies_count: Count logical fallacies (ad hominem, strawman).
      - external_links_count: Count external hyperlinks found or mentioned.
      - contradictions_count: Count internal contradictions in the text.
      - title_text_similarity: (Float 0.0-1.0) Semantic similarity between title and body.

      --- GROUP 5: EMOTIONAL ---
      - emotional_words_ratio: (Float 0.0-1.0) Count of emotional adjectives / total words.
      - grammar_errors: Estimate count of obvious grammar/stylistic errors.
      - repeated_theses_count: Count of phrases repeated >2 times.
      - caps_lock_count: Count of words in CAPS LOCK (>3 chars).
      - manipulative_patterns: Count phrases like "they hide the truth", "share before deleted".
      - title_trigger_words: Count words like "SHOCK", "SENSATION", "URGENT".
      - negative_sentiment_score: (Float 0.0-1.0) How negative/angry is the text?
      - victim_narratives: Count phrases about "betrayal", "innocent suffering".
      - emotional_sentences_ratio: (Float 0.0-1.0).
      - hate_speech_count: Count slurs or hate speech terms.

      --- GROUP 6: INFO VALUE ---
      - news_context_similarity: (Float 0.0-1.0) Does this look like real news vs generated spam?
      - old_media_count: Count mentions of images/videos described as old or out of context.
      - conflict_parties_count: How many different sides of a conflict are mentioned?
      - background_mentions: Count references to historical context/past events.
      - analytical_statements_ratio: (Float 0.0-1.0) Ratio of analytical sentences.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return JSON.parse(result.response.text()) as ContentMetrics;

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}