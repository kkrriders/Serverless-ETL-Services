FROM node:18-slim

WORKDIR /app

# Copy package.json files for backend 
COPY package.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY src ./src
COPY serverless.yml ./
COPY jest.config.js ./
COPY .eslintrc.js ./

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Expose the backend port for Cloud Run
EXPOSE 8080

# Command to run the backend service
CMD ["node", "src/server.js"] 