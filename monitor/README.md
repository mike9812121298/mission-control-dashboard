# Independent commerce monitoring

Runs hourly at minute17 on a standard GitHub-hosted runner in this public repository. Uses no advertising/store credentials. Checks both public websites plus four GT40 public in-stock offers and creates unpaid checkout URLs. No customer data or orders. Existing dashboard content is untouched.

A PASS does not prove payment UI, fulfillment, attribution, profitability or all-product coverage. A connection-verification screen is UNKNOWN/failure, never a price or stock conclusion. One delayed retry reduces transient false alarms. Logs and job summaries contain only public URLs and check results; no sales, inventory counts, credentials or cart tokens. No artifact storage or external sender is added.

Standard GitHub-hosted runners are free for public repositories. Schedules can be delayed or disabled after inactivity; the PC health index must separately check workflow enabled state and freshness, and cloud failure notification delivery is not assumed from a job result.

The existing local collector publishes only its oldest successful collection timestamp to a repository variable. Cloud runs fail if that heartbeat is missing, from the future, or older than95minutes. This proves execution freshness, not healthy ads or notification delivery. No store/ad credentials or metrics are published.
