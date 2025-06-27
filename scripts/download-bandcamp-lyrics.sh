#!/bin/bash

# Bandcamp Lyrics Downloader
# 
# This script downloads lyrics from individual track pages on Bandcamp
# and updates the corresponding track _index.md files in Hugo content.

set -e  # Exit on error

# Message type constants
readonly MSG_STATUS="status"
readonly MSG_INFO="info"
readonly MSG_SUCCESS="success"
readonly MSG_WARNING="warning"
readonly MSG_ERROR="error"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local type="$1"
    local message="$2"
    
    # Define colors and labels for each message type
    local -A colors=([status]="$BLUE" [info]="$BLUE" [success]="$GREEN" [warning]="$YELLOW" [error]="$RED")
    local -A labels=([status]="INFO" [info]="INFO" [success]="SUCCESS" [warning]="WARNING" [error]="ERROR")
    
    # Use the color and label if type is known, otherwise plain text
    if [[ -n "${colors[$type]}" ]]; then
        echo -e "${colors[$type]}[${labels[$type]}]${NC} $message"
    else
        echo "$message"  # fallback for unknown types
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 <bandcamp_album_url> [album_directory] [--dry-run]

Arguments:
  bandcamp_album_url  The Bandcamp album URL (e.g., https://themizzerables.com/album/album-name)
  album_directory     Optional: path to the album directory in content/discography/
                     If not provided, will be inferred from the URL
  --dry-run          Optional: only show the track URLs that would be processed

Examples:
  $0 https://themizzerables.com/album/every-last-stitch
  $0 https://themizzerables.com/album/every-last-stitch /workspaces/themizzi.github.io/content/discography/every-last-stitch
  $0 https://themizzerables.com/album/every-last-stitch --dry-run

Requirements:
  - curl (for downloading pages)
  - pup (for HTML parsing)
  - jq (for JSON processing)
EOF
}

# Function to extract track URLs from album page
get_track_urls() {
    local album_url="$1"
    print_message "$MSG_STATUS" "Fetching album page: $album_url" >&2
    
    # Download the album page and extract track URLs from JSON-LD structured data
    # Use pup to extract JSON-LD script content, then jq to parse and extract track URLs
    local urls=$(curl -s "$album_url" | \
        pup 'script[type="application/ld+json"] text{}' | \
        jq -r '.track.itemListElement[]?.item["@id"] // empty' 2>/dev/null)
    
    echo "$urls"
}

# Function to extract lyrics from track page (using JSON-LD)
extract_lyrics() {
    local track_url="$1"
    
    # Extract lyrics from JSON-LD structured data using pup and jq
    local lyrics=$(curl -s "$track_url" | \
        pup 'script[type="application/ld+json"] text{}' | \
        jq -r '.recordingOf.lyrics.text // empty' 2>/dev/null)
    
    echo "$lyrics"
}

# Function to get track title from URL or page
get_track_title() {
    local track_url="$1"
    local title=""
    
    # Try to extract title from JSON-LD structured data using pup and jq
    title=$(curl -s "$track_url" | \
        pup 'script[type="application/ld+json"] text{}' | \
        jq -r '.name // empty' 2>/dev/null)

    echo "$title"
}

# Function to find corresponding track directory
find_track_directory() {
    local album_dir="$1"
    local track_title="$2"
    local track_number="$3"
    
    # Try to find by track number first
    local track_dir=$(find "$album_dir" -maxdepth 1 -type d -name "$(printf "%02d" $track_number)-*" | head -1)
    
    if [ -n "$track_dir" ]; then
        echo "$track_dir"
        return 0
    fi
    
    track_dir=$(find "$album_dir" -maxdepth 1 -type d -name "*${normalized_title}*" | head -1)
    
    if [ -n "$track_dir" ]; then
        echo "$track_dir"
        return 0
    fi
    
    return 1
}

# Function to update track file with lyrics
update_track_lyrics() {
    local track_dir="$1"
    local lyrics="$2"
    local track_file="${track_dir}/_index.md"
    
    if [ ! -f "$track_file" ]; then
        print_message "$MSG_ERROR" "Track file not found: $track_file"
        return 1
    fi
    
    # Create a temporary file with the updated content
    local temp_file=$(mktemp)
    
    # Read the file and add lyrics section after front matter
    awk -v lyrics="$lyrics" '
        BEGIN { in_frontmatter = 0; frontmatter_ended = 0; lyrics_added = 0 }
        /^\+\+\+/ { 
            if (!frontmatter_ended) {
                in_frontmatter = !in_frontmatter
                if (!in_frontmatter) {
                    frontmatter_ended = 1
                    print
                    print ""
                    print "## Lyrics"
                    print ""
                    print lyrics
                    lyrics_added = 1
                    next
                }
            }
            print
            next
        }
        frontmatter_ended && !lyrics_added && /^## / {
            print "## Lyrics"
            print ""
            print lyrics
            print ""
            lyrics_added = 1
        }
        { print }
        END {
            if (frontmatter_ended && !lyrics_added) {
                print ""
                print "## Lyrics"
                print ""
                print lyrics
            }
        }
    ' "$track_file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$track_file"
    print_message "$MSG_SUCCESS" "Updated lyrics in: $track_file"
}

