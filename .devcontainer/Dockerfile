# Update the NODE_VERSION arg in docker-compose.yml to pick a Node version: 18, 16, 14
ARG NODE_VERSION=24
FROM mcr.microsoft.com/devcontainers/javascript-node:${NODE_VERSION} AS dev

# VARIANT can be either 'hugo' for the standard version or 'hugo_extended' for the extended version.
ARG HUGO_VARIANT=hugo
# VERSION can be either 'latest' or a specific version number
ARG HUGO_VERSION=0.144.2
ARG GCM_VERSION=2.8.0

# Download Hugo
RUN export ARCH=$(uname -m | sed -e 's/aarch64/arm64/' -e 's/x86_64/amd64/') \
    && wget https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_VARIANT}_${HUGO_VERSION}_linux-${ARCH}.deb \
    && dpkg -i ${HUGO_VARIANT}_${HUGO_VERSION}_linux-${ARCH}.deb \
    && rm ${HUGO_VARIANT}_${HUGO_VERSION}_linux-${ARCH}.deb

# Install gh cli repo
RUN sudo mkdir -p -m 755 /etc/apt/keyrings \
	&& out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
	&& cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
	&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
	&& sudo mkdir -p -m 755 /etc/apt/sources.list.d \
	&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
	&& sudo apt update \
	&& sudo apt install gh -y

# Install additional packages
RUN apt-get update && apt-get install -y \
    stow \
    zsh-antigen \
    awscli \
    inotify-tools \
    rclone \
    ffmpeg \
    pup \
    jq \
    gh \
    openjdk-21-jre \
    tidy \
    ripgrep

# Install Git Credential Manager and use Git's in-memory cache store, which
# works in this headless devcontainer without requiring a desktop keychain.
RUN arch="$(dpkg --print-architecture)" \
    && case "${arch}" in \
        amd64) gcm_arch="x64" ;; \
        arm64) gcm_arch="arm64" ;; \
        *) echo "Unsupported architecture for Git Credential Manager: ${arch}" >&2; exit 1 ;; \
    esac \
    && wget -nv "https://github.com/git-ecosystem/git-credential-manager/releases/download/v${GCM_VERSION}/gcm-linux-${gcm_arch}-${GCM_VERSION}.deb" -O /tmp/gcm.deb \
    && dpkg -i /tmp/gcm.deb \
    && rm /tmp/gcm.deb \
    && git-credential-manager configure --system \
    && git config --system credential.credentialStore cache

# Install vnu
RUN npm install -g vnu-jar

# Install playwright dependencies
RUN npx playwright install-deps

# Install starship prompt
RUN sh -c "$(curl -fsSL https://starship.rs/install.sh)" -- --bin-dir /usr/local/bin -y

# Remove default .zshrc
RUN rm /home/node/.zshrc

# ZSH storage
RUN mkdir -p /home/node/.zsh
RUN chown node:node /home/node/.zsh
VOLUME [ "/home/node/.zsh" ]

# Hugo dev server port
EXPOSE 1313

USER node
