# Runtime image used by the Base44 dev stack.
# Only the package manager is installed here; the repository is bind-mounted
# at /app by docker-compose.base44.yml so source edits are picked up live.
FROM node:24-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app
