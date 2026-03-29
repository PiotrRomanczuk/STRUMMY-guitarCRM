/**
 * AI Provider Factory
 *
 * Central factory for creating and managing AI providers.
 * Supports easy switching between OpenRouter, local models, and future providers.
 */

import type { AIProvider } from './types';
import { createOpenRouterProvider } from './providers/openrouter';
import { createOllamaProvider } from './providers/ollama';
import { logger } from '@/lib/logger';

/**
 * Whether to use the Vercel AI SDK adapter for OpenRouter.
 * Set AI_USE_VERCEL_SDK=false to fall back to the custom fetch-based provider.
 */
const useVercelSDK = process.env.AI_USE_VERCEL_SDK !== 'false';

export type ProviderType = 'openrouter' | 'ollama' | 'auto';

/**
 * Configuration for the AI provider system
 */
export interface ProviderFactoryConfig {
  /**
   * Which provider to use
   * - 'openrouter': Use OpenRouter.ai API
   * - 'ollama': Use local Ollama instance
   * - 'auto': Try Ollama first, fallback to OpenRouter
   */
  provider: ProviderType;

  /**
   * Prefer local models when available
   * Only used when provider is 'auto'
   */
  preferLocal?: boolean;
}

// Functional implementation

/**
 * Creates the default factory configuration
 */
const createDefaultFactoryConfig = (): ProviderFactoryConfig => {
  const providerType = (process.env.AI_PROVIDER?.toLowerCase() || 'auto') as ProviderType;
  const preferLocal = process.env.AI_PREFER_LOCAL === 'true';

  return {
    provider: providerType,
    preferLocal,
  };
};

// Module-level state for singleton pattern in functional approach
let factoryConfig: ProviderFactoryConfig = createDefaultFactoryConfig();
let cachedProvider: AIProvider | null = null;

/**
 * Updates factory configuration
 */
const updateFactoryConfig = (config: Partial<ProviderFactoryConfig>): void => {
  factoryConfig = { ...factoryConfig, ...config };
  cachedProvider = null; // Clear cache when config changes
};

/**
 * Creates the appropriate OpenRouter provider (Vercel SDK or legacy fetch).
 * Uses dynamic import for the Vercel adapter to avoid TransformStream issues in test environments.
 */
const createOpenRouter = async (): Promise<AIProvider> => {
  if (useVercelSDK) {
    try {
      const { createVercelAIProvider } = await import('./providers/vercel-ai-adapter');
      return createVercelAIProvider();
    } catch {
      logger.warn(
        '[AIProviderFactory] Vercel AI SDK unavailable, falling back to fetch-based provider'
      );
    }
  }
  return createOpenRouterProvider();
};

/**
 * Automatically selects the best available provider
 */
const autoSelectProvider = async (): Promise<AIProvider> => {
  const ollama = createOllamaProvider();

  // If prefer local, try Ollama first
  if (factoryConfig.preferLocal !== false) {
    const ollamaAvailable = await ollama.isAvailable();
    if (ollamaAvailable) {
      return ollama;
    }
  }

  // Try OpenRouter
  const openrouter = await createOpenRouter();
  const openrouterAvailable = await openrouter.isAvailable();
  if (openrouterAvailable) {
    return openrouter;
  }

  // If prefer local is false, try Ollama as fallback
  if (factoryConfig.preferLocal === false) {
    const ollamaAvailable = await ollama.isAvailable();
    if (ollamaAvailable) {
      return ollama;
    }
  }

  // Default to OpenRouter even if not configured (will show error to user)
  logger.warn('[AIProviderFactory] No providers available, defaulting to OpenRouter');
  return openrouter;
};

/**
 * Gets the current provider based on configuration
 */
const getProvider = async (): Promise<AIProvider> => {
  // Return cached provider if available
  if (cachedProvider) {
    return cachedProvider;
  }

  let provider: AIProvider;

  switch (factoryConfig.provider) {
    case 'ollama':
      provider = createOllamaProvider();
      break;

    case 'openrouter':
      provider = await createOpenRouter();
      break;

    case 'auto':
    default:
      provider = await autoSelectProvider();
      break;
  }

  // Cache the provider
  cachedProvider = provider;
  return provider;
};

/**
 * Gets list of all available providers
 */
const getAvailableProviders = async (): Promise<Array<{ name: string; available: boolean }>> => {
  const ollama = createOllamaProvider();
  const openrouter = createOpenRouterProvider();

  const [ollamaAvailable, openrouterAvailable] = await Promise.all([
    ollama.isAvailable(),
    openrouter.isAvailable(),
  ]);

  return [
    { name: 'Ollama (Local)', available: ollamaAvailable },
    { name: 'OpenRouter (Cloud)', available: openrouterAvailable },
  ];
};

/**
 * Clears cached provider (forces re-selection on next getProvider call)
 */
const clearProviderCache = (): void => {
  cachedProvider = null;
};

/**
 * Gets the current factory configuration
 */
const getFactoryConfig = (): ProviderFactoryConfig => {
  return { ...factoryConfig };
};

/**
 * Factory object with all provider factory functions
 */
export const createProviderFactory = () => {
  return {
    updateConfig: updateFactoryConfig,
    getProvider,
    getAvailableProviders,
    clearCache: clearProviderCache,
    getConfig: getFactoryConfig,
  };
};

// Backward compatibility - Class wrapper around functional implementation
export class AIProviderFactory {
  private static instance: AIProviderFactory;
  private factory = createProviderFactory();

  private constructor() {
    // Initialization is handled by the functional implementation
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  /**
   * Update factory configuration
   */
  updateConfig(config: Partial<ProviderFactoryConfig>): void {
    this.factory.updateConfig(config);
  }

  /**
   * Get the current provider based on configuration
   */
  async getProvider(): Promise<AIProvider> {
    return this.factory.getProvider();
  }

  /**
   * Get list of all available providers
   */
  async getAvailableProviders(): Promise<Array<{ name: string; available: boolean }>> {
    return this.factory.getAvailableProviders();
  }

  /**
   * Clear cached provider (forces re-selection on next getProvider call)
   */
  clearCache(): void {
    this.factory.clearCache();
  }
}

/**
 * Convenience function to get the current AI provider
 */
export async function getAIProvider(): Promise<AIProvider> {
  return getProvider();
}

/**
 * Get a snapshot of the current provider factory configuration for monitoring
 */
export function getFactoryConfigSnapshot() {
  return {
    configuredProvider: factoryConfig.provider,
    preferLocal: factoryConfig.preferLocal ?? true,
    providers: [] as Array<{ name: string; available: boolean }>,
  };
}
