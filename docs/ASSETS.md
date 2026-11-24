# 当前插画与 Mia 素材

素材由内置 image_gen 工具生成和编辑，均保存在 D 盘原项目。运行学习页面不需要图片 API Key，也不会实时生成角色图片。

## 场景

| 文件（相对于 frontend/public/assets/） | 尺寸 | 内容 |
| --- | --- | --- |
| town-panorama.png | 2172 × 724 | 明亮小镇全景：红色木构面包店、公园水池和喷泉、带钟楼的砖红学校 |
| bakery-unit1.png | 1536 × 1024 | 与地图配套的面包店内部、条纹遮阳棚和面包柜台 |
| park-unit1.png | 1536 × 1024 | 与地图配套的公园；远景可见相同的面包店和学校 |
| school-unit1.png | 1536 × 1024 | 阳光明亮的教室，窗外为同一公园 |

风格参考用户提供的两张 Gemini 图片，统一蓝天、鲜绿植被、砖红建筑和清晰的手绘动画线条。完整提示词与参考图用途见 [asset-prompts-bright-v4.json](asset-prompts-bright-v4.json)。

地图按钮继续使用现有 Lucide 图标系统。按钮位置、镜头焦点和窄屏位置在 frontend/src/features/adventure/map/locations.js；不绘制连接线。第一次点击地点进入场景，第二次明确开始练习。登录和注册背景同步使用当前全景。

## Mia：一套服装、一张图集

默认服装角色图片：

`frontend/public/assets/characters/mia/school-uniform.png`

1182 × 1330，真实 RGBA 透明 PNG，4 列 × 3 行。包含 11 种表情和默认表情的闭眼帧。角色保持棕色短发、侧马尾、粉色蝴蝶结、白色校服、粉色领带与蓝色裙子的原有设计。

| 行 | 第 1 列 | 第 2 列 | 第 3 列 | 第 4 列 |
| --- | --- | --- | --- | --- |
| 1 | smile 默认微笑 | blink 闭眼帧 | thinking 思考 | talking 说话 |
| 2 | happy 开心微笑 | encourage 鼓励 | celebrate 庆祝 | wink 眨眼招手 |
| 3 | surprised 惊讶 | proud 欣慰 | ponder 好奇思考 | focus 友好专注 |

focus 已替换原来半闭眼、托脸的状态，改为睁眼、眉毛舒展、轻微微笑、手放在下巴附近的专注表情。教学用途和后端表情名称保持一致。

- frontend/src/components/miaAppearance.js：图片路径、图集行列、每个表情的格子与中文名称、显示缩放和闭眼帧对齐补偿。
- frontend/src/components/Mia.jsx：组合当前表情与眨眼，不再维护多套旧图集映射。
- frontend/src/components/useMiaBlink.js：随机眨眼间隔、后台暂停和减少动态偏好。

图集留有透明间隔，避免裁切时带出相邻角色的头发或手指；闭眼帧通过显示坐标补偿对齐默认表情，按比例适配不同人物尺寸。浅色、蓝色底的十二格预览和真实场景已检查。

整合及两次修订使用内置图片工具完成；原始提示词、眨眼修订与最终间距修订见 [asset-prompts-mia-unified.json](asset-prompts-mia-unified.json)。预览：artifacts/mia-expressions-review.png。

每套服装沿用同样的表情名称与格子顺序。商店与背包现已接入，仍由 Mia 一人陪伴学习。

## 已清理的旧素材

已删除五张停用场景：town.png、town-unit1.png、bakery.png、park.png、school.png。

已删除四张旧角色图：mia-expressions.png、mia-expressions-v3.png、mia-extra.png、mia-idle.png。

这些旧文件合计 24,554,766 字节；运行代码和浏览器检查脚本已改用当前五个素材文件。重新构建会同时清除 dist 中的旧副本。

选中的生成结果已从工具的 C 盘输出目录移入 D 盘；本轮草稿、缓存和测试环境在验证后清理。用户原始参考图片保持原位。


## Einkaufen：商场、场景与便服

