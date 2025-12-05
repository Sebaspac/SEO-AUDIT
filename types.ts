export interface AuditRequest {
  url: string;
  industry?: string;
  goal?: string;
}

export type Priority = 'Hoch' | 'Mittel' | 'Niedrig';
export type Status = 'Gut' | 'Warnung' | 'Kritisch';

export interface AuditChecklistItem {
  task: string;
  description: string;
  priority: Priority;
  difficulty: 'Leicht' | 'Mittel' | 'Schwer';
}

export interface AuditSection {
  id: string;
  title: string; // e.g. "Technisches SEO"
  score: number; // 0-100
  status: Status;
  findings: string; // Summary of what was found
  checklist: AuditChecklistItem[];
}

export interface AuditData {
  domain: string;
  overallScore: number;
  executiveSummary: string[];
  sections: AuditSection[];
}

export interface AuditResponse {
  data: AuditData;
  screenshotUrl: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}