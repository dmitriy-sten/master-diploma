// Результат одного критерия
export interface CriterionResult {
  id: string;
  score: number; // 0-100
  weight: number; // Важность (0.1 - 3.0)
  details: string;
  metadata?: any;
}

// Результат группы
export interface GroupResult {
  groupId: string;
  title: string;
  score: number;
  criteriaResults: CriterionResult[];
}

// --- ИНТЕРФЕЙС AI ОТВЕТА (Строго по твоим пунктам) ---
export interface ContentMetrics {
  author: {
    has_special_symbols: number;     // 2.1 (0/1)
    publications_count: number;      // 2.2
    social_media_matches: number;    // 2.3
    affiliation_mentions: number;    // 2.4
    negative_factchecks: number;     // 2.5
  };
  verification: {
    independent_confirmations: number; // 3.1
    dates_locations_count: number;     // 3.2
    document_mentions: number;         // 3.3
    verified_numbers_ratio: number;    // 3.4 (0.0-1.0)
    info_age_days: number;             // 3.5
    quotes_with_context: number;       // 3.6
    generalizations_count: number;     // 3.7
  };
  logic: {
    dependency_edges: number;          // 4.1
    fallacies_count: number;           // 4.2
    external_links_count: number;      // 4.3
    contradictions_count: number;      // 4.4
    title_text_similarity: number;     // 4.5 (0.0-1.0)
  };
  emotional: {
    emotional_words_ratio: number;     // 5.1 (0.0-1.0)
    grammar_errors: number;            // 5.2
    repeated_theses_count: number;     // 5.3
    caps_lock_count: number;           // 5.4
    manipulative_patterns: number;     // 5.5
    title_trigger_words: number;       // 5.6
    negative_sentiment_score: number;  // 5.7 (0.0-1.0)
    victim_narratives: number;         // 5.8
    emotional_sentences_ratio: number; // 5.9 (0.0-1.0)
    hate_speech_count: number;         // 5.10
  };
  info_value: {
    news_context_similarity: number;   // 6.1 (0.0-1.0)
    old_media_count: number;           // 6.2
    conflict_parties_count: number;    // 6.3
    background_mentions: number;       // 6.4
    analytical_statements_ratio: number; // 6.5 (0.0-1.0)
  };
}

export interface AnalysisContext {
  url: string;
  urlObj: URL;
  html?: string;     // Raw HTML
  text?: string;     // Clean Text
  
  domainData?: any;          
  contentMetrics?: ContentMetrics | null; 
}