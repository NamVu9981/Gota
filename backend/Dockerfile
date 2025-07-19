# Dockerfile
FROM python:3.12

WORKDIR /app

# Install PostgreSQL client
RUN apt-get update && apt-get install -y postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Expose the port your backend uses
EXPOSE 8000

# Use the entrypoint script to run migrations and start server
CMD ["./entrypoint.sh"]