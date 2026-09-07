FROM node:20-alpine AS b
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:20-alpine
WORKDIR /app
COPY --from=b /app/.next/standalone ./
COPY --from=b /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node","server.js"]