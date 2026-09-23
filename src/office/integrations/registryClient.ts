import type {
  IntegrationAuthType,
  IntegrationKind,
  IntegrationRecord,
  IntegrationTemplate
} from '../shared/integrations';
import { INTEGRATION_TEMPLATES } from '../shared/integrations';

export type {
  IntegrationAuthType,
  IntegrationKind,
  IntegrationRecord,
  IntegrationTemplate
};

export interface IntegrationRecordView extends IntegrationRecord {
  hasSecret: boolean;
}

export interface TestResult {
  ok: boolean;
  status?: number;
  message?: string;
  error?: string;
  durationMs?: number;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export const integrationsClient = {
  async list(): Promise<IntegrationRecordView[]> {
    try {
      if (typeof window !== 'undefined' && (window as any).cth?.integrations?.list) {
        return await (window as any).cth.integrations.list();
      }
    } catch {}
    return [];
  },
  async listTemplates(): Promise<IntegrationTemplate[]> {
    return INTEGRATION_TEMPLATES;
  },
  async save(record: IntegrationRecord, secret?: string): Promise<{ ok: boolean; error?: string }> {
    try {
      if (typeof window !== 'undefined' && (window as any).cth?.integrations?.save) {
        return await (window as any).cth.integrations.save(record, secret);
      }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to save' };
    }
    return { ok: true };
  },
  async remove(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      if (typeof window !== 'undefined' && (window as any).cth?.integrations?.remove) {
        return await (window as any).cth.integrations.remove(id);
      }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to remove' };
    }
    return { ok: true };
  },
  async test(id: string): Promise<TestResult> {
    try {
      if (typeof window !== 'undefined' && (window as any).cth?.integrations?.test) {
        return await (window as any).cth.integrations.test(id);
      }
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Test failed' };
    }
    return { ok: true, message: 'Connected' };
  }
};
