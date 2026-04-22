# 你好. — Chinese Study App

中国語学習のためのプライベート学習アプリ。クイズ、間違いノート、歌詞学習、プロフィール管理などを搭載。

## ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## 本番ビルド

```bash
npm run build
```

`dist/` に静的ファイルが生成されます。

## デプロイ方法

### Vercel（推奨・無料）

1. このリポジトリを GitHub にプッシュ
2. https://vercel.com にサインアップ（GitHub 連携）
3. "Add New Project" → リポジトリを選択
4. そのまま Deploy を押す（Vite は自動検出されます）
5. `https://your-app.vercel.app` の URL が発行されます

### Netlify

1. https://app.netlify.com で GitHub 連携
2. "Add new site" → "Import from GitHub"
3. ビルドコマンド: `npm run build`、出力: `dist`

### GitHub Pages

`vite.config.js` に `base: '/repo-name/'` を追加する必要があります。

## データ保存

学習データは `localStorage` に保存されます（ブラウザ内のみ）。
プロフィールごとに別のキーで保存され、ブラウザ／デバイスを変えると共有されません。
