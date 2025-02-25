# This Makefile is for my hugo project.

## ███╗   ███╗██╗███████╗███████╗██╗
## ████╗ ████║██║╚══███╔╝╚══███╔╝██║
## ██╔████╔██║██║  ███╔╝   ███╔╝ ██║
## ██║╚██╔╝██║██║ ███╔╝   ███╔╝  ██║
## ██║ ╚═╝ ██║██║███████╗███████╗██║
## ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚═╝

# Variables
HUGO = hugo
S3_BUCKET = s3://mizzi
ASSETS_DIR = buckets/mizzi
ENDPOINT = https://1315a13ee50e2f40227a7d7737ec39ca.r2.cloudflarestorage.com
FORCE_DOWNLOAD = false
HTTP_SERVER = npx http-server
ENVIRONMENT = development

# Targets
.PHONY: all clean download-assets upload-assets pre-build build pagefind serve help
all: build ## Build the project.

build: pre-build ## Build the project.
	$(HUGO) --minify --gc
	$(MAKE) pagefind

clean: ## Clean the project.
	$(HUGO) clean
	rm -rf public
	rm -rf resources
	rm -rf node_modules

download-assets: ## Download assets from R2.
	@mkdir -p $(ASSETS_DIR)
	@if [ "$(FORCE_DOWNLOAD)" = "true" ] || [ $$(find $(ASSETS_DIR) -type f ! -name '.gitkeep' | wc -l) -eq 0 ]; then \
		aws s3 sync $(S3_BUCKET) $(ASSETS_DIR) --endpoint-url $(ENDPOINT) --delete; \
	fi

upload-assets: ## Upload assets to R2.
	aws s3 sync $(ASSETS_DIR) $(S3_BUCKET) --endpoint-url $(ENDPOINT) --delete

node_modules: package-lock.json # Install node modules.
	npm install
	@touch node_modules

pre-build: node_modules ## Pre-build tasks.

pagefind: ## Build the pagefind index.
	@if [ "$(WATCH)" = "true" ]; then \
		echo "Watching for changes in the public directory..."; \
		while inotifywait -r -e modify,create,delete,move --exclude 'public/pagefind' public; do \
			echo "Rebuilding pagefind index..."; \
			npx -y pagefind --site public; \
		done; \
	else \
		npx -y pagefind --site public; \
	fi

serve: pre-build download-assets ## Serve the project.
	@trap 'kill 0' EXIT; \
	$(HTTP_SERVER) -p 8080 -i false -d false $(ASSETS_DIR) & \
	$(HUGO) --environment $(ENVIRONMENT) serve & \
	$(MAKE) WATCH=true pagefind & \
	wait

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:/ {exit} /^## / {gsub(/^## /, ""); print}' $(MAKEFILE_LIST)
	@echo "Available commands:"; \
	    grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-20s\033[0m %s\n", $$1, $$2}'

