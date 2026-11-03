import { useEffect, useRef } from "react";

interface NoiseAtmosphereProps {
  patternSize?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

export function NoiseAtmosphere({
  patternSize = 256,
  patternRefreshInterval = 2,
  patternAlpha = 20,
}: NoiseAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let frame = 0;
    let animationId = 0;
    let disposed = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const size = Math.max(128, Math.min(patternSize, 512));
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      context.imageSmoothingEnabled = false;
    };

    const drawGrain = () => {
      const width = canvas.width;
      const height = canvas.height;
      const imageData = context.createImageData(width, height);
      const data = imageData.data;

      for (let index = 0; index < data.length; index += 4) {
        const value = Math.random() * 255;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = patternAlpha;
      }

      context.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (disposed) return;
      if (frame % Math.max(1, patternRefreshInterval) === 0) drawGrain();
      frame += 1;
      animationId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    loop();

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [patternSize, patternRefreshInterval, patternAlpha]);

  return <canvas ref={canvasRef} className="noise-atmosphere" aria-hidden="true" />;
}
