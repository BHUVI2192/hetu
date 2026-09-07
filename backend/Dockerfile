FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json prisma/ ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist /app/node_modules /app/prisma /app/package.json ./
EXPOSE 4000
CMD ["sh","-c","npx prisma migrate deploy && node dist/main"]
