export const VISIBILITIES = ['everyone', 'contacts', 'nobody'] as const;
export type EVisibility = (typeof VISIBILITIES)[number];
