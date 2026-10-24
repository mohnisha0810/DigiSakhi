// SafeSphere Backend Adapter Factory & Singleton Export

import { BackendAdapter } from './types';
import { SupabaseBackendAdapter } from './supabaseAdapter';
import { LocalDevelopmentAdapter } from './localAdapter';
import { supabase, isCloudSupabaseConfigured } from '../supabase';

export * from './types';

export const backendMode: 'supabase_cloud' | 'local_dev_adapter' =
  isCloudSupabaseConfigured && supabase ? 'supabase_cloud' : 'local_dev_adapter';

export const backendService: BackendAdapter =
  isCloudSupabaseConfigured && supabase
    ? new SupabaseBackendAdapter(supabase as any)
    : new LocalDevelopmentAdapter();

export const isCloudMode = (): boolean => backendService.isCloud;
