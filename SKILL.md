---
name: imgage-tools-project
description: imgage-tools 图片/视频工具站的技术栈与 Warm parchment 设计规范。当需要为本项目编写、修改或审查 Vue 组件、页面样式或构建配置时使用，确保产出符合项目设计 token、工具页布局约定与技术约束。
version: 1.0.0
---

# imgage-tools 项目技能包（豆包专用）

> 使用方法：把本文件内容（或文件本身）作为技能/参考上下文提供给豆包，之后即可让豆包按本项目技术栈与设计规范产出代码。
> 顶部 YAML frontmatter（name / description / version）为技能导入所必需，请保留。
> 适用项目：`/Users/fushaoyu/me-project/demo/imgage-tools`

## 一、项目概述

图片/视频处理工具站（纯前端、本地运算，数据不上传）。单页应用，无后端。

| 项 | 值 |
|---|---|
| 框架 | Vue 3.5+（`<script setup lang="ts">` 组合式 API） |
| 构建 | Vite 8（@tailwindcss/vite 插件） |
| 样式 | Tailwind CSS v4（CSS-first 配置，**无 tailwind.config.ts**）+ daisyUI 5（`themes:false` 关闭内置主题）+ SCSS |
| 路由 | vue-router 5 + `createMemoryHistory`（URL 与路由不同步） |
| 图标 | lucide-vue-next（经自建 `z-icon` 组件渲染，禁止 emoji） |
| 文件处理 | JSZip + file-saver（批量打包下载） |
| 类型检查 | vue-tsc（`npm run build` = `vue-tsc -b && vite build`） |

目录结构：

```
src/
  assets/styles/
    tailwind.css        # 设计 token 唯一权威（@theme）
    global.scss         # 全局基础样式（字体/背景/焦点环/过渡）
    lovable-tokens.scss # :root 纯 CSS 变量备份层（与 @theme 值保持一致）
  components/z-icon/    # 公共图标组件（传 LucideIcon 组件，保证 tree-shaking）
  layout/               # 顶部导航壳 + 菜单配置 menu.ts（两级菜单，纯 CSS hover 下拉）
  views/                # 工具页（每个工具一个目录）
  router/index.ts       # 路由（createMemoryHistory）
```

## 二、设计系统：Warm parchment canvas

### 2.1 色板（全部来自 @theme token，禁止硬编码颜色）

| Token | 值 | 用途 |
|---|---|---|
| `parchment` | `#fcfbf8` | 页面底色、卡片面 |
| `warm-sand` | `#f7f4ed` | 次级面（上传区、结果面板、下拉菜单） |
| `linen-border` | `#eceae4` | 常规边框、分隔线 |
| `stone` | `#d4d3d0` | 弱边框、占位、禁用态 |
| `dim-gray` | `#5f5f5d` | 次级文字（对比度 ≥4.5:1） |
| `charcoal` | `#1c1c1c` | 主文字、主按钮底 |
| `ink` | `#030303` | 主按钮 hover |
| `indigo-accent` | `#3451b2` | **全站唯一彩色时刻**：强调、链接、焦点环、警示说明 |

规则：不用黑白灰绿蓝系默认色（bg-white/gray-*/#4096ff 等一律禁止）；警示提示用 `text-indigo-accent` + TriangleAlert 图标，不引入红绿语义色。

### 2.2 字体

- DM Sans Variable（Google Fonts 引入，`opsz,wght@9..40,100..1000`），支持 480 字重
- 全局：`letter-spacing: -0.025em`、`font-feature-settings: "liga" 0`、antialiased
- 字号阶梯（`--text-*` token，直接可用 `text-caption` 等工具类）：

| Token | 大小 | 行高 | 字距 |
|---|---|---|---|
| `caption` | 14px | 1.5 | -0.35px |
| `body` | 16px | 1.5 | -0.4px |
| `subheading` | 18px | 1.38 | -0.45px |
| `heading-sm` | 20px | 1.25 | -0.5px |
| `heading` | 36px | 1.1 | -0.9px |
| `heading-lg` | 48px | 1.1 | -1.2px |
| `display` | 60px | 1 | -1.5px |

### 2.3 圆角与阴影

- 圆角：`rounded-input` 8px / `rounded-img` 12px / `rounded-card` 16px / `rounded-card-lg` 24px / `rounded-pill` 9999px
- 阴影：`shadow-subtle`（0.5px 内描边）/ `shadow-subtle-2`（1px 轮廓 + 大投影，卡片用）/ `shadow-subtle-3`（内描边加深）
- hero 渐变 `bg-hero-gradient` 仅供首页 hero 全宽使用，**绝不用于单个 UI 控件**

### 2.4 全局交互约定

- 微交互过渡 0.15s（颜色/背景/边框，global.scss 已全局声明）
- 焦点环：`:focus-visible` 统一 indigo-accent 2px outline（全局已配，组件无需重复）
- 所有可点击元素加 `cursor-pointer`；操作按钮悬停淡入淡出
- 图标一律 lucide SVG（经 z-icon），禁止 emoji 作图标；描边细线 strokeWidth 1.5
- 选中态（::selection）：charcoal 底 + parchment 字

## 三、工具页统一布局规范（views/* 必须一致）

