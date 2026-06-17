/**
 * AI Model Mappings Configuration
 *
 * Centralized configuration for mapping models between different providers
 */

export interface ModelMapping {
  openrouterModel: string;
  ollamaModel: string;
  description?: string;
}

/**
 * Centralized model mappings between OpenRouter and Ollama
 */
export const MODEL_MAPPINGS: ModelMapping[] = [
  {
    openrouterModel: 'meta-llama/llama-3.3-70b-instruct:free',
    ollamaModel: 'llama3.2:3b',
    description: 'Llama 3.x family mapping',
  },
  {
    openrouterModel: 'meta-llama/llama-3.2-3b-instruct:free',
    ollamaModel: 'llama3.2:3b',
    description: 'Llama 3.2 3B',
  },
  {
    openrouterModel: 'meta-llama/llama-3.2-1b-instruct:free',
    ollamaModel: 'llama3.2:1b',
    description: 'Llama 3.2 1B',
  },
  {
    openrouterModel: 'google/gemini-2.0-flash-exp:free',
    ollamaModel: 'mistral:7b',
    description: 'Gemini to Mistral mapping',
  },
  {
    openrouterModel: 'google/gemma-3-27b-it:free',
    ollamaModel: 'gemma2:27b',
    description: 'Gemma 3 mapping',
  },
  {
    openrouterModel: 'mistralai/mistral-7b-instruct:free',
    ollamaModel: 'mistral:7b',
    description: 'Mistral 7B',
  },
];

/**
 * Default fallback models for each provider
 */
export const FALLBACK_MODELS = {
  ollama: 'llama3.2:3b',
  openrouter: 'meta-llama/llama-3.2-3b-instruct:free',
};

/**
 * Map an OpenRouter model to its Ollama equivalent
 */
export function mapToOllamaModel(openrouterModel: string): string {
  // A local Ollama host only serves the models that are actually pulled. When
  // OLLAMA_DEFAULT_MODEL is set, honor it for every request — the static
  // OpenRouter→Ollama table can otherwise resolve to a model that isn't
  // installed (e.g. llama3.2:3b), causing 404s from Ollama.
  const envDefault = process.env.OLLAMA_DEFAULT_MODEL;
  if (envDefault) return envDefault;

  const mapping = MODEL_MAPPINGS.find((m) => m.openrouterModel === openrouterModel);
  return mapping?.ollamaModel || FALLBACK_MODELS.ollama;
}

/**
 * Map an Ollama model to its OpenRouter equivalent
 */
export function mapToOpenRouterModel(ollamaModel: string): string {
  const mapping = MODEL_MAPPINGS.find((m) => m.ollamaModel === ollamaModel);
  return mapping?.openrouterModel || FALLBACK_MODELS.openrouter;
}

/**
 * Get all available model mappings
 */
export function getAllModelMappings(): ModelMapping[] {
  return [...MODEL_MAPPINGS];
}

/**
 * Add a custom model mapping
 */
export function addModelMapping(mapping: ModelMapping): void {
  // Check if mapping already exists
  const existingIndex = MODEL_MAPPINGS.findIndex(
    (m) => m.openrouterModel === mapping.openrouterModel || m.ollamaModel === mapping.ollamaModel
  );

  if (existingIndex >= 0) {
    MODEL_MAPPINGS[existingIndex] = mapping;
  } else {
    MODEL_MAPPINGS.push(mapping);
  }
}
