FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/src/utils ./src/utils
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/firebase-applet-config.json ./
COPY --from=builder /app/server.ts ./

EXPOSE 3000

CMD ["tsx", "server.ts"]
