# Use a lightweight Node.js base image
FROM node:16-slim

# Install necessary dependencies for Puppeteer and Chrome
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-liberation libappindicator3-1 libnss3 libxss1 libasound2 \
       libatk1.0-0 libatk-bridge2.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libxcomposite1 libxrandr2 \
       libxcursor1 libxdamage1 libgbm1 libglib2.0-0 libgtk-3-0 libpango-1.0-0 libpangocairo-1.0-0 libxkbcommon0 \
       --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_PRODUCT=chrome

# Create and switch to a non-root user
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

USER pptruser

# Set working directory
WORKDIR /app

# Copy project files
COPY package*.json ./
COPY . .

# Install dependencies
RUN npm install

# Expose port for Vercel to run the server
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
