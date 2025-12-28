FROM python:3.11-slim as backend

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Script to run migrations and start app
COPY ./start.sh /start.sh
RUN chmod +x /start.sh

ENV PYTHONPATH=/app

CMD ["/start.sh"]
