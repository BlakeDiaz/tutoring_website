FROM python:3.13.11-slim

WORKDIR /site

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app app

EXPOSE 5001

CMD ["flask", "--app", "app", "run", "--port", "5001", "--host", "0.0.0.0"]
