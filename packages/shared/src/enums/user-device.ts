export const DEVICE_TYPES = ['web', 'android', 'ios', 'desktop'] as const;
export type EDeviceType = (typeof DEVICE_TYPES)[number];
