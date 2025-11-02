import { useEffect, useRef } from "react";

export default function BackgroundEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles = [];
    let mouse = { x: width / 2, y: height / 2 };
    const density = Math.min(40, Math.floor(width / 40)); // adaptive particle count

    // 🌀 Handle Resize
    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // 🖱️ Mouse Movement for parallax
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    // 🌌 Create Particles (with depth layers)
    const createParticles = () => {
      for (let i = 0; i < density; i++) {
        const layer = Math.random() * 2 + 1; // depth layers 1–3
        const hue = 180 + Math.random() * 60; // cyan to blue hues
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 100 + 40,
          color: `hsla(${hue}, 90%, 65%, 0.18)`,
          dx: (Math.random() - 0.5) * 0.25 * layer,
          dy: (Math.random() - 0.5) * 0.25 * layer,
          layer,
        });
      }
    };

    // 🧠 Draw Function
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        const parallaxX = (mouse.x - width / 2) * 0.001 * p.layer;
        const parallaxY = (mouse.y - height / 2) * 0.001 * p.layer;

        const newX = p.x + parallaxX * p.radius;
        const newY = p.y + parallaxY * p.radius;

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          newX,
          newY,
          0,
          newX,
          newY,
          p.radius
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.arc(newX, newY, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Move particles
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
      });
    };

    // 🚀 Animation Loop
    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };

    createParticles();
    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-80 pointer-events-none"
    />
  );
}
