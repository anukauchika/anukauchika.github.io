# Funnel Analytics

## Setup

- GA4 measurement ID: `G-ELKSNFMX2R`
- Link the GA4 property to Google Ads.
- Configure primary conversions: `sign_up`, `sign_up_after_drill`.
- Configure secondary metrics: `drill_started`, `drill_completed`, `sign_in`, `sign_in_after_drill`.
- Register `source`, `method`, `drill_type`, `dataset_id`, `group_id`, and `authenticated` as GA4 custom dimensions.
- Keep `drilled` and `skipped` as custom metrics.

## Events

| Event | Parameters | Meaning |
|---|---|---|
| `page_view` | GA4 defaults | Page reached |
| `root_land_viewed` | — | Root landing viewed |
| `root_land_core_clicked` | `target` | Main root CTA clicked |
| `root_land_auxi_clicked` | `target` | Secondary root CTA clicked |
| `print_land_viewed` | `collection` | Printable landing viewed |
| `print_land_core_clicked` | `target`, `collection` | Print action clicked |
| `print_land_auxi_clicked` | `target`, `collection` | Printable secondary CTA clicked |
| `drill_started` | `source`, `drill_type`, `dataset_id`, `group_id`, `authenticated` | Valid drill opened |
| `drill_completed` | drill-start parameters + `drilled`, `skipped` | Drill reached completion |
| `sign_up` | `method`, `source?` | New account outside a completed drill |
| `sign_in` | `method`, `source?` | Existing account outside a completed drill |
| `sign_up_after_drill` | `source`, `method`, `drill_type`, `dataset_id`, `group_id` | New account after anonymous drill |
| `sign_in_after_drill` | `source`, `method`, `drill_type`, `dataset_id`, `group_id` | Existing account after anonymous drill |

## Parameter Values

| Parameter | Values |
|---|---|
| `source` | `app_main`, `printable`, `queue`, `direct` |
| `method` | `google`, `email`; `apple` is service-supported but not in the current UI |
| `drill_type` | `stroke`, `pinyin` |
| `authenticated` | `true`, `false` |
| `root target` | `app_main`, `printables`, `practice_app`, `hsk_words`, `blog` |
| `print target` | `print_worksheet`, `practice_drill`, `practice_app`, `method`, `group`, `related_collection`, `root` |
| `collection` | `hsk_elementary`, `hsk_intermediate`, `hsk_advanced` |

Drill and authentication events include stored acquisition parameters when available:

`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`.

Landing events use GA4's native session acquisition context instead of explicit UTM event parameters.

## Funnel Paths

```text
Ad → page_view → root_land_* → /chinese/ page_view
Ad → page_view → print_land_* → printable action

App → drill_started(source=app_main) → drill_completed
Printable Practice Online → drill_started(source=printable) → drill_completed
Queue → drill_started(source=queue) → drill_completed
Direct URL → drill_started(source=direct) → drill_completed

/chinese/ → sign_up(source=app_main) | sign_in(source=app_main)
Anonymous drill → drill_completed → sign_up_after_drill | sign_in_after_drill
```

## Reporting

- Cost per signup: ad spend / (`sign_up` + `sign_up_after_drill`).
- Lesson start rate: `drill_started` / relevant landing views.
- Lesson completion rate: `drill_completed` / `drill_started`.
- Post-drill signup rate: `sign_up_after_drill` / anonymous `drill_completed`.
- Activation: authenticated `drill_started` after signup.
- Filter by `source`, campaign, drill type, dataset, and group.

## Notes

- Localhost analytics is disabled.
- Normal session restoration emits no sign-in event.
- Pending authentication attribution expires after one hour.
- The latest captured acquisition parameters persist in local and session storage.
- `drill_completed` may include fully skipped drills; use `drilled` and `skipped` when measuring lesson quality.
