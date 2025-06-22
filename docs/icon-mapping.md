# Icon Mapping System

This site uses a centralized icon mapping system to handle FontAwesome icons for various services. This makes it easy to configure and maintain icon mappings across the entire site.

## How it works

The system consists of:

1. **Data file**: `/data/icons.yaml` - Contains the mapping of service keys to FontAwesome icons
2. **Partial template**: `/layouts/partials/service-icon.html` - Renders the appropriate icon based on the service key

## Usage

To use the icon mapping in a template:

```html
{{ partial "service-icon.html" "discogs" }}
```

This will render the appropriate FontAwesome icon for the "discogs" service.

## Adding new services

To add a new service icon mapping:

1. Edit `/data/icons.yaml`
2. Add a new entry with the service key and icon details:

   ```yaml
   newservice:
     class: "fab"  # or "fas" or "far"
     icon: "icon-name"
   ```

3. The icon will automatically be available throughout the site

## Examples

Current mappings in `/data/icons.yaml`:

* `discogs` → `<i class="fas fa-record-vinyl"></i>`

## Fallback behavior

If a service key is not found in the mapping, the system falls back to:

```html
<i class="fab fa-{service-key}"></i>
```

This allows for automatic support of standard FontAwesome brand icons that don't need special handling.
