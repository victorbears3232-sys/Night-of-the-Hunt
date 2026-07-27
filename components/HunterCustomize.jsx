// HunterCustomize.jsx — the Hunter tab: a rotatable 3D preview of the current
// hunter, built with three.js. Players preview outfits and weapon skins (the
// model recolours live), then confirm to equip. Undiscovered/locked items show
// their price or unlock condition. Kept immersive and gothic: dark stage,
// warm lantern light, slow auto-turn that yields to drag.

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OUTFITS, getOutfit } from '@/game/Outfits';
import { SKINS, getSkin } from '@/game/WeaponSkins';

const SERIF = 'ui-serif, Georgia, serif';

// ---- outfit swatch color ----
const swatch = (o) => (o.palette && (o.palette.coat || o.palette.coatShade)) || '#1c1820';

export default function HunterCustomize({ game }) {
  const mountRef = useRef(null);
  const parts = useRef(null);   // { group, mats: {coat, vest, shirt, hat, hatBrim, steel, handle, pommel, accent} }
  const drag = useRef({ active: false, x: 0 });

  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force(n => n + 1), 250); return () => clearInterval(id); }, []);

  const g = game.current;
  const p = g && g.player;
  const [pOutfit, setPOutfit] = useState(p ? p.outfit : 'hunter_garb');
  const [pSkin, setPSkin] = useState(p ? p.skin : 'default');

  // sync preview to equipped whenever the tab opens / equipment changes
  useEffect(() => {
    if (p) { setPOutfit(p.outfit); setPSkin(p.skin); }
  }, [p && p.outfit, p && p.skin]);

  // ---- build the three.js scene once ----
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth || 320, H = mount.clientHeight || 260;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 50);
    camera.position.set(0, 1.15, 6.6);
    camera.lookAt(0, 0.85, 0);

    scene.add(new THREE.AmbientLight(0x2a2630, 1.5));
    const key = new THREE.DirectionalLight(0xffd9a0, 1.15);
    key.position.set(2.4, 4.5, 3.2); scene.add(key);
    const lantern = new THREE.PointLight(0xff8a40, 0.9, 7, 1.5);
    lantern.position.set(1.6, 0.6, 2.2); scene.add(lantern);
    scene.add(new THREE.HemisphereLight(0x202830, 0x05050a, 0.5));

    const group = new THREE.Group();
    scene.add(group);
    const M = (col) => new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.8, metalness: 0.1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x4a2e16, roughness: 0.9 });
    const coatMat = M('#1c1820'), vestMat = M('#2a2630'), shirtMat = M('#4a4438');
    const hatMat = M('#0c0a10'), hatBrimMat = M('#16121c'), accentMat = M('#9a7a3a');
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xc9d2e2, roughness: 0.35, metalness: 0.6 });
    const handleMat = M('#5a4a3a'), pommelMat = M('#9a7a3a');

    // coat (flared)
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.18, 1.75, 16), coatMat); coat.position.y = 0.32; group.add(coat);
    // vest
    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.74, 1.12, 14), vestMat); vest.position.y = 0.45; group.add(vest);
    // shirt strip (open coat front)
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.92, 0.34), shirtMat); shirt.position.y = 0.5; shirt.position.z = 0.18; group.add(shirt);
    // high collar / scarf
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.1, 8, 20), coatMat); collar.position.y = 1.18; collar.rotation.x = Math.PI / 2; group.add(collar);
    // belt + buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.13, 0.5), beltMat); belt.position.y = -0.06; group.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.17, 0.08), accentMat); buckle.position.set(0, -0.06, 0.26); group.add(buckle);
    // arms
    const armGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.15, 8);
    const armL = new THREE.Mesh(armGeo, coatMat); armL.position.set(-0.66, 0.46, 0); armL.rotation.z = 0.18; group.add(armL);
    const armR = new THREE.Mesh(armGeo, coatMat); armR.position.set(0.66, 0.46, 0); armR.rotation.z = -0.18; group.add(armR);
    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 18), skinMat); head.position.y = 1.56; group.add(head);
    // hat
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.07, 20), hatBrimMat); brim.position.y = 1.84; group.add(brim);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 20), hatMat); crown.position.y = 2.08; group.add(crown);
    // weapon (Saw Cleaver) held at the right side
    const wgrp = new THREE.Group(); wgrp.position.set(0.82, 0.62, 0.2); wgrp.rotation.z = -0.5; group.add(wgrp);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8), handleMat); handle.rotation.z = Math.PI / 2; wgrp.add(handle);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.42, 0.04), steelMat); blade.position.set(0.95, 0, 0); wgrp.add(blade);
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), pommelMat); pommel.position.set(-0.5, 0, 0); wgrp.add(pommel);

    group.position.y = -0.95;

    parts.current = { group, mats: { coatMat, vestMat, shirtMat, hatMat, hatBrimMat, steelMat, handleMat, pommelMat, accentMat } };

    let raf;
    const render = () => {
      if (!drag.current.active) group.rotation.y += 0.0035;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();

    const onDown = (e) => { drag.current = { active: true, x: e.clientX }; };
    const onMove = (e) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x; drag.current.x = e.clientX;
      group.rotation.y += dx * 0.01;
    };
    const onUp = () => { drag.current.active = false; };
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || 320, h = mount.clientHeight || 260;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ro.disconnect();
      renderer.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ---- recolour the model when the preview changes ----
  useEffect(() => {
    const P = parts.current; if (!P) return;
    const o = getOutfit(pOutfit);
    const sk = getSkin(pSkin);
    const pal = o.palette || {};
    const set = (m, c) => { if (c) m.color.set(c); };
    set(P.mats.coatMat, pal.coat || '#1c1820');
    set(P.mats.vestMat, pal.vest || '#2a2630');
    set(P.mats.shirtMat, pal.shirt || '#4a4438');
    set(P.mats.hatMat, pal.hat || '#0c0a10');
    set(P.mats.hatBrimMat, pal.hatBrim || '#16121c');
    set(P.mats.accentMat, o.accent || '#9a7a3a');
    set(P.mats.steelMat, sk.steel || '#c9d2e2');
    set(P.mats.handleMat, sk.handle || '#5a4a3a');
    set(P.mats.pommelMat, sk.pommel || '#9a7a3a');
  }, [pOutfit, pSkin]);

  if (!g || !p) return null;
  const ownedOutfit = (id) => p.outfits.has(id);
  const ownedSkin = (id) => p.skins.has(id);
  const confirm = () => {
    if (ownedOutfit(pOutfit) && p.outfit !== pOutfit) g.equipOutfit(pOutfit);
    if (ownedSkin(pSkin) && p.skin !== pSkin) g.equipSkin(pSkin);
  };
  const dirty = (ownedOutfit(pOutfit) && p.outfit !== pOutfit) || (ownedSkin(pSkin) && p.skin !== pSkin);

  return (
    <div key="hunter" className="journalPage">
      {/* 3D stage */}
      <div className="relative mx-auto mb-3" style={{ width: 'min(360px, 100%)' }}>
        <div ref={mountRef} className="w-full cursor-grab active:cursor-grabbing"
          style={{ height: 270, background: 'radial-gradient(ellipse at 50% 65%, rgba(40,28,20,0.55) 0%, rgba(8,6,10,0.92) 70%)', border: '1px solid rgba(122,82,48,0.35)' }} />
        <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none">
          <span className="text-[9px] tracking-[0.3em] uppercase px-2 py-0.5" style={{ color: '#7a5230', background: 'rgba(230,217,178,0.7)', border: '1px solid rgba(122,82,48,0.35)' }}>
            drag to turn the hunter
          </span>
        </div>
      </div>

      {dirty && (
        <div className="text-center mb-2">
          <button onClick={confirm} className="px-5 py-1.5 text-[11px] tracking-[0.3em] uppercase"
            style={{ fontFamily: SERIF, color: '#3a1e12', border: '1px solid rgba(122,60,30,0.55)', background: 'rgba(122,60,30,0.18)' }}>
            ✓ Confirm This Look
          </button>
          <button onClick={() => { setPOutfit(p.outfit); setPSkin(p.skin); }} className="ml-2 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase" style={{ color: '#7a5230', border: '1px solid rgba(122,82,48,0.35)' }}>Reset</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Outfits */}
        <div>
          <p className="text-center text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: '#7a5230' }}>Hunter Garb</p>
          <div className="space-y-1.5 max-h-[34vh] overflow-y-auto pr-1">
            {OUTFITS.map(o => {
              const owned = ownedOutfit(o.id);
              const equipped = p.outfit === o.id;
              const preview = pOutfit === o.id;
              const unlocked = !o.unlock || o.unlock(g);
              return (
                <div key={o.id} onClick={() => { if (owned) setPOutfit(o.id); }}
                  className="w-full flex items-center gap-2 px-2 py-2 text-left transition-colors"
                  style={{
                    border: `1px solid ${equipped ? 'rgba(122,40,30,0.55)' : preview ? 'rgba(160,120,50,0.6)' : 'rgba(122,82,48,0.3)'}`,
                    background: preview ? 'rgba(160,120,50,0.14)' : 'rgba(40,25,10,0.06)',
                    cursor: owned ? 'pointer' : 'default', opacity: owned ? 1 : 0.6,
                  }}>
                  <div style={{ width: 26, height: 32, background: swatch(o), borderTop: `3px solid ${o.accent || (o.palette && o.palette.coatLining) || '#000'}`, borderRadius: 3, flexShrink: 0, boxShadow: 'inset 0 0 6px rgba(0,0,0,0.5)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] leading-tight flex items-center gap-1.5" style={{ fontFamily: SERIF, color: '#2a1e10' }}>
                      {o.name}
                      {equipped && <span className="text-[8px] tracking-widest uppercase" style={{ color: '#7a2a1a' }}>Worn</span>}
                    </div>
                    <div className="text-[9px] italic leading-tight" style={{ color: '#5a4a32' }}>{owned ? (unlocked ? o.desc : 'Locked') : (unlocked ? `${o.price} ✦` : 'Locked')}</div>
                  </div>
                  {!owned && unlocked && (
                    <button onClick={(e) => { e.stopPropagation(); g.buyOutfit(o.id); }} className="px-2 py-1 text-[9px] tracking-widest uppercase shrink-0" style={{ color: '#3a1e12', border: '1px solid rgba(122,60,30,0.5)', background: 'rgba(122,60,30,0.10)' }}>Buy</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weapon Skins */}
        <div>
          <p className="text-center text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: '#7a5230' }}>Weapon Steel</p>
          <div className="space-y-1.5 max-h-[34vh] overflow-y-auto pr-1">
            {SKINS.map(s => {
              const owned = ownedSkin(s.id);
              const equipped = p.skin === s.id;
              const preview = pSkin === s.id;
              const unlocked = !s.unlock || s.unlock(g);
              return (
                <div key={s.id} onClick={() => { if (owned) setPSkin(s.id); }}
                  className="w-full flex items-center gap-2 px-2 py-2 text-left transition-colors"
                  style={{
                    border: `1px solid ${equipped ? 'rgba(122,40,30,0.55)' : preview ? 'rgba(160,120,50,0.6)' : 'rgba(122,82,48,0.3)'}`,
                    background: preview ? 'rgba(160,120,50,0.14)' : 'rgba(40,25,10,0.06)',
                    cursor: owned ? 'pointer' : 'default', opacity: owned ? 1 : 0.6,
                  }}>
                  <div style={{ width: 30, height: 8, background: s.steel || '#888', borderTop: `2px solid ${s.serrate || '#444'}`, flexShrink: 0, boxShadow: '0 0 4px rgba(0,0,0,0.6)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] leading-tight flex items-center gap-1.5" style={{ fontFamily: SERIF, color: '#2a1e10' }}>
                      {s.name}
                      {equipped && <span className="text-[8px] tracking-widest uppercase" style={{ color: '#7a2a1a' }}>Worn</span>}
                      {s.legendary && <span className="text-[8px] tracking-widest uppercase" style={{ color: '#e0b040' }}>✦</span>}
                    </div>
                    <div className="text-[9px] italic leading-tight" style={{ color: '#5a4a32' }}>{owned ? s.desc : (unlocked ? `${s.price} ✦` : 'Locked')}</div>
                  </div>
                  {!owned && unlocked && (
                    <button onClick={(e) => { e.stopPropagation(); g.buySkin(s.id); }} className="px-2 py-1 text-[9px] tracking-widest uppercase shrink-0" style={{ color: '#3a1e12', border: '1px solid rgba(122,60,30,0.5)', background: 'rgba(122,60,30,0.10)' }}>Buy</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 px-1">
        <span className="text-[10px] tracking-widest uppercase" style={{ color: '#7a5230' }}>Your essence</span>
        <span className="text-[12px] font-mono" style={{ color: '#3a1e12' }}>{Math.floor(p.essence)} ✦</span>
      </div>
    </div>
  );
}