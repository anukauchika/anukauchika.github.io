# GA4 Drill Entry Audit

## Drill-start paths

| Entry path | Before drill navigation | When drill page initializes | Parameters |
|---|---|---|---|
| Root CTA “Practice Writing & Reading” → `/chinese/` → Drill | `root_land_core_clicked` | `drill_started` | Root event: `{ target: "app_main" }`. Drill event: `{ drill_type, dataset_id, group_id, authenticated, ...attribution }` |
| User opens `/chinese/` directly → Drill | None | `drill_started` | `{ drill_type, dataset_id, group_id, authenticated, ...attribution }` |
| Root dataset “Practice Online” link → `/chinese/?dataset=…` → Drill | `root_land_auxi_clicked` | `drill_started` | Root event: `{ target: "practice_app" }`. Drill event: `{ drill_type, dataset_id, group_id, authenticated, ...attribution }` |
| After Google/email registration → `/chinese/` → Drill | `login` after auth restoration | `drill_started` | Login: `{ method: "google" \| "email", ...attribution }`. Drill event as above |
| Queue item → drill | None | `drill_started` | Drill event as above; URL also has `from=queue`, but that is not included in the event |
| Direct drill URL | None | `drill_started` | Drill event as above |
| Printable worksheet “Practice Online” | `print_land_auxi_clicked` | `drill_started` | Print event: `{ target: "practice_drill", collection? }`; drill event includes attribution |
| Other blog/HSK links → `/chinese/` → Drill | None | `drill_started` | Drill event only |

`drill_started` is emitted in `src/2_svc/kind/chinese/drill.ts` by `initDrill()`, after dataset/group validation and, for authenticated users, after local progress loading. It therefore fires on the drill destination page, not in the initiating click handler.

The drill event contains:

```text
drill_type
dataset_id
group_id
authenticated
utm_source? / utm_medium? / utm_campaign? / utm_content? / utm_term? / gclid?
```

## `root_land_core_clicked`

In current code, `target` has exactly one possible value:

```text
app_main
```

The only sender is the root “Practice Writing & Reading” CTA in `src/routes/(home)/+page.svelte`.

`target=trial_drill` is never sent by current code. It existed before commit `fb14ac4`, when the root CTA linked directly to:

- Desktop: elementary group 1 pinyin drill.
- Mobile: elementary group 1 hanzi drill.

That behavior was removed when the CTA was changed to open `/chinese/`.

Many drills start without `root_land_core_clicked`:

- Direct `/chinese/` visits.
- Root dataset links.
- Queue items.
- Printable worksheets.
- Blog and HSK links.
- Direct drill URLs.
- Post-registration Drill clicks.

Even the current root CTA does not mean a drill started. It records only entry into the app. The later Drill click has no corresponding root event.

## Navigation and delivery

- Root landing events fire synchronously inside anchor `onclick` handlers, immediately before navigation.
- They call `gtag('event', ...)`, which pushes into `dataLayer`; there is no event callback or navigation delay.
- `transport_type: "beacon"` is not configured in global GA configuration or individual events.
- Delivery is therefore not guaranteed by application code. If navigation causes a full unload before gtag processes and sends the queued event, it could be lost.
- Normal hydrated SvelteKit internal navigation reduces this risk because it is client-side, but the code does not explicitly guarantee delivery.
- `drill_started` is safer with respect to entry navigation because it fires after navigation on the destination page. A later immediate departure could still happen before GA sends it.

## Gaps

- No dedicated event fires on the `/chinese/` Drill click.
- No `entry_path` or `from` parameter is included in `drill_started`.
- `root_land_core_clicked` measures app entry, not drill start.
- No explicit beacon transport or event-callback navigation handling exists.
- Registration redirects to `/chinese/`; it does not automatically resume or start the drill that opened the sign-in modal.