使用内置 image_gen，参考用户的现代商场与粉格便服图片；未使用用户的教学 API Key。四张配套插画采用清晰线条、明亮穹顶采光和同一建筑布局，商店以服装、耳机、餐具图形识别，无真实商标。餐厅草稿中的空白板已通过内置工具移除。

| 路径（frontend/public/assets/ 下） | 尺寸 | 用途 |
| --- | --- | --- |
| mall-unit2.png | 2172 × 724 | 蓝色主题现代商场全景 |
| clothing-unit2.png | 1536 × 1024 | 服装店与粉格便服展示 |
| electronics-unit2.png | 1536 × 1024 | 手机、电脑与配件商店 |
| restaurant-unit2.png | 1536 × 1024 | 同一商场楼上餐厅 |
| characters/mia/pink-gingham.png | 1182 × 1330 | 服装店通关奖励，12 帧透明表情图集 |
| characters/mia/blue-gingham.png | 1182 × 1330 | 商店蓝格便服，12 帧透明表情图集 |

miaAppearance.js 的 OUTFIT_APPEARANCES 分别指定图集、显示比例和闭眼对齐参数；MIA_EXPRESSIONS 的名称与顺序共用。地图、场景和词卡中的 Mia 读取账号当前穿着；背包预览通过 outfit 属性指定服装并使用 smile。

完整初始及修订提示词：[asset-prompts-unit2.json](asset-prompts-unit2.json)。浏览器表情预览：artifacts/mia-pink-gingham-expressions.png、artifacts/mia-blue-gingham-expressions.png。


## 连帽常服 · casual-hoodie

新增商店服装，售价与蓝格便服相同，为240金币。使用用户 Mirai_ML_Anime_Profile.png 作为衣服参考，现有粉格图集作为角色身份与格子顺序参考，由内置 image_gen 生成。

成品：frontend/public/assets/characters/mia/casual-hoodie.png，1182×1330，RGBA透明，4列×3行。保留白色短袖连帽外套、深蓝条纹、红色格纹内搭、波点发结、蓝色发夹及蓝裙上缘，包含相同11种表情与闭眼帧。默认预览为smile，表情与随机眨眼使用现有组件。

完整提示词：[asset-prompts-casual-hoodie.json](asset-prompts-casual-hoodie.json)。浏览器逐格预览：artifacts/mia-casual-hoodie-expressions.png；商店与背包：artifacts/hoodie-shop.png、hoodie-backpack.png。生成原件已移入D盘，用户Downloads中的参考图未修改。


## 粉色开衫 · pink-cardigan

参考用户 Mirain1.jpg，以现有连帽常服图集锁定角色脸型、画风与表情格子，由内置 image_gen 生成。保留粉色长袖开衫、黄色滚边和袖条、白衬衫领、细红领结、格纹裙上缘及粉色发饰。

文件：frontend/public/assets/characters/mia/pink-cardigan.png，1182×1330，RGBA透明，4列×3行，相同11种表情和闭眼帧。商店价格240金币，购买后在背包选择，默认预览smile，保留随机眨眼与账号穿着保存。

完整提示词：asset-prompts-pink-cardigan.json。浏览器逐格预览：artifacts/mia-pink-cardigan-expressions.png。用户原始JPG未修改，工具C盘生成原件已移至D盘。

## 项目标识与 favicon

直接使用 frontend/src/assets/logo.png 原图。ProjectLogo.jsx / projectLogo.css 组合共享的页面标识；侧栏、登录、注册和注册成功页使用同一图片。frontend/index.html 的 PNG favicon 引用同一源文件，Vite生产构建输出到 /assets/logo-内容哈希.png，现有FastAPI静态目录即可提供。不重新生成或改绘原logo，不额外复制一份到public。

浏览器验证生产 favicon 的 PNG 类型、SHA-256 与原logo一致，以及页面图标和favicon实际URL相同。截图：artifacts/project-logo-map.png、project-logo-login.png、project-logo-register-mobile.png、project-logo-welcome.png。
