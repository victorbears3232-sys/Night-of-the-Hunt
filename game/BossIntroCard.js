// BossIntroCard.js — the cinematic boss name card (gothic serif) that fades in
// during a boss intro. Extracted from HuntGame to keep the engine file lean.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function drawBossIntroCard(game, ctx) {
  const b = game.boss;
  if (!b || game.state !== 'bossIntro') return;
  const p = clamp(b.introT / b.introDur, 0, 1);
  let a = 0;
  if (p < 0.22) a = 0;
  else if (p < 0.40) a = (p - 0.22) / 0.18;
  else if (p < 0.82) a = 1;
  else a = 1 - (p - 0.82) / 0.18;
  if (a <= 0.01) return;
  const cx = game.viewW / 2, cy = game.viewH * 0.30;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(200,160,90,0.7)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(cx - 170, cy - 46); ctx.lineTo(cx - 22, cy - 46); ctx.moveTo(cx + 22, cy - 46); ctx.lineTo(cx + 170, cy - 46); ctx.stroke();
  ctx.fillStyle = 'rgba(200,160,90,0.85)'; ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.lineTo(cx + 6, cy - 46); ctx.lineTo(cx, cy - 42); ctx.lineTo(cx - 6, cy - 46); ctx.closePath(); ctx.fill();
  try { ctx.letterSpacing = '7px'; } catch (e) {}
  ctx.font = '600 44px ui-serif, Georgia, serif';
  ctx.shadowColor = 'rgba(0,0,0,0.97)'; ctx.shadowBlur = 18;
  ctx.fillStyle = '#ece0c4';
  ctx.fillText(b.name.toUpperCase(), cx, cy);
  ctx.shadowBlur = 0;
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  ctx.font = '300 13px ui-serif, Georgia, serif';
  try { ctx.letterSpacing = '5px'; } catch (e) {}
  ctx.fillStyle = 'rgba(200,180,140,0.8)';
  ctx.fillText((b.introMsg || '').toUpperCase(), cx, cy + 36);
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  ctx.strokeStyle = 'rgba(200,160,90,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 60, cy + 56); ctx.lineTo(cx + 60, cy + 56); ctx.stroke();

  // ---- Boss dialogue: 1–3 short lines spoken before the fight begins ----
  // Each line fades in/out across its own slice of the intro, so a boss says
  // one brief, memorable thing tied to their past and the Night of the Hunt —
  // never a speech. Lines are stored on the boss as `dialogue: string[]`.
  const lines = b.dialogue;
  if (lines && lines.length) {
    const n = lines.length;
    // leave a beat of silence at the start (after the name lands) and end
    const start = 0.22, end = 0.95;
    const span = end - start;
    const seg = span / n;
    const pp = clamp((p - start) / span, 0, 1);
    const li = Math.min(n - 1, Math.floor(pp / seg));
    const lp = (p - (start + li * seg)) / seg;       // 0..1 within this line
    let la = 0;
    if (lp < 0.10) la = lp / 0.10;
    else if (lp < 0.88) la = 1;
    else la = 1 - (lp - 0.88) / 0.12;
    if (la > 0.01) {
      const ly = cy + 92;
      ctx.globalAlpha = a * la;
      ctx.font = 'italic 16px ui-serif, Georgia, serif';
      ctx.fillStyle = 'rgba(220,200,170,0.92)';
      ctx.shadowColor = 'rgba(0,0,0,0.97)'; ctx.shadowBlur = 10;
      ctx.fillText('“' + lines[li] + '”', cx, ly);
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}