FROM python:3.12-slim
WORKDIR /app
COPY backend/pyproject.toml backend/poetry.lock* /app/ 2>/dev/null || true
RUN pip install --no-cache-dir poetry && poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-ansi || \
    pip install --no-cache-dir fastapi uvicorn[standard] httpx pydantic google-api-python-client google-auth-oauthlib google-auth python-dateutil
COPY app /app/app
EXPOSE 8080
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8080"]
