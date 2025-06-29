# Mizzi Hugo Theme

A clean, modern Hugo theme designed for musicians and technologists.

## Features

* Responsive design that works on all devices
* Dark/light/system theme support with persistent selection
* Built-in support for music content (artists, albums, tracks, events)
* Social media integration
* Search functionality
* RSS feeds
* Configurable profile images

## Configuration

### Profile Images

The theme supports a configurable profile image that falls back to a placeholder if not provided. Hugo will automatically resize the image as needed:

```toml
# config/_default/params.toml

# Profile image (optional)
profile_image = "images/profile.png"    # Hugo will resize this as needed (minimum 400x400px recommended)
```

If this parameter is not set or the image doesn't exist, the theme will automatically use placeholder images.

### Mastodon Verification

The theme supports Mastodon verification via the `rel="me"` link attribute:

```toml
# config/_default/params.toml

# Mastodon verification link (optional)
mastodon_url = "https://mastodon.social/@yourusername"
```

If this parameter is not set, no Mastodon verification link will be included.

### Profile Image Setup

1. Place your profile image in your site's `assets/images/` directory (minimum 400x400px recommended)
2. Configure the path in your `params.toml` file
3. The theme will automatically resize it for:
   * Homepage profile picture (120x120px)
   * Social media meta tags (400x400px)
   * Any page without a specific featured image

### Social Links

```toml
# config/_default/params.toml

[[social_links]]
name = "github"
href = "https://github.com/yourusername"
order = 100

[[social_links]]
name = "linkedin" 
href = "https://linkedin.com/in/yourusername"
order = 200
```

### Search Configuration

```toml
# config/_default/params.toml

[search]
excludedTypes = ["credit"]  # Content types to exclude from search
```

## Content Types

The theme includes custom content types for music-related content:

* `artists/` - Artist profiles
* `albums/` - Album information with track listings
* `tracks/` - Individual track pages
* `events/` - Concert and event listings
* `locations/` - Venue information
* `roles/` - Musical roles and credits

## Development

This theme uses Hugo's asset pipeline for processing CSS and JavaScript. Make sure you have Hugo Extended version installed for Sass processing.

## License

This theme is released under the MIT License.
