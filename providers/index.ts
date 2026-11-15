export * from './types';

export interface ProviderInterface {
  id: string;
  testKey(apiKey: string, model: string): Promise<{ success: boolean; message: string; latencyMs?: number }>;
}
