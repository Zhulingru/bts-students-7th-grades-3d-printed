#!/bin/bash
# 在本機 Terminal 執行此腳本，將網站推送到 GitHub Pages
set -e
cd "$(dirname "$0")"

REPO="https://github.com/Zhulingru/bts-students-7th-grades-3d-printed.git"
GIT_DIR="${HOME}/.cache/bts-3d-site-git"

git --git-dir="$GIT_DIR" --work-tree="$(pwd)" init 2>/dev/null || true
git --git-dir="$GIT_DIR" --work-tree="$(pwd)" remote add origin "$REPO" 2>/dev/null \
  || git --git-dir="$GIT_DIR" --work-tree="$(pwd)" remote set-url origin "$REPO"

git --git-dir="$GIT_DIR" --work-tree="$(pwd)" add .
git --git-dir="$GIT_DIR" --work-tree="$(pwd)" commit -m "${1:-Update grade 7 3D nameplate gallery}" || true
git --git-dir="$GIT_DIR" --work-tree="$(pwd)" branch -M main
git --git-dir="$GIT_DIR" --work-tree="$(pwd)" push -u origin main

echo ""
echo "✅ 已推送到 GitHub"
echo "網站：https://zhulingru.github.io/bts-students-7th-grades-3d-printed/"
echo "若首次部署，請到 Settings → Pages 啟用 main / (root)"
