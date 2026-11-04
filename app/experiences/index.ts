import { myceliumExperience } from './mycelium';
import { crystalExperience } from './crystal';
import { tidalExperience } from './tidal';
import { spectralMixExperience } from './spectralmix';
import { fluidExperience } from './fluid';
import { flowExperience } from './flow';
import { particles2dExperience } from './particles2d';
import { berlinParticlesExperience } from './berlinparticles';
import { quantumExperience } from './quantum';
import { sakuraExperience } from '../components/onepager/sakura';
import type { ExperienceDefinition } from '../lib/experience-types';

export const EXPERIENCES: ExperienceDefinition[] = [
  sakuraExperience,
  berlinParticlesExperience,
  spectralMixExperience,
  particles2dExperience,
  quantumExperience,
  fluidExperience,
  flowExperience,
  myceliumExperience,
  crystalExperience,
  tidalExperience,
];

export const DEFAULT_EXPERIENCE_ID = sakuraExperience.id;

