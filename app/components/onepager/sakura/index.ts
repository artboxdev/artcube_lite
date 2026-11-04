import { SakuraCanvas } from './SakuraCanvas';
import type { ExperienceDefinition } from '../../../lib/experience-types';

export const sakuraExperience: ExperienceDefinition = {
  id: 'sakura',
  title: 'Sakura Stage',
  description: 'Interaktives Multimedien-Kunstwerk mit Sumi-e Kirschblüten, Plexus 3D-Formen-Transformationen und Shibuya Magenta Metallics.',
  duration: 120,
  Component: SakuraCanvas,
  getHUDText: (elapsed: number) => {
    if (elapsed < 30) return '🌸 Blüten — Wachsen & Entfalten der Kirschblüten';
    if (elapsed < 60) return '🔮 Plexus — Driftende Partikel & 3D Formen-Morphing';
    if (elapsed < 90) return '🌀 Vortex — Der Datensturm vereint die Dimensionen';
    return '🌸 Sakura Stage — Vollendung des kollaborativen Kunstwerks';
  },
};
