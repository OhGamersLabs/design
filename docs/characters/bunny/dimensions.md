---
title: "v2 · 图面尺寸与比例"
releaseReady: false
aside: true
---
<script setup>
import BodyMeasurements from '../../.vitepress/theme/components/BodyMeasurements.vue'
import measurements from '../../../catalog/bunny/3.1.0/body-measurements.json'
</script>
<span id="人物与武器统一尺寸"></span>

# v2 · 图面尺寸与比例

本页记录[当前完整新绘的基础文胸三视](/characters/bunny/body-base)的图面读数，便于核对头身比、肩腰胯关系及躯干与腿长。三视分别记录各自原图的可见轮廓。本轮只重新读取耳发修订后正面的坐标，侧背原图与已核读数保持；当前三视作为衣层设计基准，[首层白色上衣与红色短裤](/characters/bunny/innerwear)已提供穿着三视和结构板，[袜装层](/characters/bunny/hosiery)另有穿着三视与匹配结构资料，鞋靴和后续装备尚未同步。本页仍记录基模，未改为衣物成品尺寸。

::: info 图面比例与实际设定
**H** 是可见发冠最高点至赤脚地面的图面高度；**h** 是可见发冠至下颏的头高，包含发量，不另估被头发遮住的颅顶。头身比为 H ÷ h。

当前记录的是原图像素与占 H 的比例，**厘米身高尚未设定**。肩、腰、胯和胸部宽度是指定水平线上的可见投影，不是骨骼尺寸或胸腰臀围。正面衣物胸宽取基础文胸杯外缘的指定截面，不计外侧腋前肤线，也不是最大裸胸宽或杯码。图面躯干段与腿长的起止点见各项定义。
:::

## 当前工作稿尺寸 {#current-body-measurements}

选择视角查看同一张原图上的标尺与读数。表中的“—”表示遮挡或无法可靠取点，未用其他视角补值。近似取点的容差只表示线宽与选点范围，不代表统计精度。

<BodyMeasurements :data="measurements" />

[查看三张完整原图与等高对照](/characters/bunny/body-base) · [下载三视标尺与测量数据](/characters/bunny/downloads#body-measurements)

## 耳部与发色修订前 · 图面尺寸 {#before-ear-hair-measurements}

<details>
<summary>展开修订前的正面与三视测量快照</summary>

这份完整三视记录对应耳发修订前的正面及继续使用的侧背。旧正面读数不套用到当前新绘正面；旧三张标尺与原图保持。

[历史三视测量 JSON](/catalog/bunny/3.1.0/body-measurements-fresh-cel-v1.json) · [正面旧标尺 SVG](/characters/bunny/3.1.0/body-v2-fresh-cel-measurements-front-v1.svg) · [侧面标尺 SVG](/characters/bunny/3.1.0/body-v2-fresh-cel-measurements-side-v1.svg) · [背面标尺 SVG](/characters/bunny/3.1.0/body-v2-fresh-cel-measurements-back-v1.svg)

</details>

## 完整新绘前 · 基础文胸尺寸 {#basic-bra-body-measurements}

<details>
<summary>展开此前基础文胸三视的图面尺寸</summary>

这些读数对应[完整新绘前的基础文胸三视](/characters/bunny/body-base#before-fresh-body)，保留原图、坐标与标尺，不套用到本轮全新人物。

[历史测量记录 JSON](/catalog/bunny/3.1.0/body-measurements-basic-bra-v1.json) · [正面旧标尺 SVG](/characters/bunny/3.1.0/body-v2-basic-bra-measurements-front-v1.svg) · [侧面旧标尺 SVG](/characters/bunny/3.1.0/body-v2-basic-bra-measurements-side-v1.svg) · [背面旧标尺 SVG](/characters/bunny/3.1.0/body-v2-basic-bra-measurements-back-v1.svg)

</details>

## 此前运动款尺寸 · 历史参考 {#sports-body-measurements}

<details>
<summary>展开运动款三视的旧尺寸资料</summary>

旧读数与标尺对应[此前运动款三视](/characters/bunny/body-base#sports-body-history)，其中衣物胸宽不能用于当前基础文胸。原数据与标尺均保留。

[旧测量记录 JSON](/catalog/bunny/3.1.0/body-measurements-sports-v1.json) · [正面旧标尺 SVG](/characters/bunny/3.1.0/body-v2-measurements-front.svg) · [侧面旧标尺 SVG](/characters/bunny/3.1.0/body-v2-measurements-side.svg) · [背面旧标尺 SVG](/characters/bunny/3.1.0/body-v2-measurements-back.svg)

</details>

## 原01尺寸 · 历史参考 {#original-01-dimensions}

<details>
<summary>展开原01读数与尺寸板</summary>

以下 H、坐标与宽度仅对应[原01身体三视](/characters/bunny/body-base#original-01-reference)，不对应当前 v2 工作稿。保留旧记录以供回溯。

### 比例定义

H 为基模图的冠顶参考线到赤脚地面线：1900 px。不是含兔耳、头发装饰或鞋底的高度，也不是已设定的厘米身高。

### 人物高度定位

以下纵向位置从冠顶参考线向下计量，不混用头发装饰顶端、鞋底或衣物边缘。

<ul><li>头顶参考线：0.0H（源图 y = 143 px）。</li><li>下颏：0.1395H（源图 y = 408 px）。</li><li>肩参考线：0.1821H（源图 y = 489 px）。</li><li>自然腰最窄处：0.33H（源图 y = 770 px）。</li><li>腿间隙起点：0.47H（源图 y = 1036 px）。</li><li>膝参考线：0.7032H（源图 y = 1479 px）。</li><li>踝参考线：0.9121H（源图 y = 1876 px）。</li><li>赤脚地面线：1.0H（源图 y = 2043 px）。</li></ul>

### 人物宽度

<ul><li>正面肩参考轮廓：330 px，即 0.1737H。</li><li>正面自然腰轮廓：206 px，即 0.1084H。</li><li>正面髋／腿根外轮廓：358 px，即 0.1884H。</li><li>背面自然腰轮廓：195 px，即 0.1026H。</li><li>背面髋／腿根外轮廓：355 px，即 0.1868H。</li></ul>

### 适用边界

人物正背轮廓保留各自测量值，不强行拉伸为同宽。侧腰因遮挡未设精确深度。

### 人物尺寸基准

<ReleaseImage src="/characters/bunny/3.1.0/dimension-01-character-dimension-standard.webp" original="/media/bunny/3.1.0/dimension-01-character-dimension-standard.png" alt="原01人物尺寸基准，历史参考" caption="原01人物尺寸板 · 历史参考" />


</details>

<span id="武器外形比例"></span><span id="武器外形尺寸基准"></span>

旧版武器尺寸已移至<a href="/characters/bunny/weapon-history">历史参考</a>，不作为当前标准。当前进展见<a href="/characters/bunny/saw">武器设计状态</a>。
