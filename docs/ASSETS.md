# Generated visual assets

Generated with the built-in image generation tool, using the user's two Mia references for character identity and expressions. Runtime animation is implemented with CSS; expressions are selected from the atlas, rather than generated during a student's session. No image-generation API key is needed at runtime.

| File | Purpose |
| --- | --- |
| `frontend/public/assets/town.png` | Illustrated town map |
| `frontend/public/assets/bakery.png` | Bakery interior |
| `frontend/public/assets/mia-expressions.png` | Transparent 3-column, 2-row expression atlas |

Atlas order: smile, thinking, talking; happy, encourage, celebrate. Each frame has a 2:3 aspect ratio. The final atlas has genuine alpha transparency and uses the same framing across expressions.

## Prompts

### Mia atlas

Use case: identity-preserve / game character expression atlas. Reference images: the supplied colored brown-haired schoolgirl and pencil expression sheet are character identity and expression references. Create a polished anime visual-novel character sprite atlas for Mia, same brown shoulder-length hair with short side ponytail on viewer right and pink bow, amber eyes, white short-sleeve school blouse with pink collar trim and pink necktie. Age-appropriate friendly school adventure for ages 10–15. ONE square image, exactly 3 equal columns and 2 equal rows, no gaps, no labels, no signature, no lettering. Six independent waist-up portraits of the SAME character on ACTUAL TRANSPARENT background. Each cell has identical camera framing, head size, eye-line and centered torso, all art safely inside its own cell with transparent margins. Row1 left: relaxed warm smile hands at sides. Row1 center: gentle thinking head tilt hand near chin. Row1 right: speaking friendly open mouth. Row2 left: happy closed-eye smile. Row2 center: encouraging confident smile one index finger raised. Row2 right: excited celebrating small fist gesture. Consistent face, outfit and ponytail across every frame; hands anatomically clear; no extra bodies, no panel borders. Final is a production sprite atlas; perfectly aligned cell grid is critical.

### Transparency refinement

Use case: background-extraction. Edit target: the supplied six-expression Mia sprite atlas. Remove ONLY the white/light gray background and the faint panel divider lines from all six cells. Actual transparent pixels alpha=0 outside each character are required, not a translucent white rectangle and not a checkerboard drawing. Keep characters fully opaque including their white shirts and facial highlights. Preserve exact character appearance, expressions, same original 3-column by 2-row grid, relative alignment, canvas aspect ratio and all framing. Do not move or resize individual characters. No additional art or text. This will be layered directly over a colored game background; all surrounding negative space must be genuinely transparent.

### Town

Use case: illustration-story. Asset type: background for a playable 2D browser German-learning town map for Chinese-speaking students ages 10–15. Wide landscape 3:2 illustration with a clean hand-painted anime adventure game aesthetic, soft cream daylight, sage green foliage, warm terracotta and butter-yellow buildings. Isometric / oblique bird's-eye German village square, winding pale cobblestone path connecting a cozy red-awning bakery near lower center, a school building in upper right, park with pond on right, small bookshop on left, clock tower at upper center. Detailed but uncluttered, inviting youthful sophisticated visual novel scenery, no people needed. Clear building silhouettes and generous quiet space around buildings for HTML hotspot labels overlaid separately. The bakery has a warm ochre plaster facade, red-and-cream striped awning and bread visible through windows. Trees in soft mint and deep forest green, spring flower beds, distant hills and pale blue sky. No letters, labels, words, UI, logos, watermark or frame. Not photorealistic, not blocky 3D, not toddler cartoon. Entire frame beautifully illustrated.

### Bakery

Use case: illustration-story. Asset type: interactive scene background for 2D German-learning adventure website. Wide landscape 3:2 hand-painted anime game background of a cozy German village bakery interior, warm cream and golden apricot daylight, sage green trim, terracotta floor, red-and-cream striped outside awning visible through window. Front view of a wooden bakery counter across lower-middle frame, baskets of bread rolls, loaves, pretzels and croissants, tasteful chalkboard with no writing, shelves, window with foliage. Leave middle counter surface clean for interactive product buttons to be overlaid. Left third will have a character portrait placed over it, so keep that region relatively quiet. Gentle painterly texture, crisp appealing shapes, warm storybook visual novel quality suitable for ages10–15. No people, no text, no prices, no UI, no letters, no watermark.

## 2026-11-10: school, park and three extra expressions

Built-in image generation produced `frontend/public/assets/school.png`, `park.png` and `mia-extra.png`. Prompts are saved in [asset-prompts-v2.json](asset-prompts-v2.json).

School and park use restrained watercolor/gouache, pencil lines, paper texture, coherent perspective and less decorative clutter. These are generated illustrations, not represented as human-made artwork.

The supplementary atlas has three columns in one row: wink, surprised discovery, proud/relieved smile. It is composited through CSS with a short entrance fade. The alpha channel and actual scene compositing were checked. Existing six expressions remain available.

The supplied additional gallery URL returned HTTP 403 to automated reading. Identity was therefore kept consistent with the user's earlier reference images and the already established Mia atlas; no claim is made that the blocked gallery was fully inspected.


## 2026-11-10: Kennenlernen UI redesign

Generated with the built-in image generation tool; no runtime image API key is needed. Full generation briefs and reference constraints: [asset-prompts-ui3.json](asset-prompts-ui3.json).

| Asset in frontend/public/assets | Use |
| --- | --- |
| town-unit1.png | Larger town map, displayed through a moving camera |
| bakery-unit1.png | Matching bakery interior |
| park-unit1.png | Matching pond, bench and picnic area |
| school-unit1.png | Matching classroom |
| mia-expressions-v3.png | ONE transparent 3-column, 2-row atlas: wink / surprised / proud; ponder / focus / empty |
| mia-idle.png | Two matching neutral portraits: eyes open / eyes closed |

The new atlas replaces the previous supplemental atlas at runtime and includes two thinking expressions. The original six-expression atlas remains available. Default idle portraits alternate briefly for a blink at random intervals; there is no continuous breathing or floating motion. Expressions fade briefly when changed. All runtime references use D-drive project assets. Temporary C-drive generation outputs for this redesign were removed after copying at the user's request.
