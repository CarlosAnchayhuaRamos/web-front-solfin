// src/domain/entities/CompanyInfo.ts
// Domain entity representing core company branding and value proposition

export interface ValueProposition {
  icon: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  valuePropositions: ValueProposition[];
  processSteps: ProcessStep[];
  stats: { value: string; label: string }[];
}
