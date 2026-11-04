import { sakuraExperience } from '../components/onepager/sakura';
import type { ExperienceDefinition } from '../lib/experience-types';

export const EXPERIENCES: ExperienceDefinition[] = [
  sakuraExperience,
];

export const DEFAULT_EXPERIENCE_ID = sakuraExperience.id;
