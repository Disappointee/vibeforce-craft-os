# =============================================================================
# Vibeforce Flow OS — Backend Dockerfile (PocketBase)
# =============================================================================

FROM alpine:latest

ARG PB_VERSION=0.37.5

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    nodejs \
    wget \
    curl

# Download and extract PocketBase binary
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && rm /tmp/pb.zip

# Copy migrations, hooks and scripts
COPY ./pb_migrations /pb/pb_migrations
COPY ./pb_hooks /pb/pb_hooks
COPY ./entrypoint.sh /pb/entrypoint.sh
COPY ./seed_first_run.js /pb/seed_first_run.js
RUN chmod +x /pb/entrypoint.sh /pb/pocketbase

# Create pb_data directory for SQLite persistence
RUN mkdir -p /pb/pb_data

EXPOSE ${PORT:-8080}

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:${PORT:-8080}/api/health || exit 1

ENTRYPOINT ["/pb/entrypoint.sh"]
