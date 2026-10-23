---
title: "身体基准与二维灰模比例审阅"
releaseReady: false
aside: true
---

<script setup>
import comparison from './body-comparison.json'
</script>

# 身体基准与二维灰模比例审阅

## 二维灰模比例修订 {#gray-proportion-review}

::: warning 审阅候选 · 待选定比例
下图已通过本轮视觉复核，**尚未获得用户确认，不替换现行全套设定**。它是无装备二维身体正、右侧、背三视，用于先核对基础体块与头身关系，不是真实3D灰模。

当前穿戴图、表情与[人物尺寸页](/characters/bunny/dimensions)仍沿用旧基准，尚未同步。旧版H=1900px及坐标、宽度数值不能套给新灰模。
:::

<ReleaseImage src="/characters/bunny/3.1.0/36-gray-body-proportion-candidate.webp" original="/media/bunny/3.1.0/36-gray-body-proportion-candidate.png" alt="二维灰模比例修订审阅候选：无装备、中立正面、角色右侧和背面身体三视" caption="二维灰模比例修订 · 审阅候选，待用户选定比例" />

## 新旧图面等高对照

<BodyProportionCompare :previous="comparison.previous" :candidate="comparison.candidate" />

每个人物都按各自图面冠顶至赤脚地面的同一显示高度等比缩放，再平移到视口中心；旧图版头和注释被视口裁去，原始PNG没有改动。对齐点为近似图面位置，足趾轮廓可有数像素差异，不宣称精确骨骼重合。此处只比较身体轮廓，不由已穿衣角色反推基础体。

## 旧身体基准 · 现行穿戴参考 {#previous-baseline}

下图保留作历史对照，也是尚未同步的现行穿戴图所沿用的身体基准。外套体积不等于身体加宽；鞋底厚度不改变赤脚身高。

<ReleaseImage src="/characters/bunny/3.1.0/01-body-baseline.webp" original="/media/bunny/3.1.0/01-body-baseline.png" alt="旧身体基准正侧背三视，保留作为历史对照和现行穿戴参考" caption="旧身体基准 · 不是新灰模修订结果" />

## 旧人物尺寸基准

以下尺寸板与[人物尺寸页](/characters/bunny/dimensions)只解释旧基准，不是新候选的测量结果。待比例选定后，才能重新校准尺寸及后续衣层、装备和姿势图。

<ReleaseImage src="/characters/bunny/3.1.0/dimension-01-character-dimension-standard.webp" original="/media/bunny/3.1.0/dimension-01-character-dimension-standard.png" alt="旧人物尺寸板，不适用于新灰模候选" caption="旧人物尺寸基准 · 新候选尚未重新测量" />
