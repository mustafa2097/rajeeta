import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isSubscribed } from '../common/utils/subscription.util';

type SpecialtyRule = {
  keywords: string[];
  specialties: string[];
  weight: number;
};

const SPECIALTY_RULES: SpecialtyRule[] = [
  {
    keywords: [
      'قلب', 'صدر', 'خفقان', 'ضغط', 'chest', 'heart', 'cardiac',
      'تنفس', 'ضيق نفس',
    ],
    specialties: ['قلب وأوعية دموية'],
    weight: 12,
  },
  {
    keywords: [
      'طفل', 'اطفال', 'أطفال', 'رضيع', 'رضع', 'حمى', 'سعال اطفال',
      'child', 'pedia', 'baby',
    ],
    specialties: ['أطفال'],
    weight: 12,
  },
  {
    keywords: ['جلد', 'حكة', 'طفح', 'حساسية جلد', 'اكزيما', 'skin', 'dermat'],
    specialties: ['جلدية'],
    weight: 12,
  },
  {
    keywords: ['عظم', 'كسر', 'مفصل', 'ظهر', 'ركبة', 'bone', 'fracture', 'ortho'],
    specialties: ['عظام'],
    weight: 12,
  },
  {
    keywords: [
      'حمل', 'ولادة', 'نسا', 'دورة', 'حيض', 'gyn', 'obstet', 'pregnancy',
    ],
    specialties: ['نساء وتوليد'],
    weight: 12,
  },
  {
    keywords: [
      'انف', 'أنف', 'اذن', 'أذن', 'حنجرة', 'سمع', 'حلق', 'زكام',
      'ear', 'nose', 'throat',
    ],
    specialties: ['أنف وأذن وحنجرة'],
    weight: 12,
  },
  {
    keywords: ['سكري', 'غدد', 'سكر', 'غدة', 'diabetes', 'thyroid', 'وزن'],
    specialties: ['غدد صماء وسكري'],
    weight: 12,
  },
  {
    keywords: [
      'بطن', 'معدة', 'هضم', 'اسهال', 'إسهال', 'قيء', 'غثيان',
      'stomach', 'abdomen', 'باطن', 'حرقة',
    ],
    specialties: ['طب باطني'],
    weight: 10,
  },
  {
    keywords: ['صداع', 'دوخة', 'دوار', 'headache', 'dizzy', 'migraine'],
    specialties: ['طب باطني', 'أنف وأذن وحنجرة'],
    weight: 7,
  },
];

function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/أ|إ|آ|ء/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();
}

function specialtyMatchScore(
  doctorSpecialty: string,
  targetSpecialties: string[],
): number {
  const doc = normalizeArabic(doctorSpecialty);
  let best = 0;
  for (const target of targetSpecialties) {
    const t = normalizeArabic(target);
    if (doc === t) best = Math.max(best, 100);
    else if (doc.includes(t) || t.includes(doc)) best = Math.max(best, 88);
    else {
      const docParts = doc.split(/\s+/).filter(Boolean);
      const targetParts = t.split(/\s+/).filter(Boolean);
      for (const dp of docParts) {
        for (const tp of targetParts) {
          if (dp.length >= 3 && tp.length >= 3) {
            if (dp.includes(tp) || tp.includes(dp)) {
              best = Math.max(best, 65);
            }
          }
        }
      }
    }
  }
  return best;
}

function bestSymptomScoreForDoctor(
  doctorSpecialty: string,
  specialtyScores: Map<string, number>,
): number {
  let best = 0;
  for (const [specialty, score] of specialtyScores) {
    const match = specialtyMatchScore(doctorSpecialty, [specialty]);
    if (match >= 50) best = Math.max(best, score);
  }
  return best;
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  private scoreDiagnosis(diagnosis: string): Map<string, number> {
    const text = normalizeArabic(diagnosis);
    const scores = new Map<string, number>();

    for (const rule of SPECIALTY_RULES) {
      let hits = 0;
      for (const k of rule.keywords) {
        if (text.includes(normalizeArabic(k))) hits++;
      }
      if (hits === 0) continue;

      for (const specialty of rule.specialties) {
        const prev = scores.get(specialty) ?? 0;
        scores.set(specialty, prev + rule.weight * hits);
      }
    }

    return scores;
  }

  async suggestDoctors(diagnosis: string) {
    const trimmed = diagnosis.trim();
    const specialtyScores = this.scoreDiagnosis(trimmed);

    const rankedSpecialties = [...specialtyScores.entries()].sort(
      (a, b) => b[1] - a[1],
    );

    const suggestedSpecialty =
      rankedSpecialties[0]?.[0] ?? 'طب باطني';
    const confidence = rankedSpecialties[0]?.[1] ?? 0;
    const targetSpecialties =
      rankedSpecialties.length > 0
        ? rankedSpecialties.slice(0, 3).map(([s]) => s)
        : [suggestedSpecialty];

    const doctors = await this.prisma.doctorProfile.findMany({
      include: {
        availabilitySlots: { where: { isAvailable: true } },
        user: { select: { id: true, email: true, phone: true } },
      },
    });

    const now = new Date();

    const scored = doctors.map((d) => {
      const matchScore = specialtyMatchScore(d.specialty, targetSpecialties);
      const symptomScore = bestSymptomScoreForDoctor(
        d.specialty,
        specialtyScores,
      );
      const availabilityBonus = d.availabilitySlots.length > 0 ? 10 : 0;
      const ratingBonus = Math.round(d.rating * 5);
      const subscribed = isSubscribed(d, now);
      const subscriptionBonus = subscribed ? 15 : 0;

      const totalScore =
        matchScore * 1.5 +
        symptomScore * 1.2 +
        availabilityBonus +
        ratingBonus +
        subscriptionBonus;

      return {
        ...d,
        isSubscribed: subscribed,
        matchedSpecialty: suggestedSpecialty,
        matchScore,
        symptomScore,
        totalScore,
      };
    });

    const strong = scored
      .filter((d) => d.matchScore >= 55 || d.symptomScore >= 8)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 8);

    const noExactMatch =
      confidence > 0 && strong.every((d) => d.matchScore < 70);

    let results = strong;
    if (results.length === 0 && confidence === 0) {
      results = scored
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3);
    }

    const matchedSymptoms = rankedSpecialties
      .slice(0, 2)
      .map(([s]) => s)
      .join('، ');

    return {
      diagnosis: trimmed,
      suggestedSpecialty,
      confidence,
      noExactMatch,
      explanation:
        confidence > 0
          ? `بناءً على وصفك، الأنسب هو تخصص «${suggestedSpecialty}»${matchedSymptoms ? ` (مرتبط بـ: ${matchedSymptoms})` : ''}`
          : 'لم نتعرف على أعراض محددة — عرضنا أعلى الأطباء تقييماً. حاول وصف الأعراض بوضوح أكثر.',
      doctors: results,
    };
  }
}
