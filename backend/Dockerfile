FROM alpine:latest

ARG PB_VERSION=0.37.5

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    nodejs \
    wget

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# copy migrations and hooks
COPY ./pb_migrations /pb/pb_migrations
COPY ./pb_hooks /pb/pb_hooks

# copy seed scripts
COPY ./entrypoint.sh /pb/entrypoint.sh
COPY ./seed_first_run.js /pb/seed_first_run.js
RUN chmod +x /pb/entrypoint.sh

# create pb_data directory (mount point for Railway volume)
RUN mkdir -p /pb/pb_data

EXPOSE ${PORT:-8080}

ENTRYPOINT ["/pb/entrypoint.sh"]
