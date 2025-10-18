# Base image supplies Python runtime without unnecessary tooling.
FROM python:3.12-slim

WORKDIR /app

# Install system deps if you need them later (e.g., build tools)
# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app /app/app

# Inform orchestrators which port uvicorn will listen on.
EXPOSE 8080
# Default command starts the FastAPI app via uvicorn inside the container.
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8080"]
