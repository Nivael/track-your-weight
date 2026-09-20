# 轻一点 · Track Your Weight

中文、响应式的减重记录面板，支持体重趋势、饮食、运动、睡眠、照片对比与手记时间线。

**仓库仅包含完全虚构的演示数据，不含真实用户记录、照片或聊天内容。示例数值和建议不构成个人健康建议。**

## 本次功能

- 日 / 周切换：自然周按周一至周日统计摄入、蛋白质、晨重和实际活动，标注有效记录天数及结算状态，缺失不计零。
- 宏量营养：碳水、蛋白质、脂肪克数及按最近晨重计算的 g/kg。
- 饮食建议：显示依据日期、观察、行动、数据质量与来源链接；饱腹感仅作参考，不另设打卡。
- Watch 活动与睡眠：实际记录独立汇总，未来训练建议单独展示，较新的活动会提示计划待评估。
- 体型与餐食照片：支持正面、侧面以及早餐、午餐、晚餐分类；演示版不携带照片。
- 腰围、恢复记录、手记时间线与响应式排版。

页面读取已保存的记录和建议，不直连 Apple Watch，不自动识别截图，也不自动调用模型生成建议。Watch 示例数据为合成数据，不来自真实截图。

## 运行

需要 Node.js 22.13+ 和 npm。

```bash
npm ci
npm run dev -- --hostname 127.0.0.1
```

打开 http://127.0.0.1:3000 。服务默认仅监听本机。

```bash
npm test
npm run build
npx tsc --noEmit
```

`dev`、`test` 和 `build` 会先从 `demo/` 生成运行所需的内容快照。只更新示例文件时，可运行 `npm run content:sync` 后刷新页面。

演示时钟固定在 2025-01-16，便于重现历史周统计和未来计划。

## 数据与目录

- `app/`：页面、样式和只读 API。
- `demo/data/daily_log.csv`：虚构每日记录。
- `demo/data/nutrition_analysis.csv`：虚构宏量营养。
- `demo/data/watch_log.csv`：虚构活动与睡眠明细。
- `demo/data/diet_advice.json`：带依据和来源的示例建议。
- `demo/data/training_plan.json`：与实际记录分开的示例计划。
- `demo/data/journey.json`：合成时间线。
- `scripts/sync-content.mjs`：只读取本仓库 `demo/`，生成不纳入 Git 的内容快照。
- `lib/statistics.test.mjs`、`scripts/privacy.test.mjs`：统计边界及私人目录隔离测试。

## 隐私边界

构建不读取上一级目录，不导入本机个人资料，不复制照片。生成的 `lib/generated-content.json`、个人数据目录、照片、缓存、日志、环境文件和部署配置不纳入 Git。

**`demo/` 文件会被 Git 跟踪，且构建后的 API 会提供其中内容。不要将真实个人信息写入演示文件，或将含私人数据的构建发布到公开网站。** 照片组件保留，演示构建的照片列表固定为空。

本仓库不包含个人部署地址或云平台配置，未自动发布网站。

## 技术

React、TypeScript、Vinext、Vite、Tailwind CSS、Base UI / shadcn。
