// 모든 게임이 공유하는 코드: 상단 바, 효과음(WebAudio로 직접 합성), 고정 간격 루프
const Snd = {
  ctx: null, on: false,
  tone(f, d = 0.1, type = 'square', v = 0.1, to) {
    if (!this.on) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
  },
  // 키보드 누르는 소리 (매번 살짝 다름)
  click() {
    if (!this.on) return;
    const c = this.ctx, t = c.currentTime, len = 0.04;
    const buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1200; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = 0.5 + Math.random() * 0.25;
    src.connect(f).connect(g).connect(c.destination); src.start(t);
    this.tone(220 + Math.random() * 40, 0.06, 'sine', 0.25, 90);
  }
};

function mountBar(title, hideSpeed, en) {
  const bar = document.createElement('div');
  bar.id = 'bar';
  bar.innerHTML = '<a href="../index.html">' + (en ? '← Portal' : '← 포털') + '</a><b>' + title + '</b><span class="sp"></span>' +
    (hideSpeed ? '' : '<label>' + (en ? 'Speed' : '속도') + ' <input id="spd" type="range" min="1" max="16" value="4"></label>') +
    '<button id="snd">' + (en ? '🔇 Sound off' : '🔇 효과음 꺼짐') + '</button>';
  document.body.prepend(bar);
  bar.querySelector('#snd').onclick = e => {
    Snd.ctx = Snd.ctx || new (window.AudioContext || window.webkitAudioContext)();
    Snd.ctx.resume(); Snd.on = !Snd.on;
    e.target.textContent = Snd.on ? (en ? '🔊 Sound on' : '🔊 효과음 켜짐') : (en ? '🔇 Sound off' : '🔇 효과음 꺼짐');
  };
  const spd = bar.querySelector('#spd');
  return { mult: () => (spd ? spd.value / 4 : 1) };
}

// step()을 hz 속도로 고정 간격 호출, draw()는 매 프레임
function loop(step, draw, hzFn) {
  let last = performance.now(), acc = 0;
  (function f(t) {
    acc += Math.min(t - last, 250); last = t;
    const iv = 1000 / hzFn();
    while (acc >= iv) { step(); acc -= iv; }
    draw(); requestAnimationFrame(f);
  })(last);
}
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
