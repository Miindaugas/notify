FROM node:21.7.0-alpine3.19

# Set the working directory inside the container
WORKDIR /app

# Create a group and user to run the application
RUN addgroup -S app-users && adduser -S -G app-users app-user

# Change ownership of the working directory to the app-user
RUN chown app-user:app-users /app

# Copy the application files into the container
COPY ./config.js ./
COPY ./src/notify.js ./src/notify.js
COPY ./src/start.js ./src/start.js

# Switch to the app-user
USER app-user

# Specify the default command to run the Node.js script
CMD ["node", "src/start.js"]