```
页面容器：mx-auto max-w-3xl px-6 py-12
页头：flex items-start gap-4
  ├─ 44px 黑底图标块：flex h-11 w-11 items-center justify-center rounded-card bg-charcoal text-parchment
  └─ 标题 text-heading-sm font-semibold text-charcoal + 副标题 mt-1 text-caption text-dim-gray
上传区：border-2 border-dashed border-linen-border bg-warm-sand rounded-card-lg 居中内容，整卡可点击（input hidden）
设置面板：rounded-card-lg border border-linen-border bg-parchment p-6 sm:p-7 shadow-subtle-2
主按钮：h-11 rounded-pill bg-charcoal px-6 text-[15px] font-medium text-parchment hover:bg-ink
       disabled:cursor-not-allowed disabled:bg-stone disabled:text-dim-gray
次按钮：h-11 rounded-pill border border-linen-border bg-parchment px-6 text-charcoal hover:border-stone hover:bg-warm-sand
输入框：h-10 rounded-input border border-linen-border bg-parchment px-3 text-[15px]
       placeholder:text-dim-gray/70 focus:border-indigo-accent focus:outline-none
选择 chip：rounded-pill border px-3.5 py-2 text-[13px]
       选中：border-charcoal bg-charcoal font-medium text-parchment
       未选：border-linen-border bg-parchment text-dim-gray hover:border-stone hover:text-charcoal
file input：file:mr-3 file:rounded-pill file:border-0 file:bg-charcoal file:px-3.5 file:py-1.5
           file:text-caption file:font-medium file:text-parchment hover:file:bg-ink
警示说明：flex items-center gap-1.5 text-caption text-indigo-accent + z-icon TriangleAlert :size="14"
结果面板：rounded-card-lg border border-linen-border bg-warm-sand p-6
```

## 四、关键技术约束（改代码前必读）

1. **Tailwind v4 不加载 tailwind.config.ts**：所有 token 定义在 `tailwind.css` 的 `@theme` 块，新增 token 必须同时同步到 `lovable-tokens.scss` 的 `:root`（@theme 只输出被工具类引用的变量，纯 var() 引用需备份层兜底）。
2. **禁止新建 postcss.config.ts**（与 @tailwindcss/vite 并存会构建失败）。
3. **daisyUI 5 是 CSS-first**：`@plugin "daisyui" { themes: false }`，颜色由 `--color-base-*` / `--color-primary` 等 @theme 变量提供，不用 daisyUI 的 data-theme 属性。
4. **createMemoryHistory**：URL 与路由不同步，刷新/直链不会恢复路由；不要依赖 URL 做跳转或断言。
5. **z-icon 用法**：`import { XIcon } from "lucide-vue-next"` 后把组件传入 `<z-icon :icon="XIcon" :size="20" />`；**size 只收 number**（string 会触发 vue-tsc TS2322）；禁止传图标名称字符串（会失去 tree-shaking，全量引入 ~2MB）。
6. **v-if 区块内的 ref 为 null**：条件为 false 时内部 ref 未挂载，异步流程（如转换循环）里向 v-if 容器写 DOM 会全部丢失。**一律用数据驱动渲染**（ref 数组 + computed 筛选 + v-for），不要 JS 动态 appendChild。
7. **CSS 裁剪陷阱**：容器设 `overflow-x:auto` 时 overflow-y 按规范变 auto，绝对定位下拉/浮层会被裁剪；浮层卡片放滚动容器外。
8. **Object URL 生命周期**：createObjectURL 的 URL 必须在清空列表与组件卸载时 revoke，防内存泄漏。
9. **无 Store**：本项目不用 Pinia，状态都在组件内 ref/computed；子组件通过 props/emit 与父级通信。
10. **验证**：`npm run build`（含 vue-tsc 类型检查）必须通过；视觉验证用 headless Chrome 截图（dev server 端口需先确认，如 `curl -s -o /dev/null -w "%{http_code}" http://localhost:2469/`）。

## 五、代码风格约定

- Vue 3 `<script setup lang="ts">` + `defineProps<Props>()` + `withDefaults` + JSDoc 注释（中文）
- 模板注释用中文；状态命名语义化；派生状态用 computed，不在方法里手动赋值 ref
- 优先复用公共组件（z-icon、Layout 插槽）；现有组件不完全匹配时倾向自建而非强行适配
- 图标导入按名具名导入（tree-shaking）；接口/常量集中定义在文件顶部
- 文案中文、语气一致（如「全部处理完成！」「转换中…」）

## 六、当前页面与路由

| 路由 | 菜单名 | 文件 | 状态 |
|---|---|---|---|
| `/` | — | 重定向到 /images-icon | — |
| `/images-icon` | 图片转图标 | `src/views/images-icon/index.vue` | 已完成（PNG/ICO/ICNS 转换 + ZIP 批量下载） |
| `/images-zoom` | 图片调整大小 | `src/views/images-zoom/index.vue` | 已完成（批量缩放 + ZIP） |
| `/images-base64` | 图片Base64转换 | `src/views/images-base64/index.vue` | **空文件，待实现**（菜单/路由已注册） |
| `/videos-watermark` | 视频水印 | `src/views/videos-watermark/index.vue` | 已完成（自定义水印文字 + 批量处理 + 计时） |

菜单结构（`src/layout/menu.ts`）：图片工具（图片转图标 / 图片调整大小 / 图片Base64转换）、视频工具（视频水印）；父级 hover 展开子菜单（纯 CSS group-hover），子级激活态 bg-parchment font-[480]。
