FROM python:3.11-slim

WORKDIR /app

COPY app.py .
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8080", "app:app"]
COPY entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
