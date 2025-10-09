FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY dashboard_api.py .
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8080", "app:app"]
ENTRYPOINT ["/app/entrypoint.sh"]