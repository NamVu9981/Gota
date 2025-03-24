FROM node:23

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .


# Start the Expo development server
CMD ["npx", "expo", "start"]