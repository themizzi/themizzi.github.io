# Search Index Format

## Overview

This document describes the format for the search index generated during the Hugo build process. The search index is designed to be simple, lightweight, and easily consumable by JavaScript on both frontend and backend.

## Design Goals

* **Simplicity**: Keep the format as simple as possible for the first iteration
* **Performance**: Minimize file size and parsing overhead
* **Flexibility**: Allow for easy consumption in JavaScript environments
* **Build Integration**: Generate automatically during Hugo build process

## Index Format

The search index will be generated as a JSON file (`search-index.json`) containing an array of page objects.

### Schema

```json
{
  "pages": [
    {
      "title": "Page Title",
      "url": "/path/to/page/",
      "content": "Full rendered text content of the page..."
    }
  ]
}
```

### Field Descriptions

* **`title`** (string): The page title (from front matter or generated)
* **`url`** (string): The relative URL path to the page
* **`content`** (string): The fully rendered text content of the page (HTML stripped)

## Implementation Notes

### Content Processing

* All HTML tags should be stripped from content
* Multiple whitespace characters should be collapsed to single spaces
* Content should be trimmed of leading/trailing whitespace
* Special characters and Unicode should be preserved for international content

### Pages to Include

* All published pages (draft: false)
* Regular content pages

### Pages to Exclude

* 404 pages
* List pages
* Admin/system pages
* Pages with excluded content types (e.g., type = 'credit')

### Content Type Exclusion

Certain content types will be excluded from the search index based on their `type` field in the front matter. The exclusion list is configured in Hugo's configuration file.

**Configuration:**
Add the following to your Hugo configuration file (`hugo.toml` or `config.toml`):

```toml
[params.search]
excludedTypes = ["credit"]
```

**Implementation:**
The Hugo template will check against the configured exclusion list:

```go
{{ $excludedTypes := site.Params.search.excludedTypes | default slice }}
{{ if not (in $excludedTypes .Type) }}
  // Include page in search index
{{ end }}
```

Additional content types can be easily added to the exclusion list by modifying the `excludedTypes` array in the configuration file.

## File Output

* **Location**: `/static/search-index.json` (so it's accessible at `/search-index.json` on the live site)
* **Format**: Minified JSON (no pretty printing for production)
* **Encoding**: UTF-8

## Usage Examples

### Frontend JavaScript

```javascript
// Fetch and load the search index
fetch('/search-index.json')
  .then(response => response.json())
  .then(searchIndex => {
    // Simple text search example
    const results = searchIndex.pages.filter(page => 
      page.title.toLowerCase().includes(query.toLowerCase()) ||
      page.content.toLowerCase().includes(query.toLowerCase())
    );
  });
```

### Node.js Backend

```javascript
const fs = require('fs');
const searchIndex = JSON.parse(fs.readFileSync('public/search-index.json', 'utf8'));

// Search implementation
function search(query) {
  return searchIndex.pages.filter(page => 
    page.title.toLowerCase().includes(query.toLowerCase()) ||
    page.content.toLowerCase().includes(query.toLowerCase())
  );
}
```

## Implementation Plan

1. Create Hugo template to generate the JSON index
2. Add build step to generate the index file
3. Test with sample content
