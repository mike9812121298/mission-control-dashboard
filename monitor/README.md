# Independent commerce monitoring

Runs hourly at minute 17 on a standard GitHub-hosted runner in this public repository. Uses no advertising or store credentials. Nine lightweight checks cover both public websites, four GT40 unpaid checkout paths and the local collector heartbeat. Seven isolated Chromium journeys exercise mobile and desktop product, cart and hosted Payment UI across both stores, with saved-vehicle and no-saved-vehicle cases. No buyer data, payment or order is submitted.

The browser matrix samples four GT40 products and NoodleBomb Original; it is not all-product coverage, payment processing, fulfillment, advertising attribution or profit proof. A connection-verification screen is UNKNOWN/failure, never an inventory conclusion. Logs contain public URLs and scoped results, never checkout session URLs, credentials, sales or customer information. Existing dashboard content is untouched.

Schedules can be delayed or disabled after inactivity. The local health index separately checks workflow state and freshness. Failure notification delivery must be verified independently from a failed job. No external sender is added.

The local collector publishes only the oldest successful timestamp across ad review, advertising assurance and commerce collection. Cloud runs fail if it is absent, future-dated or older than 95 minutes. This proves collection freshness, not healthy advertising.
