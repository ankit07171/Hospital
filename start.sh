#!/bin/bash

echo "Starting Lifeline X Hospital Information System..."
echo

echo "Installing dependencies..."
npm install
cd client
npm install
cd ..

echo
echo "Starting the application..."
echo "Backend will run on http://localhost:5000"
echo "Frontend will run on http://localhost:3000"
echo

# Start backend in background
npm run server &

# Wait a moment for backend to start
sleep 3

# Start frontend
cd client
npm start