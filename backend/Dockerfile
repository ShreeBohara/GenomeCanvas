# GenomeCanvas API.
#
# The fixture JSON under app/data/ is baked into the image on purpose — the
# repository is read-only at runtime and loaded into memory once at startup, so
# there is no volume, no database, and no migration step. Rebuilding the fixtures
# (scripts/build_fixtures.py) is a build-time concern, not a runtime one.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /srv

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts

# Run as a non-root user. Nothing in the container is written to at runtime.
RUN useradd --create-home --uid 10001 genomecanvas
USER genomecanvas

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,os;urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",8000)}/api/health').read()"

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
