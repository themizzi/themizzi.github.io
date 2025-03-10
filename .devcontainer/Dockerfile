# Update the NODE_VERSION arg in docker-compose.yml to pick a Node version: 18, 16, 14
ARG NODE_VERSION=20
FROM mcr.microsoft.com/devcontainers/javascript-node:${NODE_VERSION} AS dev

# VARIANT can be either 'hugo' for the standard version or 'hugo_extended' for the extended version.
ARG HUGO_VARIANT=hugo
# VERSION can be either 'latest' or a specific version number
ARG HUGO_VERSION=0.144.2

# Download Hugo
RUN export ARCH=$(uname -m | sed -e 's/aarch64/arm64/' -e 's/x86_64/amd64/') \
    && wget https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_VARIANT}_${HUGO_VERSION}_linux-${ARCH}.deb \
    && dpkg -i ${HUGO_VARIANT}_${HUGO_VERSION}_linux-${ARCH}.deb \
    && rm ${HUGO_VARIANT}_${HUGO_VERSION}_linux-${ARCH}.deb

# Install additional packages
RUN apt-get update && apt-get install -y stow zsh-antigen awscli inotify-tools rclone

# Install starship prompt
RUN sh -c "$(curl -fsSL https://starship.rs/install.sh)" -- --bin-dir /usr/local/bin -y

# Install doctl
ARG DOCTL_VERSION=1.120.1
ARG DOCTL_ARCH=amd64
RUN wget https://github.com/digitalocean/doctl/releases/download/v${DOCTL_VERSION}/doctl-${DOCTL_VERSION}-linux-${DOCTL_ARCH}.tar.gz \
    && tar xf doctl-${DOCTL_VERSION}-linux-${DOCTL_ARCH}.tar.gz \
    && mv doctl /usr/local/bin \
    && rm doctl-${DOCTL_VERSION}-linux-${DOCTL_ARCH}.tar.gz

# Remove default .zshrc
RUN rm /home/node/.zshrc

# ZSH storage
RUN mkdir -p /home/node/.zsh
RUN chown node:node /home/node/.zsh
VOLUME [ "/home/node/.zsh" ]

# Hugo dev server port
EXPOSE 1313

USER node

FROM dev AS build

COPY --chown=node:node ./ /workspace
WORKDIR /workspace
RUN make build
