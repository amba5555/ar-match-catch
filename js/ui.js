import { KEY_STAGES, DIFFICULTIES } from './questions.js';

const DIFF_DETAIL = {
  easy: 'ตกช้าตรงๆ · ตัวลวง 2 ตัว · ไม่มีบทลงโทษ · 1 ดวง',
  medium: 'ตกปานกลางแกว่ง · ตัวลวง 3 ตัว · รีเซ็ตคอมโบ · สูงสุด 3 ดวง',
  hard: 'ตกเร็วซิกแซก · ตัวลวง 5 ตัว · -3 วิ + รีเซ็ตคอมโบ · สูงสุด 5 ดวง',
};

export class UI {
  constructor() {
    this.el = {
      q: document.querySelector('#questionText'),
      score: document.querySelector('#scoreValue'),
      stamps: document.querySelector('#stampValue'),
      lives: document.querySelector('#livesValue'),
      time: document.querySelector('#timeValue'),
      startOverlay: document.querySelector('#startOverlay'),
      pauseOverlay: document.querySelector('#pauseOverlay'),
      settingsOverlay: document.querySelector('#settingsOverlay'),
      cameraStatus: document.querySelector('#cameraStatus'),
      subject: document.querySelector('#subjectSelect'),
      keyStage: document.querySelector('#keyStageSelect'),
      difficulty: document.querySelector('#difficultySelect'),
      difficultyDetail: document.querySelector('#difficultyDetail'),
      debug: document.querySelector('#debugToggle'),
      sound: document.querySelector('#soundToggle'),
      mirror: document.querySelector('#mirrorToggle'),
      landmark: document.querySelector('#landmarkToggle'),
      pauseTitle: document.querySelector('#pauseTitle'),
      pauseMessage: document.querySelector('#pauseMessage'),
    };
    this._last = { score: null, stamps: null, lives: null, timeLeft: null, state: null };
  }

  init() {
    this.el.difficulty.addEventListener('change', () => this._updateDiffDetail());
    this._updateDiffDetail();
  }

  _updateDiffDetail() {
    const val = this.el.difficulty.value;
    this.el.difficultyDetail.textContent = DIFF_DETAIL[val] || '';
  }

  setQuestion(q) {
    this.el.q.textContent = q?.text || 'เตรียมคำถาม...';
    const banner = document.querySelector('#questionBannerText');
    if (banner) banner.textContent = q?.text || 'ยกมือแล้วจับคำตอบที่ถูกต้อง';
  }

  setState(s) {
    if (s.score !== this._last.score) { this.el.score.textContent = s.score; this._last.score = s.score; }
    if (s.stamps !== this._last.stamps) { this.el.stamps.textContent = s.stamps; this._last.stamps = s.stamps; }
    if (s.lives !== this._last.lives) {
      this.el.lives.textContent = '❤️'.repeat(Math.max(0, s.lives)) || '💔';
      this._last.lives = s.lives;
    }
    const tl = Math.ceil(s.timeLeft);
    if (tl !== this._last.timeLeft) { this.el.time.textContent = tl; this._last.timeLeft = tl; }
    if (s.state !== this._last.state) {
      if (s.state === 'ended') {
        this.el.pauseTitle.textContent = 'จบเกม';
        this.el.pauseMessage.innerHTML =
          `<b>${s.score}</b> คะแนน · <b>${s.stamps || 1}</b> ดวง<br>` +
          `<small>${s.ratio || 50} คะแนน/ดวง | ขั้นต่ำ 1 สูงสุด ${s.maxStamps || 3} ดวง</small>`;
        this.show('pause');
      }
      this._last.state = s.state;
    }
  }

  setCameraStatus(t) { this.el.cameraStatus.textContent = t; }
  show(name) { this.el[`${name}Overlay`]?.classList.add('active'); }
  hide(name) { this.el[`${name}Overlay`]?.classList.remove('active'); }
}
