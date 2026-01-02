---
applyTo: events/**/*.md
---

Please include a flyer for the event. If not found on any provided link, please try searching for it online. If none is found, then do not put a placeholder.

Please include the event location and create a new entry in `locations` if one does not already exist.

Please include the event date in the `doors` date field.

Please put the current date in the `date` field in the format `YYYY-MM-DDTHH:MM:SS-05:00` with a time of `00:00:00`.

Please include a list of artists performing at the event in the `artists` field. If an artist does not already exist in the `artists` folder, please create a new entry for them.

## Festival/Multi-Day Events

For events that are part of a multi-day festival where the specific performance date/time is not yet known:

- Use `super_event_start` and `super_event_end` for the festival's overall date range (format: `YYYY-MM-DDTHH:MM:SS±HH:MM`)
- Use `super_event_name` for the festival name (e.g., "Pouzza Fest")
- Use `super_event_url` for the festival's website URL
- Use `super_event_city` for the festival location (e.g., "Montreal, QC")
- Omit the `doors` field if the specific performance date/time is TBA
- Use an empty array `locations = []` if the venue is TBA

If the specific performance date/time becomes known, add the `doors` field. The festival information will still be displayed as context.

## Location Fields

When creating a new location entry in `content/locations/`:

- Required: `address`, `city`, `state`, `title`
- Optional: `country` (only include for non-USA venues, e.g., "Canada")
