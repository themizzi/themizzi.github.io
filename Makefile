# This Makefile is for my hugo project.

# Variables
HUGO = hugo
S3_BUCKET = s3://joemizzi-static-assets
ASSETS_DIR = static/assets
ENDPOINT = https://nyc3.digitaloceanspaces.com
FORCE_DOWNLOAD ?= false

# Targets
.PHONY: all clean
all: build

build: pre-build
	$(HUGO) --minify --gc
	$(MAKE) pagefind

clean:
	$(HUGO) clean
	rm -rf public
	rm -rf resources
	rm -rf node_modules

download-assets:
	@mkdir -p $(ASSETS_DIR)
	@if [ "$(FORCE_DOWNLOAD)" = "true" ] || [ $$(find $(ASSETS_DIR) -type f ! -name '.gitkeep' | wc -l) -eq 0 ]; then \
		aws s3 sync $(S3_BUCKET) $(ASSETS_DIR) --endpoint-url $(ENDPOINT) --delete; \
	fi

upload-assets:
	aws s3 sync $(ASSETS_DIR) $(S3_BUCKET) --endpoint-url $(ENDPOINT) --delete

node_modules: package-lock.json
	npm install
	@touch node_modules

pre-build: download-assets node_modules

pagefind:
	@if [ "$(WATCH)" = "true" ]; then \
		echo "Watching for changes in the public directory..."; \
		while inotifywait -r -e modify,create,delete,move --exclude 'public/pagefind' public; do \
			echo "Rebuilding pagefind index..."; \
			npx -y pagefind --site public; \
		done; \
	else \
		npx -y pagefind --site public; \
	fi

serve: pre-build
	@trap 'kill 0' EXIT; \
	$(HUGO) serve & \
	$(MAKE) WATCH=true pagefind & \
	wait
