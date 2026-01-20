FROM node:18

WORKDIR /app

# Install compilers needed for executing code
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    g++ \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000
CMD ["node", "server.js"]
