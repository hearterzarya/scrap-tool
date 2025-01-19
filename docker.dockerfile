# Use the official Node.js image with a lightweight version
FROM node:16-slim

# Install required dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    fonts-liberation \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
    libpangocairo-1.0-0 \
    libnss3 \
    libnspr4 \
    libxss1 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project into the container
COPY . .

# Expose the port Render will use
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
