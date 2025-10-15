FROM node:20-slim
WORKDIR /app

# First copy only manifests for better caching
COPY package*.json ./
RUN npm ci

# Now copy the rest of the source
COPY . .

EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"]
