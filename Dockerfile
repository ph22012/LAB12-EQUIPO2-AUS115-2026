FROM node:18-alpine

WORKDIR /app

# Copiar dependencias e instalarlas
COPY package*.json ./
RUN npm install

# Copiar el codigo fuente
COPY . .

EXPOSE 4000

CMD ["node", "server.js"]