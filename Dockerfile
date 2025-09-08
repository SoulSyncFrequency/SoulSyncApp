# Soulsync Backend
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install || true
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm","start"]
