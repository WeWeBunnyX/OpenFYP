FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /app/requirements.txt
# install system packages we need (netcat for wait loop)
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/* \
	&& pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
