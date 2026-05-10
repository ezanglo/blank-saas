import * as migration_20260509_194459 from './20260509_194459';
import * as migration_20260510_090824_stripe_processed_events from './20260510_090824_stripe_processed_events';
import * as migration_20260510_140211_permissions_resource_indexes from './20260510_140211_permissions_resource_indexes';
import * as migration_20260510_164128_sso_providers from './20260510_164128_sso_providers';

export const migrations = [
  {
    up: migration_20260509_194459.up,
    down: migration_20260509_194459.down,
    name: '20260509_194459',
  },
  {
    up: migration_20260510_090824_stripe_processed_events.up,
    down: migration_20260510_090824_stripe_processed_events.down,
    name: '20260510_090824_stripe_processed_events',
  },
  {
    up: migration_20260510_140211_permissions_resource_indexes.up,
    down: migration_20260510_140211_permissions_resource_indexes.down,
    name: '20260510_140211_permissions_resource_indexes',
  },
  {
    up: migration_20260510_164128_sso_providers.up,
    down: migration_20260510_164128_sso_providers.down,
    name: '20260510_164128_sso_providers',
  },
];
