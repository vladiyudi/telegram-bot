# Use the official Node.js image as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that your bot will run on
# (Note: Telegram bots usually don't require port exposure as they communicate via webhooks or polling)
# EXPOSE 3000

# Command to run the bot

EXPOSE 8080

CMD ["node", "server.js"]
