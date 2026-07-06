import { shuffle } from './utils.js';

export const SUBJECTS = [
  { id: 'all', name: 'ทุกวิชา', file: null },
  { id: 'math-quick', name: 'คณิตคิดเร็ว', file: 'math-quick.json' },
  { id: 'en-th-vocab', name: 'คำศัพท์ อังกฤษ-ไทย', file: 'en-th-vocab.json' },
  { id: 'science', name: 'วิทยาศาสตร์', file: 'science.json' },
  { id: 'thai-language', name: 'ภาษาไทย', file: 'thai-language.json' },
];

export const KEY_STAGES = [
  { id: 'primary', name: 'ประถมปลาย (ป.4-6)', grades: ['4','5','6'], label: 'ป.4-6' },
  { id: 'secondary', name: 'มัธยมต้น (ม.1-3)', grades: ['7','8','9'], label: 'ม.1-3' },
];

export const DIFFICULTIES = [
  {
    id: 'easy', name: 'ง่าย', maxStamps: 1,
    vyMul: 0.60, swayAmp: 0.08, wobbleAmp: 0.10,
    distractorCount: 2, timePenalty: 0, comboReset: false,
    spawnRate: 0.85, maxObjects: 4,
  },
  {
    id: 'medium', name: 'ปานกลาง', maxStamps: 3,
    vyMul: 1.00, swayAmp: 0.35, wobbleAmp: 0.50,
    distractorCount: 3, timePenalty: 0, comboReset: true,
    spawnRate: 0.65, maxObjects: 6,
  },
  {
    id: 'hard', name: 'ยาก', maxStamps: 5,
    vyMul: 1.50, swayAmp: 0.90, wobbleAmp: 1.20,
    distractorCount: 5, timePenalty: 3, comboReset: true,
    spawnRate: 0.45, maxObjects: 8,
  },
];

export const SCORE_TO_STAMP_RATIO = 50;
export const BASE_SCORE = 10;

export async function loadBank(fileName) {
  const local = localStorage.getItem(`bank:${fileName}`);
  if (local) return JSON.parse(local);
  const res = await fetch(`/questions/${fileName}`);
  if (!res.ok) throw new Error('โหลดชุดคำถามไม่ได้: ' + fileName);
  return res.json();
}

function questionMeta(q, i) {
  return { ...q, id: q.id || `q_${i + 1}`, grade: String(q.grade || '1') };
}

export class QuestionManager {
  constructor() {
    this.allQuestions = [];
    this.queue = [];
    this.current = null;
    this._keyStage = null;
    this._difficulty = null;
  }

  async load(subjectId, keyStageId, diffId) {
    const sub = SUBJECTS.find(s => s.id === subjectId);
    const ks = KEY_STAGES.find(k => k.id === keyStageId);
    const diff = DIFFICULTIES.find(d => d.id === diffId);
    if (!ks || !diff) throw new Error('การตั้งค่าไม่ถูกต้อง');
    this._keyStage = ks;
    this._difficulty = diff;

    let questions = [];
    if (sub && sub.file) {
      try {
        const bank = await loadBank(sub.file);
        questions = (bank.questions || []).map(questionMeta);
      } catch (e) { questions = []; }
    } else {
      const files = ['math-quick.json','en-th-vocab.json','science.json','thai-language.json'];
      for (const file of files) {
        try {
          const bank = await loadBank(file);
          questions.push(...(bank.questions || []).map(questionMeta));
        } catch (e) { /* skip */ }
      }
    }

    if (ks.grades.length) {
      const filtered = questions.filter(q => ks.grades.includes(String(q.grade)));
      if (filtered.length >= 4) questions = filtered;
    }

    this.allQuestions = questions.map(q => {
      const wrongs = (q.options || []).filter(o => String(o) !== String(q.answer));
      const distractorN = Math.min(diff.distractorCount, wrongs.length);
      const picked = [q.answer, ...shuffle(wrongs).slice(0, distractorN)];
      return { ...q, options: shuffle(picked) };
    });

    this.queue = shuffle([...this.allQuestions]);
    return this.allQuestions.length;
  }

  next() {
    if (!this.queue.length) this.queue = shuffle([...this.allQuestions]);
    this.current = this.queue.shift();
    return this.current;
  }

  isCorrect(value) { return String(value) === String(this.current?.answer); }

  options() { return shuffle(this.current?.options || []); }

  get difficulty() { return this._difficulty; }
  get keyStage() { return this._keyStage; }
}
