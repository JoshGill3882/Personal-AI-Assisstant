# Minimal Node image with npm required for the frontend toolchain.
FROM node:20-slim
WORKDIR /app

# First copy only manifests for better caching
COPY package*.json ./
RUN npm ci

# Now copy the rest of the source
COPY . .

# Expose the Vite dev server port for interactive development.
EXPOSE 5173
# Default command runs Vite in dev mode, binding to all interfaces.
CMD ["npm","run","dev","--","--host","0.0.0.0"]
