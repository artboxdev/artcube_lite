import { webkit, devices } from 'playwright';

async function run() {
  const browser = await webkit.launch({ 
    headless: false,
    devtools: true // Öffnet direkt die WebKit Web-Inspector Konsole
  });

  const iphone = devices['iPhone 14'];
  const context = await browser.newContext({
    ...iphone,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  
  // Trage hier deinen lokalen Port ein
  await page.goto('http://localhost:3000');

  let isLandscape = false;

  // Bindet die Umschalt-Funktion an das Browserfenster
  await page.exposeFunction('toggleOrientation', async () => {
    isLandscape = !isLandscape;
    await page.setViewportSize({
      width: isLandscape ? iphone.viewport.height : iphone.viewport.width,
      height: isLandscape ? iphone.viewport.width : iphone.viewport.height
    });
    console.log(`Ausrichtung: ${isLandscape ? 'Landscape (Quer)' : 'Portrait (Hoch)'}`);
  });

  // Taste 'R' im Browserfenster fängt den Dreh-Befehl ab
  await page.addInitScript(() => {
    window.addEventListener('keydown', (e) => {
      // Drücke 'r' oder 'R' (wenn kein Texteingabefeld fokussiert ist)
      if (e.key.toLowerCase() === 'r' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        (window as any).toggleOrientation();
      }
    });
  });
}

run();