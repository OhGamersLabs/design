---
title: "v2 · 图面尺寸与比例"
releaseReady: false
aside: true
---
<script setup>
import BodyMeasurements from '../../.vitepress/theme/components/BodyMeasurements.vue'
import measurements from '../../../catalog/bunny/3.1.0/body-measurements.json'
import GarmentMeasurements from '../../.vitepress/theme/components/GarmentMeasurements.vue'
import garments from '../../../catalog/bunny/3.1.0/garment-measurements.json'
</script>
<span id="人物与武器统一尺寸"></span>

# v2 · 图面尺寸与比例

本页先记录[当前完整新绘的基础文胸三视](/characters/bunny/body-base)的身体比例，再列出[白衣、红裤与夹克的尺寸规范](#garment-dimensions)和[黑曜石感大剑的概念尺寸](#obsidian-sword-dimensions)。原有身体取点与数值保持，服装另用固定设计单位比对各张图，避免换一层衣服就改动衣长或裤腰位置。当前资料仍是二维投影，不作为衣物成品尺寸或穿鞋后身体总高。

::: info 图面比例与实际设定
**H** 是可见发冠最高点至赤脚地面的图面高度；**h** 是可见发冠至下颏的头高，包含发量，不另估被头发遮住的颅顶。头身比为 H ÷ h。

当前记录的是原图像素与占 H 的比例，**厘米身高尚未设定**。肩、腰、胯和胸部宽度是指定水平线上的可见投影，不是骨骼尺寸或胸腰臀围。正面衣物胸宽取基础文胸杯外缘的指定截面，不计外侧腋前肤线，也不是最大裸胸宽或杯码。图面躯干段与腿长的起止点见各项定义。
:::

## 当前工作稿尺寸 {#current-body-measurements}

选择视角查看同一张原图上的标尺与读数。表中的“—”表示遮挡或无法可靠取点，未用其他视角补值。近似取点的容差只表示线宽与选点范围，不代表统计精度。

<BodyMeasurements :data="measurements" />

[查看三张完整原图与等高对照](/characters/bunny/body-base) · [下载三视标尺与测量数据](/characters/bunny/downloads#body-measurements)

## 服装尺寸规范与逐图核对 {#garment-dimensions}

白色内搭与红色短裤以第一层衣形固定尺寸。夹克采用**前长后短**：前襟略盖白衣，后中露出窄白边，侧摆连续斜切。先看设计值，再用下方标尺核对各图的实际偏差。

<GarmentMeasurements :data="garments" />

[下载服装规范 JSON 与标尺 SVG](/characters/bunny/downloads#garment-dimensions) · [白衣红裤原图](/characters/bunny/innerwear) · [夹克设计](/characters/bunny/jacket)

## 黑曜石感大剑 · 设计尺寸 {#obsidian-sword-dimensions}

**H0** 固定取当前正面身体基准的可见发冠至赤脚地面：1475 px（y=25→1500）；同图头高 h0=225 px。这里的像素只标识基准，实际厘米身高尚未设定。

总长 **L=0.85H0** 是设计设定。下表按当前加厚概念板的正面、侧面分别以本视图总长换算；单件板没有人物，尚未完成与身体的实际对位。

| 部位 | 按 L=0.85H0 换算的设计比例 | 当前原图读数与定义 |
| --- | --- | --- |
| 整剑总长 L | 0.850H0 | 正面 948 px（y=9→957）；侧面 947 px（y=10→957），最远剑尖至柄尾外端 |
| 剑身长度 | 正面 0.617H0；侧面 0.617H0 | 正面 688 px；侧面 687 px；剑尖至中央金属根座朝剑尖的最前缘（y=697） |
| 根座、缠绕柄与柄尾总段 | 正面 0.233H0；侧面 0.233H0 | 两视均为 260 px；y=697→957 |
| 可见红黑缠绕段 | 正面 0.163H0；侧面 0.162H0 | 正面 182 px（y=736→918）；侧面 181 px（y=737→918），包括红色缠绕 |
| 其中可见黑色缠绕段 | 正面 0.142H0；侧面 0.142H0 | 两视均为 158 px；y=760→918 |
| 剑身最大正面宽度 W | 0.178H0 | 198 px；y=293 截面，x=358→556 |
| 剑身最大侧面厚度 T | 0.067H0 | 75 px；y=511 截面，x=731→806 |

宽度和厚度均为**垂直于长轴的同一截面**上的距离。当前厚宽比 T/W=75/198≈**0.38**；按总长同比例对齐所选材质参考稿，侧厚增加约 91.5%，正面最大宽度增加约 4.3%。正侧总长相差 1 px，属于图面估读范围。

每个端点估读约 ±2 px，两端距离的保守取点范围约 ±4 px；相应厚宽比范围约为 0.351–0.407。表中比例按读数除以本视图总长再乘 0.85，显示值经四舍五入。可见缠绕段不是实际可握功能长度，取点范围也不代表制造精度。

[查看加厚正侧与断口细节原件](/characters/bunny/weapon#obsidian-sword-concept)。这些是原创外观设计比例，尚无人物握持、背负或承载验证。

<details>
<summary>此前纯黑正面稿 · 历史尺寸记录</summary>

以下为旧正面稿当时的读数与试设，已被上方加厚方案取代；旧“可握柄段”仅是当时的图面标签，未经过握持功能验证。

| 部位 | 当时设计比例 | 正面原图读数与定义 |
| --- | --- | --- |
| 整剑总长 L | 0.850H0 | 1211 px；最远剑尖至柄尾外端，x=22→1233 |
| 剑身长度 | 0.620H0（0.7291L） | 883 px；最远剑尖至根座前缘（靠剑尖一侧），x=22→905 |
| 护手、握柄与柄尾总段 | 0.230H0（0.2709L） | 328 px；x=905→1233 |
| 可握柄段 | 0.185H0（0.2172L） | 263 px；x=938→1201 |
| 剑身最大正面宽度 | 0.172H0（0.2023L） | 245 px；垂直于长轴的同一截面最大正面宽度 |
| 剑身最大侧面厚度 | 0.028H0（待校核目标） | 侧视尚未通过，暂无厚度实测 |

旧侧视未通过，0.028H0 仅为当时的待校核目标，现已停止使用。旧原图仍在[武器页历史方案](/characters/bunny/weapon#obsidian-sword-concept)保留。

</details>

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

旧版武器尺寸已移至<a href="/characters/bunny/weapon-history">历史参考</a>，不作为当前标准。当前大剑概念见<a href="/characters/bunny/weapon#obsidian-sword-concept">武器设计页</a>与<a href="#obsidian-sword-dimensions">本页设计尺寸</a>。