# Main function
main() {
    # Check arguments
    if [ $# -lt 1 ]; then
        print_message "$MSG_ERROR" "Missing required argument: bandcamp_album_url"
        show_usage
        exit 1
    fi
    
    local album_url="$1"
    local album_dir="$2"
    local dry_run=false
    
    # Check for dry-run flag
    if [[ "$2" == "--dry-run" ]] || [[ "$3" == "--dry-run" ]]; then
        dry_run=true
    fi
    
    # Infer album directory if not provided (only needed for actual processing)
    if [ -z "$album_dir" ] && [ "$dry_run" = false ]; then
        local album_name="${album_url##*/album/}"
        album_dir="/workspaces/themizzi.github.io/content/discography/$album_name"
        print_message "$MSG_STATUS" "Inferred album directory: $album_dir"
    fi
    
    # Check if album directory exists (only for actual processing)
    if [ "$dry_run" = false ] && [ ! -d "$album_dir" ]; then
        print_message "$MSG_ERROR" "Album directory not found: $album_dir"
        exit 1
    fi
    
    print_message "$MSG_STATUS" "Starting lyrics download for album: $album_url"
    if [ "$dry_run" = false ]; then
        print_message "$MSG_STATUS" "Target directory: $album_dir"
    fi
    
    # Get track URLs
    local track_urls=$(get_track_urls "$album_url")
    
    if [ -z "$track_urls" ]; then
        print_message "$MSG_ERROR" "No track URLs found on album page"
        exit 1
    fi
    
    print_message "$MSG_STATUS" "Found $(echo "$track_urls" | wc -l) track(s)"
    
    # If dry-run, show the URLs, lyrics, and file modifications that would be made
    if [ "$dry_run" = true ]; then
        print_message "$MSG_STATUS" "Track URLs and modifications that would be processed:"
        local album_name="${album_url##*/album/}"
        local album_dir="/workspaces/themizzi.github.io/content/discography/$album_name"
        
        local track_count=1
        echo "$track_urls" | while IFS= read -r track_url; do
            [ -z "$track_url" ] && continue
            echo ""
            echo "Track $track_count: $track_url"
            
            # Get track title
            local track_title=$(get_track_title "$track_url")
            echo "Title: $track_title"
            
            # Find corresponding track directory
            local track_dir=$(find_track_directory "$album_dir" "$track_title" "$track_count")
            
            if [ -n "$track_dir" ]; then
                echo "File: $track_dir/_index.md"
                
                # Extract lyrics
                local lyrics=$(extract_lyrics "$track_url")
                
                if [ -n "$lyrics" ]; then
                    echo "Modification: Would add ## Lyrics section with lyrics content"
                    echo "----------------------------------------"
                    echo "## Lyrics"
                    echo ""
                    echo "$lyrics"
                    echo "----------------------------------------"
                else
                    echo "Modification: [No lyrics found - no changes would be made]"
                fi
            else
                echo "File: [Could not find corresponding track directory]"
            fi
            
            track_count=$((track_count + 1))
        done
        exit 0
    fi
    
    # Process each track
    local track_count=1
    while IFS= read -r track_url; do
        [ -z "$track_url" ] && continue
        
        print_message "$MSG_STATUS" "Processing track $track_count: $track_url"
        
        # Get track title
        local track_title=$(get_track_title "$track_url")
        print_message "$MSG_STATUS" "Track title: $track_title"
        
        # Extract lyrics
        local lyrics=$(extract_lyrics "$track_url")
        
        if [ -z "$lyrics" ]; then
            print_message "$MSG_WARNING" "No lyrics found for track: $track_title"
            track_count=$((track_count + 1))
            continue
        fi
        
        # Find corresponding track directory
        local track_dir=$(find_track_directory "$album_dir" "$track_title" "$track_count")
        
        if [ -z "$track_dir" ]; then
            print_message "$MSG_WARNING" "Could not find track directory for: $track_title"
            track_count=$((track_count + 1))
            continue
        fi
        
        # Update track file with lyrics
        update_track_lyrics "$track_dir" "$lyrics"
        
        track_count=$((track_count + 1))
        
        # Small delay to be respectful to Bandcamp
        sleep 1
        
    done <<< "$track_urls"
    
    print_message "$MSG_SUCCESS" "Lyrics download completed!"
}

# Check for required tools
check_dependencies() {
    local missing_tools=()
    
    for tool in curl pup jq awk; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_message "$MSG_ERROR" "Missing required tools: ${missing_tools[*]}"
        print_message "$MSG_ERROR" "Please install the missing tools and try again."
        print_message "$MSG_ERROR" "  - curl: usually pre-installed"
        print_message "$MSG_ERROR" "  - pup: go install github.com/ericchiang/pup@latest"
        print_message "$MSG_ERROR" "  - jq: apt install jq (or brew install jq on macOS)"
        exit 1
    fi
}

# Run dependency check and main function
check_dependencies
main "$@"
