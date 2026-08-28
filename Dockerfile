FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3012
ENV HOSTNAME=0.0.0.0
# Auth Central: URL pública de esta app, URL del auth central y appKey registrado.
ENV NEXT_PUBLIC_APP_URL=http://localhost:3012
ENV CENTRAL_AUTH_URL=http://localhost:3100
ENV CENTRAL_APP_KEY=intra-talleres
ENV MONGODB_URI=mongodb://host.docker.internal:27017/intra_talleres
ENV MONGODB_DB=intra_talleres
ENV DBHOST_NIC=host.docker.internal
ENV DBPORT_NIC=1433
ENV DATABASE_NIC=siac
ENV DBUSER_NIC=sa
ENV DBPASS_NIC=change-this-sql-password

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3012
ENV HOSTNAME=0.0.0.0
# Auth Central: URL pública de esta app, URL del auth central y appKey registrado.
ENV NEXT_PUBLIC_APP_URL=http://localhost:3012
ENV CENTRAL_AUTH_URL=http://localhost:3100
ENV CENTRAL_APP_KEY=intra-talleres
ENV MONGODB_URI=mongodb://host.docker.internal:27017/intra_talleres
ENV MONGODB_DB=intra_talleres
ENV DBHOST_NIC=host.docker.internal
ENV DBPORT_NIC=1433
ENV DATABASE_NIC=siac
ENV DBUSER_NIC=sa
ENV DBPASS_NIC=change-this-sql-password

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3012

CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3012}"]
