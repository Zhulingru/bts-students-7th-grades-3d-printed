# 七年級 3D 列印作品（GitHub Pages）

## 預覽網站（本地）

```bash
cd site
python3 -m http.server 8080
```

瀏覽器開啟：http://localhost:8080

## 新增或更新學生 STL 後

1. 把新的 `.stl` 放進桌面資料夾 `七年級3D列印作品/名牌/{白色|灰色|黑色}/`
2. 執行建置腳本：

```bash
python3 scripts/build_site.py
```

3. 將 `site/` 資料夾內容推送到 GitHub

## 部署到 GitHub Pages

1. 在 GitHub 建立新 repository（例如 `grade7-3d-prints`）
2. 將 **此 `site` 資料夾內的所有檔案** 放到 repo 根目錄（`index.html` 要在根目錄）
3. GitHub → Settings → Pages → Source 選 **Deploy from branch**
4. Branch 選 `main`，資料夾選 `/ (root)`
5. 幾分鐘後網址為：`https://<你的帳號>.github.io/<repo名稱>/`

## 操作說明

- 首頁：作品卡片（目前為「名牌」）
- 點「名牌」：彈出全班名牌牆，可依班級、顏色篩選
- 點某位學生：顯示平面縮圖，按 **View in 3D** 可拖曳旋轉檢視
