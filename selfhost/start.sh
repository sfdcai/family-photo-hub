#!/bin/sh
# UI (server-rendered pages) on 3000, API + proxy on 8080.
PORT=3000 HOST=127.0.0.1 node /srv/ui/server/index.mjs &
exec node /srv/server/src/index.mjs
