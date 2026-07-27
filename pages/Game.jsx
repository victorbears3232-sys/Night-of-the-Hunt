import React, { useEffect, useRef, useState, useCallback } from 'react';
import HuntGame from '@/game/HuntGame';
import '@/game/HuntGamePatches';  // gameplay balance / QoL overrides (side-effect import)
import NPCDialog from '@/components/NPCDialog';
import Journal from '@/components/Journal';
import Shop from '@/components/Shop';
import MiniMap from '@/components/MiniMap';
import EndCredits from '@/components/EndCredits';
import Inventory from '@/components/Inventory';
import LanternRest from '@/components/LanternRest';
import Workshop from '@/components/Workshop';
import PauseMenu from '@/components/PauseMenu';
import AchievementToast from '@/components/AchievementToast';
import EpicBanner from '@/components/EpicBanner';
import OutfitShop from '@/components/OutfitShop';
import SoulReward from '@/components/SoulReward';
import CharmReward from '@/components/CharmReward';
import KeyReward from '@/components/KeyReward';
import UpgradeNotice from '@/components/UpgradeNotice';
import LevelUpNotice from '@/components/LevelUpNotice';
import LanternRestWarning from '@/components/LanternRestWarning';
import LeaderboardMenu from '@/components/LeaderboardMenu';
import SanctuaryMapTable from '@/components/SanctuaryMapTable';
import MapFragmentDiscovery from '@/components/MapFragmentDiscovery';
import { getCharm } from '@/game/Charms';
import { syncMyScore, syncSpeedrun, syncDeathRun, recordLocalDeathRun } from '@/game/Leaderboard';
import { hasSave, hasCompleted, saveIsNgPlus } from '@/game/SaveSystem';

const STATS = [
  { key: 'vit', name: 'Vitality', desc: 'Max health', color: '#c0484a' },
  { key: 'end', name: 'Endurance', desc: 'Max stamina', color: '#6a9a5a' },
  { key: 'str', name: 'Strength', desc: 'Weapon damage', color: '#c08a4a' },
  { key: 'skl', name: 'Skill', desc: 'Visceral & combo damage', color: '#6a7ac0' },
];

