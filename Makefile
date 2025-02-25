# This Makefile is for my hugo project.

# Variables
HUGO = hugo
S3_BUCKET = s3://mizzi
ASSETS_DIR = buckets/mizzi
ENDPOINT = https://1315a13ee50e2f40227a7d7737ec39ca.r2.cloudflarestorage.com
FORCE_DOWNLOAD = false
HTTP_SERVER = npx http-server
ENVIRONMENT = development

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

pre-build: node_modules

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

serve: pre-build download-assets
	@trap 'kill 0' EXIT; \
	$(HTTP_SERVER) -p 8080 -i false -d false $(ASSETS_DIR) & \
	$(HUGO) --environment $(ENVIRONMENT) serve & \
	$(MAKE) WATCH=true pagefind & \
	wait

# Help target
help:
	@echo "Makefile for Hugo project"
	@echo ""
	@echo "Targets:"
	@echo "  all                Build the site"
	@echo "  build              Build the site"
	@echo "  clean              Clean the site"
	@echo "  download-assets    Download assets from S3"
	@echo "  upload-assets      Upload assets to S3"
	@echo "  node_modules       Install node modules"
	@echo "  pre-build          Prepare for build"
	@echo "  pagefind           Build pagefind index"
	@echo "  serve              Serve the site"
	@echo "  help               Show this help message"
	