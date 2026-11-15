import * as React from 'react';

interface GravityBackgroundProps {
  enabled?: boolean;
}

export const GravityBackground: React.FC<GravityBackgroundProps> = ({ enabled = true }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;
    let isWindowFocused = true;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }

    const handleFocus = () => {
      isWindowFocused = true;
    };
    const handleBlur = () => {
      isWindowFocused = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (!isWindowFocused || document.hidden) return;

      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      time += 0.015;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Deep void background
      ctx.fillStyle = '#090710';
      ctx.fillRect(0, 0, w, h);

      // 1. Top Fujitora Royal Violet Atmospheric Glow
      const topGlow = ctx.createRadialGradient(w / 2, 0, 10, w / 2, 0, Math.max(w * 0.7, 700));
      topGlow.addColorStop(0, 'rgba(124, 92, 252, 0.16)');
      topGlow.addColorStop(0.35, 'rgba(91, 63, 209, 0.08)');
      topGlow.addColorStop(0.7, 'rgba(30, 20, 55, 0.03)');
      topGlow.addColorStop(1, 'rgba(9, 7, 16, 0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, w, h);

      // 2. Central Gravity Well Aura behind Composer
      const wellX = w / 2;
      const wellY = h * 0.46;
      const pulse = Math.sin(time) * 15;
      const coreRadius = Math.min(w, h) * 0.38 + pulse;

      const wellGlow = ctx.createRadialGradient(wellX, wellY, 10, wellX, wellY, coreRadius);
      wellGlow.addColorStop(0, 'rgba(139, 92, 246, 0.12)');
      wellGlow.addColorStop(0.35, 'rgba(109, 74, 224, 0.06)');
      wellGlow.addColorStop(0.7, 'rgba(76, 29, 149, 0.02)');
      wellGlow.addColorStop(1, 'rgba(9, 7, 16, 0)');
      ctx.fillStyle = wellGlow;
      ctx.beginPath();
      ctx.arc(wellX, wellY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Subtle bottom atmospheric vignetting
      const bottomGlow = ctx.createLinearGradient(0, h - 180, 0, h);
      bottomGlow.addColorStop(0, 'rgba(9, 7, 16, 0)');
      bottomGlow.addColorStop(1, 'rgba(9, 7, 16, 0.6)');
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, h - 180, w, 180);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', resize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: '#090710' }}
    />
  );
};
