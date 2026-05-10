import * as migration_20260509_194459 from './20260509_194459';
import * as migration_20260510_090824_stripe_processed_events from './20260510_090824_stripe_processed_events';

export const migrations = [
  {
    up: migration_20260509_194459.up,
    down: migration_20260509_194459.down,
    name: '20260509_194459',
  },
  {
    up: migration_20260510_090824_stripe_processed_events.up,
    down: migration_20260510_090824_stripe_processed_events.down,
    name: '20260510_090824_stripe_processed_events'
  },
];
