FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN addgroup -g 1001 -S labuser && \
    adduser -S labuser -u 1001
USER labuser

EXPOSE 3000

LABEL skyportal.lab="xss-01" \
      skyportal.managed="true"

CMD ["node", "server.js"]
