/**
 * AI Texture Generation Service
 *
 * Phase 3: Generate terrain textures using AI image generation APIs
 *
 * Supports:
 * - OpenAI DALL-E 3 (requires API key)
 * - Demo mode with pre-generated textures (no API key needed)
 *
 * Usage:
 * ```
 * const service = getAITextureService();
 * const texture = await service.generateTexture({
 *   prompt: 'lush green grass meadow with wildflowers',
 *   style: 'photorealistic',
 *   size: 512,
 * });
 * ```
 */

export interface TextureGenerationOptions {
  /** Description of desired texture (e.g., "grassy meadow with wildflowers") */
  prompt: string;
  /** Visual style: photorealistic, stylized, cartoon */
  style?: 'photorealistic' | 'stylized' | 'cartoon';
  /** Texture size in pixels (256, 512, 1024) */
  size?: 256 | 512 | 1024;
  /** Terrain type hint for better results */
  terrainType?: 'grass' | 'concrete' | 'dirt' | 'gravel' | 'sand';
}

export interface GeneratedTexture {
  /** Base64 encoded image data or URL */
  imageUrl: string;
  /** Whether this is a generated texture or fallback */
  isGenerated: boolean;
  /** The prompt used to generate */
  prompt: string;
  /** Generation timestamp */
  timestamp: Date;
  /** Provider used (openai, demo) */
  provider: 'openai' | 'demo';
}

export interface AITextureServiceConfig {
  /** OpenAI API key (optional - uses demo mode if not provided) */
  openaiApiKey?: string;
  /** Enable demo mode with pre-generated textures */
  demoMode?: boolean;
}

// Pre-generated demo textures (base64 placeholders - these would be actual textures)
const DEMO_TEXTURES: Record<string, string> = {
  grass: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGFkZTgwIi8+PHBhdGggZD0iTTAgMjU2cTEyOC02NCAxMjgtMTI4dDEyOCAxMjggMTI4LTEyOCAxMjggMTI4IiBzdHJva2U9IiMyMmM1NWUiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==',
  concrete: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOWNhM2FmIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgZmlsbD0iI2E4YjNiZiIvPjxyZWN0IHg9IjI2MiIgeT0iMTAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjOTRhMGFjIi8+PC9zdmc+',
  dirt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOTI3MjRlIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIzMCIgZmlsbD0iIzdhNWEzYSIvPjxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iNDAiIGZpbGw9IiM4YjZhNGEiLz48L3N2Zz4=',
  gravel: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNzg3MTZjIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMjAiIGZpbGw9IiM2YjY0NWYiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSI4MCIgcj0iMjUiIGZpbGw9IiM4NTdlNzkiLz48L3N2Zz4=',
  sand: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmNkMzRkIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI1IiBmaWxsPSIjZjViZDFmIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI0IiBmaWxsPSIjZjVjYzNmIi8+PC9zdmc+',
};

// Texture cache to avoid regenerating
const textureCache = new Map<string, GeneratedTexture>();

class AITextureService {
  private config: AITextureServiceConfig;

  constructor(config: AITextureServiceConfig = {}) {
    this.config = {
      demoMode: !config.openaiApiKey, // Auto-enable demo mode if no API key
      ...config,
    };
  }

  /**
   * Generate a terrain texture using AI
   */
  async generateTexture(options: TextureGenerationOptions): Promise<GeneratedTexture> {
    const cacheKey = this.getCacheKey(options);

    // Check cache first
    if (textureCache.has(cacheKey)) {
      console.log('[AITextureService] Returning cached texture');
      return textureCache.get(cacheKey)!;
    }

    // Use demo mode or actual API
    const texture = this.config.demoMode || !this.config.openaiApiKey
      ? await this.generateDemoTexture(options)
      : await this.generateOpenAITexture(options);

    // Cache the result
    textureCache.set(cacheKey, texture);

    return texture;
  }

  /**
   * Generate texture using OpenAI DALL-E 3
   */
  private async generateOpenAITexture(options: TextureGenerationOptions): Promise<GeneratedTexture> {
    const { prompt, style = 'photorealistic', size = 512 } = options;

    // Build optimized prompt for tileable terrain texture
    const enhancedPrompt = this.buildTexturePrompt(prompt, style);

    console.log('[AITextureService] Generating with OpenAI:', enhancedPrompt);

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: size === 256 ? '1024x1024' : size === 512 ? '1024x1024' : '1024x1024', // DALL-E 3 only supports 1024
          quality: 'standard',
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const imageUrl = data.data[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      return {
        imageUrl,
        isGenerated: true,
        prompt: enhancedPrompt,
        timestamp: new Date(),
        provider: 'openai',
      };
    } catch (error) {
      console.error('[AITextureService] OpenAI generation failed:', error);
      // Fall back to demo texture
      return this.generateDemoTexture(options);
    }
  }

  /**
   * Generate demo texture (no API key required)
   */
  private async generateDemoTexture(options: TextureGenerationOptions): Promise<GeneratedTexture> {
    const { prompt, terrainType = 'grass' } = options;

    console.log('[AITextureService] Using demo texture for:', terrainType);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get appropriate demo texture
    const imageUrl = DEMO_TEXTURES[terrainType] || DEMO_TEXTURES.grass;

    return {
      imageUrl,
      isGenerated: false,
      prompt,
      timestamp: new Date(),
      provider: 'demo',
    };
  }

  /**
   * Build an optimized prompt for tileable terrain texture
   */
  private buildTexturePrompt(userPrompt: string, style: string): string {
    const styleModifiers: Record<string, string> = {
      photorealistic: 'photorealistic, high detail, 8k texture',
      stylized: 'stylized, painterly, artistic, game art style',
      cartoon: 'cartoon style, cel shaded, vibrant colors, flat shading',
    };

    return `Seamless tileable ground texture, ${userPrompt}, ${styleModifiers[style]}, top-down view, uniform lighting, no shadows, suitable for 3D terrain mapping, seamlessly tileable pattern`;
  }

  /**
   * Generate cache key from options
   */
  private getCacheKey(options: TextureGenerationOptions): string {
    return `${options.prompt}-${options.style || 'photorealistic'}-${options.size || 512}-${options.terrainType || 'grass'}`;
  }

  /**
   * Clear texture cache
   */
  clearCache(): void {
    textureCache.clear();
  }

  /**
   * Set API key (allows runtime configuration)
   */
  setApiKey(apiKey: string): void {
    this.config.openaiApiKey = apiKey;
    this.config.demoMode = !apiKey;
  }

  /**
   * Check if using demo mode
   */
  isDemoMode(): boolean {
    return this.config.demoMode || !this.config.openaiApiKey;
  }
}

// Singleton instance
let serviceInstance: AITextureService | null = null;

/**
 * Get the AI texture service instance
 */
export function getAITextureService(config?: AITextureServiceConfig): AITextureService {
  if (!serviceInstance) {
    serviceInstance = new AITextureService(config);
  } else if (config?.openaiApiKey) {
    serviceInstance.setApiKey(config.openaiApiKey);
  }
  return serviceInstance;
}

/**
 * Generate a texture with a simple API
 */
export async function generateTerrainTexture(
  prompt: string,
  terrainType: 'grass' | 'concrete' | 'dirt' | 'gravel' | 'sand' = 'grass'
): Promise<GeneratedTexture> {
  const service = getAITextureService();
  return service.generateTexture({ prompt, terrainType });
}
