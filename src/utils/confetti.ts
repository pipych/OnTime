import confetti from 'canvas-confetti';

/**
 * Triggers 2D side-cannon confetti bursting from the bottom left and right of the screen
 */
export const triggerSideCannonsConfetti = () => {
  const count = 55;
  const colors = ['#007AFF', '#34C759', '#FF9500', '#FFCC00', '#AF52DE', '#FF2D55'];

  // Left cannon (angled up-right ~60deg)
  confetti({
    particleCount: count,
    angle: 60,
    spread: 60,
    startVelocity: 45,
    origin: { x: 0, y: 0.8 },
    colors,
    ticks: 200,
    gravity: 1.1,
    scalar: 1,
    shapes: ['square', 'circle'],
    disableForReducedMotion: true,
  });

  // Right cannon (angled up-left ~120deg)
  confetti({
    particleCount: count,
    angle: 120,
    spread: 60,
    startVelocity: 45,
    origin: { x: 1, y: 0.8 },
    colors,
    ticks: 200,
    gravity: 1.1,
    scalar: 1,
    shapes: ['square', 'circle'],
    disableForReducedMotion: true,
  });

  // Secondary delayed wave for organic burst feel
  setTimeout(() => {
    confetti({
      particleCount: 35,
      angle: 65,
      spread: 75,
      startVelocity: 40,
      origin: { x: 0, y: 0.75 },
      colors,
      ticks: 180,
      gravity: 1.1,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 35,
      angle: 115,
      spread: 75,
      startVelocity: 40,
      origin: { x: 1, y: 0.75 },
      colors,
      ticks: 180,
      gravity: 1.1,
      disableForReducedMotion: true,
    });
  }, 180);
};
