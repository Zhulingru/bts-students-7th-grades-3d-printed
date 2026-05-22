#!/bin/bash
# 在本機 Terminal 執行此腳本，將網站推送到 GitHub Pages
set -e
cd "$(dirname "$0")"

REPO="https://github.com/Zhulingru/bts-students-7th-grades-3d-printed.git"

rm -rf .git
git init
git remote add origin "$REPO"

git add .
git commit -m "Add grade 7 3D printing nameplate gallery site" || true
git branch -M main
git push -u origin main

echo ""
echo "✅ 已推送到 GitHub"
echo "請到以下網址啟用 Pages："
echo "https://github.com/Zhulingru/bts-students-7th-grades-3d-printed/settings/pages"
echo "Source 選：Branch = main，Folder = / (root)"
echo ""
echo "啟用後網站網址："
echo "https://zhulingru.github.io/bts-students-7th-grades-3d-printed/"
