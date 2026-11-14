import React, { useEffect, useRef } from 'react';

interface LiveEcgWaveProps {
  heartRate?: number;
  color?: string;
  height?: number;
}

export const LiveEcgWave: React.FC<LiveEcgWaveProps> = ({
  heartRate = 72,
  color = '#00F0FF',
  height = 80
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    // ECG pattern points: [x_offset, y_norm]
    const ecgPattern = [
      0, 0, 0, 0, 0.05, -0.08, 0.1, 0, 0.15, 0,
      0.18, 0.1, 0.22, -0.9, 0.26, 0.35, 0.3, 0,
      0.35, 0, 0.45, -0.15, 0.55, 0, 0.6, 0,
      0.7, 0, 0.8, 0, 0.9, 0, 1.0, 0
    ];

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      ctx.clearRect(0, 0, width, h);

      // Speed of waveform based on heart rate
      const speed = Math.max(1.2, (heartRate / 60) * 1.8);
      offset += speed;
      if (offset >= width) offset = 0;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      const wavelength = Math.max(90, 180 * (60 / Math.max(40, heartRate)));

      for (let x = 0; x < width; x++) {
        const patternPos = ((x + offset) % wavelength) / wavelength;

        // Find interpolated Y from ecgPattern
        let yNorm = 0;
        for (let i = 0; i < ecgPattern.length; i += 2) {
          if (patternPos <= ecgPattern[i]) {
            yNorm = ecgPattern[i + 1];
            break;
          }
        }

        const y = mid + yNorm * (mid * 0.75);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Leading pulse light
      const pulseX = width - 10;
      ctx.beginPath();
      ctx.arc(pulseX, mid, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [heartRate, color]);

  return (
    <div className="ecg-container" style={{ height }}>
      <div className="ecg-grid" />
      <canvas
        ref={canvasRef}
        width={600}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
