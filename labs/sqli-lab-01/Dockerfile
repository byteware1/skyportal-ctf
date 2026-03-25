FROM node:20-alpine

WORKDIR /app

# Install build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Non-root user
RUN addgroup -g 1001 -S labuser && \
    adduser -S labuser -u 1001
USER labuser

EXPOSE 3000

# Label for SkyPortal identification
LABEL skyportal.lab="sqli-01" \
      skyportal.managed="true"

CMD ["node", "server.js"]
