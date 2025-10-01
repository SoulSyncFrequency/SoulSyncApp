# Feature Flags

Two ways to enable flags:

1) Individual env vars
```
FEATURE_NEW_AUTH=on
FEATURE_BETA_UI=true
```

2) JSON map
```
FEATURE_FLAGS={"newAuth":true,"betaUI":false}
```

In code:
```ts
import { isEnabled, gateFeature } from './src/config/flags'

if (isEnabled('newAuth')) { /* ... */ }

// or protect a route
app.use('/experimental', gateFeature('betaUI'), experimentalRouter)
```
