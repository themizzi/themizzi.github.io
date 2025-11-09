# This Makefile is for my hugo project.

## ███╗   ███╗██╗███████╗███████╗██╗
## ████╗ ████║██║╚══███╔╝╚══███╔╝██║
## ██╔████╔██║██║  ███╔╝   ███╔╝ ██║
## ██║╚██╔╝██║██║ ███╔╝   ███╔╝  ██║
## ██║ ╚═╝ ██║██║███████╗███████╗██║
## ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚═╝

# Variables
HUGO ?= hugo
WRANGLER ?= npx wrangler
SYNC_TARGET ?= r2:mizzi
FORCE_DOWNLOAD ?= false
HTTP_SERVER ?= npx http-server
ENVIRONMENT ?= development
RCLONE_CONFIG ?= ./rclone.conf
CLOUDFLARE_PROJECT ?= joemizzi
CLOUDFLARE_BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)
COMMIT_HASH ?= $(if $(GITHUB_SHA),$(GITHUB_SHA),$(shell git rev-parse HEAD))

# Targets
.PHONY: all clean download-assets upload-assets pre-build build serve serve-dev deploy deploy-preview help
all: build ## Build the project.

build: pre-build ## Build the project.
	$(HUGO) --minify --gc

clean: ## Clean the project.
	rm -rf public
	rm -rf resources
	rm -rf node_modules

download-assets: ## Download assets from R2.
	rclone sync --config $(RCLONE_CONFIG) $(SYNC_TARGET) content --include "*.mp3" --include "*.ogg" --include "*.mp4"

upload-assets: ## Upload assets to R2.
	rclone sync --config $(RCLONE_CONFIG) content $(SYNC_TARGET) --include "*.mp3" --include "*.ogg" --include "*.mp4"

node_modules: package-lock.json # Install node modules.
	npm install
	@touch node_modules

pre-build: node_modules ## Pre-build tasks.

deploy: build
	$(WRANGLER) pages deploy public \
		--project-name $(CLOUDFLARE_PROJECT) \
		--branch $(CLOUDFLARE_BRANCH) \
		--commit-hash $(COMMIT_HASH) \

serve: pre-build download-assets ## Serve the project.
	$(HUGO) --environment $(ENVIRONMENT) serve

serve-dev: pre-build ## Serve the project in development mode with Hugo's built-in server.
	$(HUGO) serve --buildDrafts --buildFuture --disableFastRender --ignoreCache --watch

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:/ {exit} /^## / {gsub(/^## /, ""); print}' $(MAKEFILE_LIST)
	@echo "Available commands:"; \
	    grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-20s\033[0m %s\n", $$1, $$2}'
