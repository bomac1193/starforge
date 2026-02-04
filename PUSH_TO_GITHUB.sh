#!/bin/bash

echo "🌌 Starforge GitHub Setup"
echo ""
echo "Choose an option:"
echo "1. I already have a GitHub repo"
echo "2. I need to create a new GitHub repo"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    read -p "Enter your GitHub repo URL (e.g., git@github.com:username/starforge.git): " repo_url
    git remote add origin "$repo_url"
    git branch -M main
    git push -u origin main
    echo "✅ Pushed to GitHub!"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "📋 Steps to create a new GitHub repo:"
    echo ""
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: starforge"
    echo "3. Description: The Artist's Creative Nervous System"
    echo "4. Choose: Public or Private"
    echo "5. DO NOT initialize with README (we already have one)"
    echo "6. Click 'Create repository'"
    echo ""
    echo "7. Copy the SSH URL (git@github.com:username/starforge.git)"
    echo "8. Run this script again and choose option 1"
    echo ""
else
    echo "Invalid choice"
fi
