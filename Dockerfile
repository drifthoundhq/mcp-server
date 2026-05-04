FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS production

# tini: proper PID 1 — forwards signals to Node and reaps zombie processes
RUN apk add --no-cache tini

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Hand ownership of the workdir to the least-privileged built-in user
RUN chown -R node:node /app

ENV NODE_ENV=production \
    PORT=3000

USER node

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
