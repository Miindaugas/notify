FROM node:21.7.0-alpine3.19

# Set the working directory inside the container
WORKDIR /app

# Create a group and user to run the application
RUN addgroup -S app-users && adduser -S -G app-users app-user

# Change ownership of the working directory to the app-user
RUN chown app-user:app-users /app

# Copy the application files into the container
COPY ./package.json /app
COPY ./notify.js /app

# Switch to the app-user
USER app-user

# Specify the default command to run the Node.js script
CMD ["node", "start.js"]