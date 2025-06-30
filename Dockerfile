ARG IMAGE_TAG=${IMAGE_TAG:-latest}
FROM ghcr.io/themizzi/themizzi.github.io/devcontainer:${IMAGE_TAG} AS source
COPY --chown=node:node ./ /workspace
WORKDIR /workspace
RUN make build
