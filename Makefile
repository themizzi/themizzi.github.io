# This Makefile is for my hugo project.

## ███╗   ███╗██╗███████╗███████╗██╗
## ████╗ ████║██║╚══███╔╝╚══███╔╝██║
## ██╔████╔██║██║  ███╔╝   ███╔╝ ██║
## ██║╚██╔╝██║██║ ███╔╝   ███╔╝  ██║
## ██║ ╚═╝ ██║██║███████╗███████╗██║
## ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚═╝

# Variables
HUGO = hugo
SYNC_TARGET = r2:mizzi/content
FORCE_DOWNLOAD = false
HTTP_SERVER = npx http-server
ENVIRONMENT = development
RCLONE_CONFIG = ./rclone.conf

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
	rclone sync --config $(RCLONE_CONFIG) $(SYNC_TARGET) content --include "*.mp3" --include "*.ogg" --ignore-existing -vvv

upload-assets: ## Upload assets to R2.
	rclone sync --config $(RCLONE_CONFIG) content $(SYNC_TARGET) --include "*.mp3" --include "*.ogg"

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
