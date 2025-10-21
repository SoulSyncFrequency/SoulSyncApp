#!/bin/bash
# 🔁 Auto Git Push Script for SoulSync
msg=${1:-"auto: update"}
git add .
git commit -m "$msg" || echo "⚠️ Nothing to commit"
git pull origin main --rebase
git push origin main
