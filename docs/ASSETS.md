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

唯一运行时角色图片：

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

以后每套服装可沿用同样的表情名称与格子顺序。商店、购买、换装和新伙伴尚未实现，本次只整理现有 Mia。

## 已清理的旧素材

已删除五张停用场景：town.png、town-unit1.png、bakery.png、park.png、school.png。

已删除四张旧角色图：mia-expressions.png、mia-expressions-v3.png、mia-extra.png、mia-idle.png。

这些旧文件合计 24,554,766 字节；运行代码和浏览器检查脚本已改用当前五个素材文件。重新构建会同时清除 dist 中的旧副本。

选中的生成结果已从工具的 C 盘输出目录移入 D 盘；本轮草稿、缓存和测试环境在验证后清理。用户原始参考图片保持原位。
