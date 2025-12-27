
#!/bin/bash

echo "Installing Aether - Attention Wallet for Android..."
echo

echo "Step 1: Cleaning previous installation..."
rm -rf node_modules package-lock.json

echo "Step 2: Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "Step 3: Installing Expo CLI..."
npm install -g @expo/cli

echo
echo "Installation complete!"
echo
echo "Next steps:"
echo "1. Copy .env.example to .env and add your API keys"
echo "2. Run 'npm start' to start the development server"
echo "3. Install Expo Go app on your Android device"
echo "4. Scan the QR code to run the app"
echo