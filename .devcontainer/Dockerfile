# Update the NODE_VERSION arg in docker-compose.yml to pick a Node version: 18, 16, 14
ARG NODE_VERSION=20
FROM mcr.microsoft.com/devcontainers/javascript-node:${NODE_VERSION}

# VARIANT can be either 'hugo' for the standard version or 'hugo_extended' for the extended version.
ARG VARIANT=hugo
# VERSION can be either 'latest' or a specific version number
ARG HUGO_VERSION=latest

# Download Hugo
RUN apt-get update && apt-get install -y ca-certificates openssl git curl && \
    rm -rf /var/lib/apt/lists/* && \
    case ${HUGO_VERSION} in \
    latest) \
    export HUGO_VERSION=$(curl -s https://api.github.com/repos/gohugoio/hugo/releases/latest | grep "tag_name" | awk '{print substr($2, 3, length($2)-4)}') ;;\
    esac && \
    echo ${HUGO_VERSION} && \
    case $(uname -m) in \
    aarch64) \
    export ARCH=ARM64 ;; \
    *) \
    export ARCH=64bit ;; \
    esac && \
    echo ${ARCH} && \
    wget -O ${HUGO_VERSION}.tar.gz https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${VARIANT}_${HUGO_VERSION}_Linux-${ARCH}.tar.gz && \
    tar xf ${HUGO_VERSION}.tar.gz && \
    mv hugo /usr/bin/hugo

# Hugo dev server port
EXPOSE 1313

# Install additional packages
RUN apt-get update && apt-get install -y stow zsh-antigen

# Install starship prompt
RUN sh -c "$(curl -fsSL https://starship.rs/install.sh)" -- --bin-dir /usr/local/bin -y

# Remove default .zshrc
RUN rm /home/node/.zshrc