export default function Game() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const toastRef = useRef(null);
  const bossFadeTimer = useRef(null);
  const [hud, setHud] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro | playing | levelup | dead | victory | bossIntro
  const [msg, setMsg] = useState(null);
  const [bossInfo, setBossInfo] = useState(null);
  const [lore, setLore] = useState(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [started, setStarted] = useState(false);
  const [victoryName, setVictoryName] = useState('The Nightmare');
  const [mapOpen, setMapOpen] = useState(false);
  const [mapState, setMapState] = useState(null);
  const [npcDialog, setNpcDialog] = useState(null);
  const [quests, setQuests] = useState([]);
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [shop, setShop] = useState(null);
  const [showCredits, setShowCredits] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [lanternRest, setLanternRest] = useState(null);
  const [workshopOpen, setWorkshopOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [areaTitle, setAreaTitle] = useState(null);
  const [transition, setTransition] = useState(null);
  const [epicMsg, setEpicMsg] = useState(null);
  const [outfitShop, setOutfitShop] = useState(null);
  const [soulReward, setSoulReward] = useState(null);
  const [charmReward, setCharmReward] = useState(null);
  const [upgradeNotice, setUpgradeNotice] = useState(null);
  const [levelUpNotice, setLevelUpNotice] = useState(null);
  const [restWarning, setRestWarning] = useState(null);
  const [hasSaveFile, setHasSaveFile] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [ngPlusSave, setNgPlusSave] = useState(false);
  const [showLeaderboards, setShowLeaderboards] = useState(false);
  const [mapTableOpen, setMapTableOpen] = useState(false);
  const [fragmentDiscovery, setFragmentDiscovery] = useState(null);
  const [tutorialText, setTutorialText] = useState(null);
  const [tutorialTip, setTutorialTip] = useState(null);
  const [tutorialShow, setTutorialShow] = useState(false);
  const [deathTip, setDeathTip] = useState(false);
  const [keyReward, setKeyReward] = useState(null);

  useEffect(() => { setHasSaveFile(hasSave()); setGameCompleted(hasCompleted()); setNgPlusSave(saveIsNgPlus()); }, []);

  const syncScore = useCallback(() => {
    const g = gameRef.current;
    if (!g || !g.achievements) return;
    syncMyScore(Array.from(g.achievements.earned));
  }, []);

  useEffect(() => {
    const game = new HuntGame(canvasRef.current, {
      onHud: setHud,
      onMessage: (text, dur) => setMsg({ text, id: Date.now() }),
      onState: (s) => { setPhase(s); if (s === 'dead') { if (bossFadeTimer.current) { clearTimeout(bossFadeTimer.current); bossFadeTimer.current = null; } setBossInfo(null); } },
      onBossIntro: (name) => { if (bossFadeTimer.current) { clearTimeout(bossFadeTimer.current); bossFadeTimer.current = null; } setBossInfo({ name: name === 'Father Gascoigne' ? 'Father Lucian Veyr' : name, hp: 1, max: 1, intro: true, fadingOut: false }); },
      onBossHp: (hp, max) => setBossInfo((b) => b ? { ...b, hp, max, intro: false, fadingOut: false } : { name: 'The Drowned Vicar', hp, max, intro: false, fadingOut: false }),
      onLevelUp: setShowLevelUp,
      onLore: (title, text) => setLore({ title, text }),
      onBossEnd: () => { setBossInfo((b) => b ? { ...b, fadingOut: true } : null); bossFadeTimer.current = setTimeout(() => setBossInfo(null), 700); },
      onVictory: (name) => setVictoryName(name || 'The Nightmare'),
      onMapToggle: (open) => setMapOpen(open),
      onMapState: (s) => setMapState(s),
      onNpcDialog: (d) => setNpcDialog(d),
      onQuestState: (q) => setQuests(q),
      onQuestLogToggle: (open) => setQuestLogOpen(open),
      onShop: (s) => setShop(s),
      onEnding: (show) => {
        setShowCredits(show);
        if (show) { const g = gameRef.current; if (g && g.speedrunFinalMs) syncSpeedrun(g.speedrunFinalMs); }
      },
      onInventoryToggle: (open) => setInventoryOpen(open),
      onLanternRest: (info) => setLanternRest(info),
      onWorkshop: (open) => setWorkshopOpen(open),
      onPauseToggle: (open) => setPauseOpen(open),
      onAreaTitle: (name) => setAreaTitle({ name, key: Date.now() }),
      onTransition: (t) => setTransition(t),
      onAchievement: (a) => { toastRef.current?.push(a); syncScore(); },
      onEpicMessage: (text) => setEpicMsg({ text, id: Date.now() }),
      onOutfitShop: (s) => setOutfitShop(s),
      onSoulReward: (s) => setSoulReward(s),
      onCharmReward: (id) => setCharmReward(id),
      onKeyReward: (info) => setKeyReward(info),
      onUpgradeNotice: (n) => setUpgradeNotice({ ...n, id: Date.now() }),
      onLevelUpNotice: (n) => setLevelUpNotice({ ...n, id: Date.now() }),
      onLanternRestWarning: (w) => setRestWarning(w),
      onRunComplete: (r) => {
        setGameCompleted(true); setNgPlusSave(r.ngPlus);
        syncDeathRun({ deaths: r.deaths, timeMs: r.timeMs, ngPlus: r.ngPlus });
        recordLocalDeathRun({ deaths: r.deaths, timeMs: r.timeMs, ngPlus: r.ngPlus });
      },
      onNewGamePlus: () => setNgPlusSave(true),
      onMapTable: (open) => setMapTableOpen(open),
      onFragmentDiscovery: (info) => setFragmentDiscovery(info),
      onTutorial: (payload) => { if (payload) { setTutorialText(payload.text); setTutorialTip(payload.tip || null); setTutorialShow(true); } else setTutorialShow(false); },
    });
    gameRef.current = game;
    game.start();
    return () => game.stop();
  }, []);

  useEffect(() => { if (showLevelUp) setPhase('levelup'); }, [showLevelUp]);
  useEffect(() => { if (!tutorialShow) { const id = setTimeout(() => { setTutorialText(null); setTutorialTip(null); }, 450); return () => clearTimeout(id); } }, [tutorialShow]);
  useEffect(() => {
    if (phase === 'dead') {
      const g = gameRef.current;
      let shown = false; try { shown = !!localStorage.getItem('hunt_death_intro_v1'); } catch (e) {}
      if (g && g.deathMarker && !shown) { try { localStorage.setItem('hunt_death_intro_v1', '1'); } catch (e) {} setDeathTip(true); }
      else setDeathTip(false);
    } else setDeathTip(false);
  }, [phase]);

  const startGame = useCallback(() => { setStarted(true); gameRef.current.beginFreshGame(); }, []);
  const continueGame = useCallback(() => { setStarted(true); gameRef.current.beginGame(true); }, []);
  const handleLevel = useCallback((stat) => { gameRef.current.levelUp(stat); }, []);
  const closeLevelUp = useCallback(() => { gameRef.current.closeLevelUp(); }, []);
  const respawn = useCallback(() => { gameRef.current.respawn(); }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none" style={{ fontFamily: 'ui-serif, Georgia, serif' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Intro / title screen */}
      {!started && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
          style={{ background: 'radial-gradient(ellipse at center, rgba(20,12,18,0.7) 0%, rgba(0,0,0,0.97) 80%)' }}>
          <p className="text-stone-300 tracking-[0.5em] text-sm uppercase mb-4 animate-pulse">A Hunter's Tale</p>
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-3" style={{ textShadow: '0 0 40px rgba(200,160,100,0.6), 0 0 8px rgba(255,240,200,0.4)' }}>
            The Night of the Hunt
          </h1>
          <p className="text-stone-200 italic max-w-2xl text-base md:text-lg leading-relaxed mb-8">
            "Long ago, the people drank from the cursed rain, believing it would bring salvation. Instead, it transformed them into beasts. The Night of the Hunt has begun. Seek the Souls of the Nine Guardians and uncover the truth before the kingdom is lost forever."
          </p>
          <div className="flex flex-col gap-3 mb-2">
            {hasSaveFile && (
              <button onClick={continueGame}
                className="px-12 py-4 border border-amber-400/70 text-amber-100 tracking-[0.3em] text-base uppercase hover:bg-amber-900/40 hover:border-amber-300 transition-all duration-300"
                style={{ boxShadow: '0 0 32px rgba(200,160,100,0.32)', textShadow: '0 0 10px rgba(255,220,150,0.5)' }}>
                Continue the Hunt
                {ngPlusSave && <span className="ml-2 text-[10px] tracking-[0.3em] align-middle" style={{ color: '#b48ad6' }}>✦ NG+</span>}
              </button>
            )}
            <button onClick={startGame}
              className="px-12 py-4 border border-amber-600/60 text-amber-100 tracking-[0.3em] text-base uppercase hover:bg-amber-900/30 hover:border-amber-400 transition-all duration-300"
              style={{ boxShadow: '0 0 28px rgba(200,160,100,0.25)', textShadow: '0 0 10px rgba(255,220,150,0.5)' }}>
              Awaken the Hunt
            </button>
            {gameCompleted && (
              <button onClick={() => { setStarted(true); gameRef.current.beginNewGamePlus(); }}
                className="px-12 py-4 border border-purple-500/60 text-purple-200 tracking-[0.3em] text-base uppercase hover:bg-purple-900/30 hover:border-purple-400 transition-all duration-300"
                style={{ boxShadow: '0 0 28px rgba(150,100,200,0.28)', textShadow: '0 0 10px rgba(200,160,255,0.5)' }}>
                New Game+
              </button>
            )}
            {gameCompleted && (
              <button onClick={() => setShowLeaderboards(true)}
                className="px-12 py-4 border border-stone-500/50 text-stone-200 tracking-[0.3em] text-sm uppercase hover:bg-stone-800/40 hover:border-stone-400 transition-all duration-300">
                Leaderboards
              </button>
            )}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-1.5 text-stone-400 text-sm max-w-md">
            <Ctrl k="WASD" v="Move" />
            <Ctrl k="Space" v="Dodge" />
            <Ctrl k="L-Click / J" v="Light attack" />
            <Ctrl k="R-Click / K (hold)" v="Heavy / Charged" />
            <Ctrl k="R" v="Fire pistol (parry)" />
            <Ctrl k="F" v="Transform weapon" />
            <Ctrl k="Q" v="Lock on" />
            <Ctrl k="E" v="Interact / Level up" />
            <Ctrl k="V" v="Draught (heal)" />
            <Ctrl k="L" v="Hunter's Journal" />
            <Ctrl k="M" v="World Map" />
            <Ctrl k="Tab" v="Satchel" />
            <Ctrl k="G" v="Molotov" />
            <Ctrl k="N" v="Mute" />
            <Ctrl k="Esc" v="Pause Menu" />
            <Ctrl k="Parry → Light" v="Visceral" />
          </div>
        </div>
      )}

      {/* HUD */}
      {started && hud && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 md:p-6">
          <div className="flex justify-between items-start">
            {/* Left: vitals */}
            <div className="space-y-2 w-72 max-w-[45vw]">
              {/* HP */}
              <div>
                <div className="flex justify-between text-[10px] text-stone-400 tracking-widest uppercase mb-0.5">
                  <span>Vitality</span><span>{Math.ceil(hud.hp)}/{Math.ceil(hud.maxHp)}</span>
                </div>
                <HpBar hp={hud.hp} maxHp={hud.maxHp} rally={hud.rallyHp || 0} />
              </div>
              {/* Stamina */}
              <div>
                <div className="flex justify-between text-[10px] text-stone-400 tracking-widest uppercase mb-0.5">
                  <span>Endurance</span><span>{Math.ceil(hud.stamina)}</span>
                </div>
                <Bar value={hud.stamina} max={hud.maxStamina} from="#3a5a2a" to="#9ab84a" h={6} />
              </div>
              {/* Essence / level */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-amber-300/80 text-xs font-mono">Lv {hud.level}</span>
                <div className="flex-1">
                  <Bar value={hud.essence} max={hud.needed} from="#4a3a6a" to="#b48ad6" h={4} />
                </div>
                <span className="text-stone-500 text-[10px] font-mono">{Math.floor(hud.essence)}/{hud.needed}</span>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-700" style={{ boxShadow: '0 0 6px rgba(180,40,40,0.8)' }} />
                <span className="text-red-200/80 text-xs font-mono tracking-widest">{hud.bloodVials} DRAUGHTS</span>
                <span className="text-stone-600 text-[10px]">[V]</span>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-orange-500 text-sm">🔥</span>
                <span className="text-orange-200/80 text-xs font-mono tracking-widest">{hud.molotovs} MOLOTOVS</span>
                <span className="text-stone-600 text-[10px]">[G]</span>
              </div>
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-purple-400 text-sm">◆</span>
                <span className="text-purple-200/80 text-xs font-mono tracking-widest">{hud.shards} BLOODSTONE</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1.5">
                {(hud.equipped || []).map((id, i) => { const c = getCharm(id); return c ? <span key={i} title={c.name} className="w-6 h-6 rounded flex items-center justify-center text-sm" style={{ border: '1.5px solid #b48ad6', background: 'rgba(0,0,0,0.5)' }}>{c.icon}</span> : null; })}
                {Array.from({ length: Math.max(0, 3 - (hud.equipped || []).length) }).map((_, i) => <span key={'e' + i} className="w-6 h-6 rounded border border-stone-700/50 bg-black/30" />)}
              </div>
            </div>

            {/* Right: weapon + status */}
            <div className="text-right space-y-1">
              <div className={`text-xs tracking-[0.3em] uppercase ${hud.mode === 'sword' ? 'text-stone-300' : 'text-amber-400/80'}`}>
                Riftcleaver · {hud.mode === 'sword' ? 'Sword' : 'Scythe'}{hud.weaponLvl > 0 ? <span className="text-amber-300/80"> +{hud.weaponLvl}</span> : null}
              </div>
              <div className="text-amber-200/70 text-xs font-mono tracking-widest">{hud.bullets}/{hud.maxBullets} BULLETS</div>
              <div className="text-stone-600 text-[10px] tracking-widest uppercase">Hunter's Pistol [R]</div>
              {hud.locked && <div className="text-amber-500/70 text-[10px] tracking-widest uppercase animate-pulse">◆ Locked On</div>}
              <button onClick={() => gameRef.current.toggleInventory()} className="pointer-events-auto mt-2 px-3 py-1.5 border border-amber-800/50 text-amber-200/80 text-[10px] tracking-[0.25em] uppercase hover:bg-amber-900/20 transition-colors">Satchel [Tab]</button>
            </div>
          </div>
        </div>
      )}

      {/* Boss bar — fades in when the fight begins, updates with damage, vanishes instantly on death, fades out on victory */}
      {bossInfo && (
        <div className="absolute bottom-6 left-1/2 z-20 w-[min(860px,92vw)] pointer-events-none"
          style={{ opacity: phase === 'bossActive' ? 1 : 0, transform: `translate(-50%, ${phase === 'bossActive' ? 0 : 12}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
          <div className="text-center mb-1.5">
            <span className="text-stone-200 tracking-[0.5em] uppercase text-base md:text-lg" style={{ textShadow: '0 0 16px rgba(140,30,30,0.8)' }}>
              {bossInfo.name}
            </span>
          </div>
          <div className="h-3.5 bg-stone-950/90 border border-stone-600/60" style={{ boxShadow: '0 0 20px rgba(120,20,20,0.4)' }}>
            <div className="h-full transition-all duration-300"
              style={{ width: `${(bossInfo.hp / bossInfo.max) * 100}%`, background: 'linear-gradient(90deg,#4a0808,#8a1a1a,#c0392b,#e05a3a)' }} />
          </div>
        </div>
      )}

      {/* Center message */}
      {msg && (
        <div key={msg.id} className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center animate-fadeMsg">
          <p className="text-stone-200 tracking-[0.3em] uppercase text-sm md:text-base" style={{ textShadow: '0 0 16px rgba(0,0,0,0.9)' }}>
            {msg.text}
          </p>
        </div>
      )}

      {/* Interaction prompt */}
      {hud && started && (
        <InteractPrompt game={gameRef} />
      )}

      {/* Contextual tutorial hints (first playthrough only) */}
      {tutorialText && started && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center" style={{ bottom: '9.5rem', opacity: tutorialShow ? 1 : 0, transition: 'opacity 0.4s ease' }}>
          <span className="text-amber-200/90 text-[13px] tracking-[0.3em] uppercase px-6 py-2.5 border border-amber-800/45 bg-black/60"
            style={{ textShadow: '0 0 10px rgba(0,0,0,0.95)', boxShadow: '0 0 18px rgba(0,0,0,0.55)' }}>
            {tutorialText}
          </span>
          {tutorialTip && (
            <span className="mt-2 text-stone-400 text-[11px] tracking-[0.2em] italic" style={{ textShadow: '0 0 10px rgba(0,0,0,0.95)' }}>
              {tutorialTip}
            </span>
          )}
        </div>
      )}

      {/* Level up panel */}
      {showLevelUp && hud && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg border border-amber-900/40 bg-stone-950/95 p-6 md:p-8" style={{ boxShadow: '0 0 40px rgba(180,140,80,0.1)' }}>
            <p className="text-center text-amber-300/70 tracking-[0.4em] uppercase text-xs mb-1">The Last Lantern</p>
            <h2 className="text-center text-stone-100 text-2xl mb-1">Reflect on the Hunt</h2>
            <p className="text-center text-stone-500 text-xs mb-6">
              {hud.essence >= hud.needed ? 'Channel essence to grow stronger.' : `You need ${Math.max(0, Math.ceil(hud.needed - hud.essence))} more essence.`}
            </p>
            <div className="space-y-2">
              {STATS.map((s) => {
                const can = hud.essence >= hud.needed;
                return (
                  <button key={s.key} onClick={() => can && handleLevel(s.key)} disabled={!can}
                    className={`w-full flex items-center justify-between px-4 py-3 border transition-all
                      ${can ? 'border-stone-700 hover:border-amber-700/60 hover:bg-amber-900/10 cursor-pointer' : 'border-stone-800 opacity-50 cursor-not-allowed'}`}>
                    <div className="text-left">
                      <div className="text-stone-200 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        {s.name}
                        <span className="text-stone-500 text-xs">Lv {hud[s.key]}</span>
                      </div>
                      <div className="text-stone-600 text-[11px]">{s.desc}</div>
                    </div>
                    <span className="text-amber-400/70 text-xs tracking-widest uppercase">{can ? '+1' : '—'}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={closeLevelUp}
              className="mt-6 w-full py-2.5 text-stone-400 tracking-[0.3em] uppercase text-xs border border-stone-800 hover:border-stone-600 hover:text-stone-200 transition-colors">
              Return to the Hunt
            </button>
          </div>
        </div>
      )}

      {/* Lore overlay */}
      {lore && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 px-4" onClick={() => setLore(null)}>
          <div className="max-w-md border border-stone-700/40 bg-stone-950/95 p-8 text-center cursor-pointer">
            <p className="text-amber-300/60 tracking-[0.3em] uppercase text-[10px] mb-3">Recovered</p>
            <h3 className="text-stone-200 text-xl mb-4">{lore.title}</h3>
            <p className="text-stone-400 italic text-sm leading-relaxed mb-6">{lore.text}</p>
            <span className="text-stone-600 text-[10px] tracking-widest uppercase">— click to close —</span>
          </div>
        </div>
      )}

      {/* Death */}
      {phase === 'dead' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 text-center px-6">
          <h2 className="text-5xl md:text-6xl text-stone-700 font-bold mb-3" style={{ textShadow: '0 0 20px rgba(80,0,0,0.5)' }}>YOU DIED</h2>
          <p className="text-stone-600 italic max-w-sm">The Hollow Quarter claims another. But the Hunt is not yet over.</p>
          {deathTip && (
            <p className="text-amber-200/80 text-sm max-w-md mt-4 leading-relaxed px-4" style={{ textShadow: '0 0 10px rgba(0,0,0,0.9)' }}>
              You have dropped your carried Essence. Return to the place where you fell to recover it before dying again. Your last death location is marked on the map.
            </p>
          )}
          <button onClick={respawn}
            className="mt-8 px-10 py-3 border border-amber-800/50 text-amber-200/80 tracking-[0.3em] text-sm uppercase hover:bg-amber-900/20 transition-all">
            Rise Again
          </button>
        </div>
      )}

      {/* Victory */}
      {phase === 'victory' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6"
          style={{ background: 'radial-gradient(ellipse at center, rgba(40,30,20,0.6) 0%, rgba(0,0,0,0.95) 75%)' }}>
          <p className="text-amber-300/60 tracking-[0.5em] uppercase text-xs mb-4 animate-pulse">Nightmare Prey Slain</p>
          <h2 className="text-4xl md:text-5xl text-stone-200 mb-4">{victoryName} Falls</h2>
          <p className="text-stone-500 italic max-w-md mb-2 leading-relaxed">
            "The dream collapses inward, and the shape that wore it falls silent. Somewhere in the waking world a lantern still burns — but the Quarter remembers every name you carved into the dark."
          </p>
          <p className="text-stone-600 text-xs mb-8">The Hollow Quarter endures. The deeper truths remain buried.</p>
          <button onClick={respawn}
            className="px-10 py-3 border border-amber-700/50 text-amber-200/90 tracking-[0.3em] text-sm uppercase hover:bg-amber-900/20 transition-all">
            Continue the Hunt
          </button>
        </div>
      )}

      {/* The world map now lives as a page inside the Hunter's Journal */}

      {/* NPC conversation */}
      {npcDialog && <NPCDialog game={gameRef} dialog={npcDialog} />}

      {/* Sanctuary merchant */}
      {shop && <Shop game={gameRef} shop={shop} />}

      {/* Hunter's journal (Chronicle / Quests / Map) */}
      {questLogOpen && <Journal game={gameRef} quests={quests} mapState={mapState} />}

      {/* Grand Sanctuary map table — a detailed, rotatable world chart */}
      {mapTableOpen && <SanctuaryMapTable game={gameRef} mapState={mapState} />}

      {/* Map Fragment discovery — a cinematic pause when a fragment is charted */}
      {fragmentDiscovery && <MapFragmentDiscovery game={gameRef} info={fragmentDiscovery} mapState={mapState} />}

      {/* Inventory / charm equip */}
      {inventoryOpen && <Inventory game={gameRef} />}

      {/* Lantern rest menu (level up / inventory / travel) */}
      {lanternRest && <LanternRest game={gameRef} info={lanternRest} />}

      {/* Workshop (weapon reinforcement) */}
      {workshopOpen && <Workshop game={gameRef} />}

      {/* Outfit shop (cosmetic hunter garb) */}
      {outfitShop && <OutfitShop game={gameRef} shop={outfitShop} />}

      {/* Boss Soul reward cinematic */}
      {soulReward && <SoulReward game={gameRef} soul={soulReward} />}

      {/* Charm discovery reward cinematic */}
      {charmReward && <CharmReward game={gameRef} charmId={charmReward} />}
      {/* Forgotten Gate Key reward cinematic */}
      {keyReward && <KeyReward game={gameRef} info={keyReward} />}

      {/* Weapon upgrade available notification */}
      <UpgradeNotice notice={upgradeNotice} onDone={() => setUpgradeNotice(null)} />

      {/* Level up available notification */}
      <LevelUpNotice notice={levelUpNotice} onDone={() => setLevelUpNotice(null)} />

      {/* Lantern rest confirmation warning */}
      {restWarning && <LanternRestWarning game={gameRef} info={restWarning} />}

      {/* Mini-map (fog of war) */}
      {started && hud && !bossInfo && <MiniMap game={gameRef} mapState={mapState} />}

      {/* Ending / credits */}
      <EndCredits game={gameRef} visible={showCredits} />

      {/* Achievement trophy notifications (top-right, queued) */}
      <AchievementToast ref={toastRef} />

      {/* Leaderboards overlay (opened from the title screen) */}
      {showLeaderboards && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="relative w-full max-w-lg p-6 md:p-8" style={{ background: 'linear-gradient(160deg, rgba(18,12,16,0.97), rgba(8,6,10,0.98))', border: '1px solid rgba(160,120,50,0.35)', boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}>
            <LeaderboardMenu />
            <button onClick={() => setShowLeaderboards(false)}
              className="mt-5 w-full py-2.5 text-[11px] tracking-[0.35em] uppercase transition-colors hover:bg-amber-900/10"
              style={{ color: '#7a5a3a', border: '1px solid rgba(122,82,48,0.35)', fontFamily: 'ui-serif, Georgia, serif' }}>
              ‹ Back to Title
            </button>
          </div>
        </div>
      )}

      {/* Epic story banner (e.g. "Something has changed...") */}
      {epicMsg && <EpicBanner key={epicMsg.id} message={epicMsg.text} onDone={() => setEpicMsg(null)} />}

      {/* Pause menu */}
      {pauseOpen && <PauseMenu game={gameRef} />}

      {/* Area transition fade */}
      {transition && (() => {
        const a = Math.max(0, Math.min(1, transition.phase === 'out' ? transition.t / transition.dur : 1 - transition.t / transition.dur));
        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ background: `rgba(0,0,0,${a})` }}>
            <p className="tracking-[0.4em] uppercase text-sm" style={{ opacity: a, color: '#d8c89a', fontFamily: 'ui-serif, Georgia, serif', textShadow: '0 0 12px rgba(0,0,0,0.95)' }}>
              {transition.label}
            </p>
          </div>
        );
      })()}

      {/* Area discovery title */}
      {areaTitle && (
        <div key={areaTitle.key} className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none animate-areaTitle">
          <div className="text-center px-6">
            <p className="text-amber-200/40 tracking-[0.5em] uppercase text-[11px] mb-3">— You have arrived —</p>
            <h2 className="text-4xl md:text-6xl text-stone-100" style={{ fontFamily: 'ui-serif, Georgia, serif', textShadow: '0 0 30px rgba(0,0,0,0.95), 0 0 14px rgba(200,160,100,0.35)', letterSpacing: '0.08em' }}>
              {areaTitle.name}
            </h2>
            <div className="mx-auto mt-4 h-px w-32" style={{ background: 'linear-gradient(90deg,transparent,rgba(200,160,90,0.6),transparent)' }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeMsg { 0% { opacity: 0; transform: translate(-50%, -8px); } 15% { opacity: 1; transform: translate(-50%, 0); } 80% { opacity: 1; } 100% { opacity: 0; } }
        .animate-fadeMsg { animation: fadeMsg 2.4s ease-out forwards; }
        @keyframes areaTitle { 0% { opacity: 0; transform: scale(1.04); } 12% { opacity: 1; transform: none; } 78% { opacity: 1; } 100% { opacity: 0; } }
        .animate-areaTitle { animation: areaTitle 3.4s ease-out forwards; }
      `}</style>
    </div>
  );
}

function HpBar({ hp, maxHp, rally }) {
  const pct = (v) => `${Math.max(0, Math.min(100, (v / maxHp) * 100))}%`;
  const rallyW = Math.max(0, Math.min(100, ((Math.min(rally, maxHp - hp)) / maxHp) * 100));
  return (
    <div className="relative w-full bg-black/60 border border-stone-800/60" style={{ height: 8 }}>
      <div className="absolute inset-y-0 left-0 transition-all duration-200" style={{ width: pct(hp), background: 'linear-gradient(90deg,#7a1a1a,#c0392b)', boxShadow: '0 0 8px #c0392b55' }} />
      {rallyW > 0 && (
        <div className="absolute inset-y-0 transition-all duration-200" style={{ left: pct(hp), width: `${rallyW}%`, background: 'linear-gradient(90deg,#b07020,#e0a040)', opacity: 0.9, boxShadow: '0 0 6px #e0a04066' }} />
      )}
    </div>
  );
}

function Bar({ value, max, from, to, h = 8 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full bg-black/60 border border-stone-800/60" style={{ height: h }}>
      <div className="h-full transition-all duration-200" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})`, boxShadow: `0 0 8px ${to}55` }} />
    </div>
  );
}

function Ctrl({ k, v }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-stone-200 font-mono">{k}</span>
      <span className="text-stone-400">{v}</span>
    </div>
  );
}

function InteractPrompt({ game }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 120);
    return () => clearInterval(id);
  }, []);
  const p = game.current && game.current.player;
  if (!p) return null;
  if (p.nearShortcutGate) return <Prompt text="Press E — Open the Great Gate" />;
  if (p.nearSealedGate) return <Prompt text="Press E — The Forgotten Gate" />;
  if (p.nearGate) return <Prompt text="Press E — The Sealed Gate" />;
  if (p.nearNpc) return <Prompt text={`Press E — Speak with ${p.nearNpc.def.name}`} />;
  if (p.nearWorkshop) return <Prompt text="Press E — Use the Workshop" />;
  if (p.nearLantern) return <Prompt text={`Press E — Rest at ${p.nearLanternName || 'the Lantern'}`} />;
  if (p.nearFragment) return <Prompt text="Press E — Take Map Fragment" />;
  if (p.nearChest) return <Prompt text="Press E — Open Chest" />;
  if (p.nearMapTable) return <Prompt text="Press E — Consult the Map Table" />;
  if (p.nearNote) return <Prompt text={`Press E — Read "${p.nearNote.title}"`} />;
  return null;
}

function Prompt({ text }) {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <span className="text-amber-200/80 text-xs tracking-[0.3em] uppercase px-4 py-2 border border-amber-800/40 bg-black/50"
        style={{ textShadow: '0 0 8px rgba(0,0,0,0.9)' }}>
        {text}
      </span>
    </div>
  );
}