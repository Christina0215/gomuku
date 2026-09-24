# 五子棋 / GOMOKU

纯前端五子棋，支持桌面和手机浏览器。TypeScript / React 管理棋局与 AI 难度策略，Rust 编译为 WebAssembly 负责棋形评分。无账号、后端或数据收集。

## 本地运行

```bash
npm ci
npm run dev
```

`npm test` 运行规则和 AI 测试，`npm run build` 构建静态站点。修改 `engine/src/lib.rs` 后安装 Rust 的 `wasm32-unknown-unknown` target 和 `wasm-pack`，运行 `npm run wasm` 重新生成 `src/wasm` 并提交生成文件。普通前端构建不需要 Rust。

## 发布

推送到 `main` 会触发 GitHub Actions，将站点发布到 [GitHub Pages](https://christina0215.github.io/gomuku/)。
