FROM mysql:latest

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=mysql
ENV MYSQL_DATABASE=new-2all-dev
ENV MYSQL_USER=local
ENV MYSQL_PASSWORD=mysql

# Copy SQL files into the Docker container
COPY ./sql-scripts/ /docker-entrypoint-initdb.d/