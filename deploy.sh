#!/bin/bash

# LifeLine-X Hospital Management System - Deployment Script
# This script helps you deploy to Render with proper configuration

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    LifeLine-X Deployment Script                              ║"
echo "║                    Hospital Management System                                ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Git is installed"
echo ""

# Check git status
echo "📋 Checking git status..."
git status --short
echo ""

# Ask for confirmation
read -p "🤔 Do you want to commit and push these changes? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Add all changes
echo "📦 Adding all changes..."
git add .
echo "✅ Changes added"
echo ""

# Commit with message
echo "💬 Enter commit message (or press Enter for default):"
read -r commit_message

if [ -z "$commit_message" ]; then
    commit_message="Final CORS fix: Enhanced configuration and health checks"
fi

echo "📝 Committing with message: $commit_message"
git commit -m "$commit_message"
echo "✅ Changes committed"
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          NEXT STEPS                                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "1. Go to Render Dashboard: https://dashboard.render.com"
    echo ""
    echo "2. Set Backend Environment Variables (lifeline-x-backend):"
    echo "   MONGODB_URI=mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0"
    echo "   JWT_SECRET=lifeline_x_secret_key_2024_secure"
    echo "   NODE_ENV=production"
    echo "   FRONTEND_URL=https://hospital-1-5hyf.onrender.com"
    echo "   PORT=5000"
    echo ""
    echo "3. Set Frontend Environment Variables (hospital-1-5hyf):"
    echo "   REACT_APP_API_URL=https://lifeline-x-backend.onrender.com/api"
    echo ""
    echo "4. Wait for auto-deployment (15-20 minutes)"
    echo ""
    echo "5. Test your app:"
    echo "   Frontend: https://hospital-1-5hyf.onrender.com"
    echo "   Backend Health: https://lifeline-x-backend.onrender.com/health"
    echo ""
    echo "6. Use test-cors.html to verify CORS is working"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          🎉 DEPLOYMENT STARTED! 🎉                           ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
else
    echo "❌ Failed to push to GitHub"
    echo "Please check your git configuration and try again."
    exit 1
fi
