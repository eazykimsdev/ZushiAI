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

    // Gravity well grid setup
    const gridSpacing = 36;
    let timeOffset = 0;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (!isWindowFocused || document.hidden) return;

      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      timeOffset += 0.02;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Top soft radial glow
      const glowGrad = ctx.createRadialGradient(w / 2, 0, 10, w / 2, 0, Math.max(w * 0.6, 600));
      glowGrad.addColorStop(0, 'rgba(109, 74, 224, 0.12)');
      glowGrad.addColorStop(0.5, 'rgba(109, 74, 224, 0.04)');
      glowGrad.addColorStop(1, 'rgba(14, 11, 20, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Gravity center (around center-lower region where prompt box sits)
      const wellX = w / 2;
      const wellY = h * 0.52;
      const wellRadius = Math.min(w, h) * 0.45;

      const cols = Math.ceil(w / gridSpacing) + 2;
      const rows = Math.ceil(h / gridSpacing) + 2;

      ctx.fillStyle = 'rgba(167, 139, 250, 0.15)';

      for (let i = -1; i <= cols; i++) {
        for (let j = -1; j <= rows; j++) {
          const baseX = i * gridSpacing;
          const baseY = j * gridSpacing;

          const dx = wellX - baseX;
          const dy = wellY - baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let drawX = baseX;
          let drawY = baseY;
          let dotAlpha = 0.12;

          if (dist < wellRadius && dist > 1) {
            // Subtle gravity pull toward center
            const factor = Math.pow((wellRadius - dist) / wellRadius, 2);
            const pull = factor * 14;
            const breathing = Math.sin(timeOffset + dist * 0.015) * 2;
            drawX += (dx / dist) * (pull + breathing);
            drawY += (dy / dist) * (pull + breathing);
            dotAlpha = 0.12 + factor * 0.18;
          }

          ctx.fillStyle = `rgba(167, 139, 250, ${dotAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(drawX, drawY, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
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
      style={{ background: 'var(--background)' }}
    />
  );
};
