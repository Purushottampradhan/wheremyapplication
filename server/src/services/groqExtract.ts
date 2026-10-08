import Groq from 'groq-sdk';
import { env } from '../config/env.js';

export type ExtractedJob = {
  company?: string;
  roleTitle?: string;
  location?: string;
  salaryRange?: string;
  employmentType?: string;
  workplaceType?: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  companyDescription?: string;
  companyIndustry?: string;
  companySize?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  applicationDeadline?: string;
  jobDescription?: string;
  aiSummary?: string;
  tags?: string[];
};

function getClient(): Groq | null {
  if (!env.groqApiKey) return null;
  return new Groq({ apiKey: env.groqApiKey });
}

export function isGroqConfigured(): boolean {
  return Boolean(env.groqApiKey);
}

export async function extractJobFromPageText(input: {
  pageText: string;
  pageTitle?: string;
  jobUrl?: string;
  scraped?: Partial<ExtractedJob>;
}): Promise<ExtractedJob | null> {
  const client = getClient();
  if (!client) return null;

  const text = (input.pageText || '').slice(0, 28000);
  if (text.trim().length < 40) return null;

  const scrapedHint = JSON.stringify(input.scraped || {}, null, 0).slice(0, 2000);

  const prompt = `You are a job-application data extractor. Read the job page text and return ONLY valid JSON (no markdown) with these fields:
{
  "company": string,
  "roleTitle": string,
  "location": string,
  "salaryRange": string,
  "employmentType": string,
  "workplaceType": string,
  "experienceLevel": string,
  "requiredSkills": string[],
  "preferredSkills": string[],
  "responsibilities": string,
  "requirements": string,
  "benefits": string,
  "companyDescription": string,
  "companyIndustry": string,
  "companySize": string,
  "recruiterName": string,
  "recruiterEmail": string,
  "applicationDeadline": string,
  "jobDescription": string,
  "aiSummary": string,
  "tags": string[]
}

Rules:
- Fill every field you can infer; use "" or [] when unknown.
- employmentType examples: Full-time, Part-time, Contract, Internship
- workplaceType examples: Remote, Hybrid, On-site
- experienceLevel examples: Junior, Mid, Senior, Lead
- aiSummary: 2-3 sentences useful for future interview prep
- tags: 3-8 short tags (tech stack, domain, seniority)
- Prefer concrete skills from the JD
- Job URL: ${input.jobUrl || ''}
- Page title: ${input.pageTitle || ''}
- Already scraped (may be incomplete): ${scrapedHint}

PAGE TEXT:
${text}`;

  const completion = await client.chat.completions.create({
    model: env.groqModel,
    temperature: 0.1,
    max_tokens: 2500,
    messages: [
      {
        role: 'system',
        content:
          'Extract structured job application data. Respond with a single JSON object only.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ExtractedJob;
    return normalizeExtracted(parsed);
  } catch {
    return null;
  }
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => asString(x))
    .filter(Boolean)
    .slice(0, 40);
}

function normalizeExtracted(parsed: ExtractedJob): ExtractedJob {
  return {
    company: asString(parsed.company),
    roleTitle: asString(parsed.roleTitle),
    location: asString(parsed.location),
    salaryRange: asString(parsed.salaryRange),
    employmentType: asString(parsed.employmentType),
    workplaceType: asString(parsed.workplaceType),
    experienceLevel: asString(parsed.experienceLevel),
    requiredSkills: asStringArray(parsed.requiredSkills),
    preferredSkills: asStringArray(parsed.preferredSkills),
    responsibilities: asString(parsed.responsibilities).slice(0, 8000),
    requirements: asString(parsed.requirements).slice(0, 8000),
    benefits: asString(parsed.benefits).slice(0, 4000),
    companyDescription: asString(parsed.companyDescription).slice(0, 4000),
    companyIndustry: asString(parsed.companyIndustry),
    companySize: asString(parsed.companySize),
    recruiterName: asString(parsed.recruiterName),
    recruiterEmail: asString(parsed.recruiterEmail),
    applicationDeadline: asString(parsed.applicationDeadline),
    jobDescription: asString(parsed.jobDescription).slice(0, 20000),
    aiSummary: asString(parsed.aiSummary).slice(0, 2000),
    tags: asStringArray(parsed.tags).slice(0, 12),
  };
}

/** Prefer existing non-empty scraped values; fill gaps from AI. */
export function mergeScrapedWithAi<T extends Record<string, unknown>>(
  base: T,
  ai: ExtractedJob | null
): T & ExtractedJob {
  if (!ai) return { ...base, ...(base as unknown as ExtractedJob) };

  const out: Record<string, unknown> = { ...base };
  const fill = (key: keyof ExtractedJob) => {
    const current = out[key as string];
    const next = ai[key];
    const emptyArr = Array.isArray(current) && current.length === 0;
    const emptyStr = typeof current === 'string' && !current.trim();
    const missing = current == null || emptyStr || emptyArr;
    if (missing && next != null && next !== '' && !(Array.isArray(next) && next.length === 0)) {
      out[key as string] = next;
    }
  };

  (
    [
      'company',
      'roleTitle',
      'location',
      'salaryRange',
      'employmentType',
      'workplaceType',
      'experienceLevel',
      'requiredSkills',
      'preferredSkills',
      'responsibilities',
      'requirements',
      'benefits',
      'companyDescription',
      'companyIndustry',
      'companySize',
      'recruiterName',
      'recruiterEmail',
      'applicationDeadline',
      'jobDescription',
    ] as (keyof ExtractedJob)[]
  ).forEach(fill);

  // Always keep AI summary/tags when present
  if (ai.aiSummary) out.aiSummary = ai.aiSummary;
  if (ai.tags?.length) {
    const existing = Array.isArray(out.tags) ? (out.tags as string[]) : [];
    out.tags = [...new Set([...existing, ...ai.tags])].slice(0, 16);
  }

  return out as T & ExtractedJob;
}
