import { Application } from 'pixi.js';

const app = new Application();

await app.init({
  background: '#1a1a2e',
  resizeTo: window,
  antialias: false,
  resolution: window.devicePixelRatio,
  autoDensity: true,
});

document.body.appendChild(app.canvas);
