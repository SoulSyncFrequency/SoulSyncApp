FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
ENV AIOPS_PORT=8000
EXPOSE 8000
CMD ["python","-u","/app/app.py"]
