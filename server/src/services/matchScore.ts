import Groq from 'groq-sdk';
import { env } from '../config/env.js';

export type MatchResult = {
  score: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
};

function getClient(): Groq | null {
  if (!env.groqApiKey) return null;
  return new Groq({ apiKey: env.groqApiKey });
}

export async function matchResumeToJd(input: {
  resumeText: string;
  skills: string[];
  experienceYears: number;
  preferredRoles: string[];
  jobDescription: string;
  roleTitle: string;
  company: string;
  requiredSkills: string[];
}): Promise<MatchResult | null> {
  const client = getClient();
  if (!client) return null;

  const resume = (input.resumeText || '').slice(0, 12000);
  const jd = (
    input.jobDescription ||
    [input.roleTitle, input.company, ...(input.requiredSkills || [])].join('\n')
  ).slice(0, 12000);

  if (resume.trim().length < 40 && !(input.skills || []).length) {
    return null;
  }

  const prompt = `Compare this candidate profile/resume to the job description.
Return ONLY JSON:
{
  "score": number 0-100,
  "summary": string,
  "matchedSkills": string[],
  "missingSkills": string[],
  "strengths": string[],
  "gaps": string[],
  "suggestions": string[]
}

Candidate skills: ${(input.skills || []).join(', ')}
Experience years: ${input.experienceYears}
Preferred roles: ${(input.preferredRoles || []).join(', ')}
Target role: ${input.roleTitle} at ${input.company}
JD required skills hint: ${(input.requiredSkills || []).join(', ')}

RESUME:
${resume || '(skills/profile only)'}

JOB DESCRIPTION:
${jd}`;

  const completion = await client.chat.completions.create({
    model: env.groqModel,
    temperature: 0.2,
    max_tokens: 1800,
    messages: [
      {
        role: 'system',
        content: 'You score resume-to-JD fit. Respond with one JSON object only.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as MatchResult;
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    return {
      score,
      summary: String(parsed.summary || '').slice(0, 1500),
      matchedSkills: Array.isArray(parsed.matchedSkills)
        ? parsed.matchedSkills.map(String).slice(0, 30)
        : [],
      missingSkills: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills.map(String).slice(0, 30)
        : [],
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.map(String).slice(0, 10)
        : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 10) : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map(String).slice(0, 10)
        : [],
    };
  } catch {
    return null;
  }
}
