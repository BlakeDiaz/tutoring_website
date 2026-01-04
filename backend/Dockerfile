FROM python:3.13.11-slim AS base

WORKDIR /site

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app app

EXPOSE 5001

FROM base AS development

CMD ["flask", "--app", "app", "run", "--port", "5001", "--host", "0.0.0.0"]

FROM base AS production

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "app:create_app()"]
