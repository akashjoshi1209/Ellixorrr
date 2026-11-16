/* eslint-disable react-hooks/refs, prefer-const, @typescript-eslint/no-unused-expressions */
/**
 * Vendored exact source from ThreeUI Community bundle `emerald-horizon.json`.
 * Source revision: SHA-256 66211b279456
 * Bundle URL: https://threeui.com/source-code/emerald-horizon.json
 * License: MIT (https://github.com/MengTo/threeui)
 *
 * The three eslint disables above cover upstream patterns this project's lint
 * config flags but which are intentional in the vendored component:
 * - react-hooks/refs: optionsRef is a "latest value" container read by the
 *   render loop; updating it during render is how the component props stay
 *   live without remounting.
 * - prefer-const / no-unused-expressions: `frame` is reassigned across the
 *   render/RAF boundary; the comma expression cancels RAF + resets frame.
 *
 * Vendoring adaptation: the bundle imports `* as THREE from "three128"`
 * (the package's internal alias to three@0.128.0). This project depends on
 * `three@0.149` directly, so the import path is resolved to "three". The
 * THREE API surface used is stable across 0.128→0.149. No other source line
 * was changed.
 */
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LUMINA_FRAGMENT_SHADER, LUMINA_VERTEX_SHADER } from "./emeraldHorizonShaders";

export type EmeraldHorizonBackgroundProps = { speed?: number; waveScale?: number; variation?: number; glow?: number; vignette?: number; hue?: number; className?: string };
export const EMERALD_HORIZON_DEFAULTS = { speed: 1, waveScale: 1, variation: 1, glow: 1, vignette: 1, hue: 0 } as const;
export function EmeraldHorizonBackground({ className = "", ...props }: EmeraldHorizonBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null), canvasRef = useRef<HTMLCanvasElement>(null); const optionsRef = useRef({ ...EMERALD_HORIZON_DEFAULTS, ...props }); optionsRef.current = { ...EMERALD_HORIZON_DEFAULTS, ...props };
  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current; if (!host || !canvas) return undefined;
    const scene = new THREE.Scene(); const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const uniforms = { u_time: { value: 0 }, u_resolution: { value: new THREE.Vector2(1, 1) }, u_wave_scale: { value: 1 }, u_variation: { value: 1 }, u_glow: { value: 1 }, u_vignette: { value: 1 } };
    const material = new THREE.ShaderMaterial({ vertexShader: LUMINA_VERTEX_SHADER, fragmentShader: LUMINA_FRAGMENT_SHADER, uniforms, depthWrite: false, depthTest: false }); const geometry = new THREE.PlaneGeometry(2, 2); scene.add(new THREE.Mesh(geometry, material));
    let frame = 0, visible = true, start = performance.now();
    const resize = () => { const bounds = host.getBoundingClientRect(); renderer.setSize(bounds.width, bounds.height, false); uniforms.u_resolution.value.set(bounds.width, bounds.height); };
    const render = (now: number) => { const options = optionsRef.current; uniforms.u_time.value = (now - start) * 0.001 * options.speed; uniforms.u_wave_scale.value = options.waveScale; uniforms.u_variation.value = options.variation; uniforms.u_glow.value = options.glow; uniforms.u_vignette.value = options.vignette; renderer.render(scene, camera); frame = visible && !document.hidden ? requestAnimationFrame(render) : 0; };
    const resizeObserver = new ResizeObserver(resize), intersection = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? true; if (visible && !frame) frame = requestAnimationFrame(render); if (!visible && frame) cancelAnimationFrame(frame), frame = 0; }); resizeObserver.observe(host); intersection.observe(host); resize(); frame = requestAnimationFrame(render);
    return () => { if (frame) cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect(); geometry.dispose(); material.dispose(); renderer.dispose(); };
  }, []);
  return <div ref={hostRef} className={`threeui-background emerald-horizon${className ? ` ${className}` : ""}`}><canvas ref={canvasRef} style={{ filter: `hue-rotate(${optionsRef.current.hue}deg)` }} /></div>;
}
