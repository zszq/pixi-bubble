<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import BubbleChart, { EVENTS } from "./utils/bubble";

// 示例数据
const bubbleData = [
  {
    icon: "/icon/trade_pairs/binance/BTC_TUSD.png",
    symbol: "BTC",
    tradeInflow: 60397960.14850282,
    tradeAmount: 579541109.450411,
    keyword: 1,
    marketCap: "1902956070320.312",
    favor: false,
    tradeIn: 319969534.7994569,
    tradeOut: 259571574.65095407,
  },
  {
    icon: "/icon/trade_pairs/binance/USDC_USDT.png",
    symbol: "USDC",
    tradeInflow: 27913582.426300064,
    tradeAmount: 135135085.2559,
    keyword: 3408,
    marketCap: "39999328085.79726",
    favor: false,
    tradeIn: 81524333.84110004,
    tradeOut: 53610751.414799966,
  },
  {
    icon: "/icon/trade_pairs/binance/FDUSD_USDT.png",
    symbol: "FDUSD",
    tradeInflow: -18478898.472299997,
    tradeAmount: 57237111.22510019,
    keyword: 26081,
    marketCap: "1888323396.336139",
    favor: false,
    tradeIn: 19379106.3764001,
    tradeOut: 37858004.84870009,
  },
  {
    icon: "/icon/trade_pairs/binance/XRP_USDT.png",
    symbol: "XRP",
    tradeInflow: 11362867.8486,
    tradeAmount: 127393379.62220004,
    keyword: 52,
    marketCap: "148334051805.5802",
    favor: false,
    tradeIn: 69378123.73540002,
    tradeOut: 58015255.88680002,
  },
  {
    icon: "/icon/trade_pairs/binance/CRV_USDT.png",
    symbol: "CRV",
    tradeInflow: 4572926.825109997,
    tradeAmount: 21522034.93907,
    keyword: 6538,
    marketCap: "1120876181.095464",
    favor: false,
    tradeIn: 13047480.882089999,
    tradeOut: 8474554.056980003,
  },
  {
    icon: "/icon/trade_pairs/binance/TRX_USDT.png",
    symbol: "TRX",
    tradeInflow: 3818500.4631899847,
    tradeAmount: 47419204.05798993,
    keyword: 1958,
    marketCap: "29766096251.75593",
    favor: false,
    tradeIn: 25618852.260589957,
    tradeOut: 21800351.797399975,
  },
  {
    icon: "/icon/trade_pairs/binance/DOGE_USDT.png",
    symbol: "DOGE",
    tradeInflow: -3255539.1934699705,
    tradeAmount: 142046091.74674994,
    keyword: 74,
    marketCap: "60144050138.873924",
    favor: false,
    tradeIn: 69395276.27663998,
    tradeOut: 72650815.47010995,
  },
  {
    icon: "/icon/trade_pairs/binance/ETH_USDT.png",
    symbol: "ETH",
    tradeInflow: -2988721.01025299,
    tradeAmount: 197802251.779819,
    keyword: 1027,
    marketCap: "436178285407.34595",
    favor: false,
    tradeIn: 97406765.38478301,
    tradeOut: 100395486.395036,
  },
  {
    icon: "/icon/trade_pairs/binance/NEIRO_USDT.png",
    symbol: "NEIRO",
    tradeInflow: -1042841.35309591,
    tradeAmount: 9127518.787768366,
    keyword: 32521,
    marketCap: "708723281.771085",
    favor: false,
    tradeIn: 4042338.717336228,
    tradeOut: 5085180.070432138,
  },
  {
    icon: "/icon/trade_pairs/binance/REN_USDT.png",
    symbol: "REN",
    tradeInflow: -577307.1529799995,
    tradeAmount: 4020058.4328999994,
    keyword: 2539,
    marketCap: "50365510.117823",
    favor: false,
    tradeIn: 1721375.6399599998,
    tradeOut: 2298682.7929399996,
  },
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT3",
    tradeInflow: 800000000,
    tradeAmount: 400000000,
    keyword: 9999,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT11",
    tradeInflow: -800000,
    tradeAmount: 400000000,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT22",
    tradeInflow: 800000,
    tradeAmount: 400000000,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT33",
    tradeInflow: 8000,
    tradeAmount: 400000000,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT44",
    tradeInflow: 800000,
    tradeAmount: 400000000,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT55",
    tradeInflow: 80000,
    tradeAmount: 400000000,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
];

function setRadius(data, minRadius, maxRadius) {
  // 获取 tradeInflow 的最小值和最大值
  const tradeInflowValues = data.map((item) => Math.abs(item.tradeInflow));
  const minValue = Math.min(...tradeInflowValues);
  const maxValue = Math.max(...tradeInflowValues);

  // 定义对数映射函数
  const mapToRange = (value, minIn, maxIn, minOut, maxOut) => {
    // 避免取对数时出现 0 或负数
    const epsilon = 1e-10;

    // 对输入值取对数
    const logValue = Math.log(value + epsilon);
    const logMin = Math.log(minIn + epsilon);
    const logMax = Math.log(maxIn + epsilon);

    // 使用对数值进行映射
    return (
      ((logValue - logMin) / (logMax - logMin)) * (maxOut - minOut) + minOut
    );
  };

  // 为每一项添加 r 属性
  data.forEach((item) => {
    item.r = mapToRange(
      Math.abs(item.tradeInflow),
      minValue,
      maxValue,
      minRadius,
      maxRadius
    );
  });

  return data;
}
const newData = setRadius(bubbleData, 50, 200);
// console.log(newData);

const bubbleChart = new BubbleChart({
  // 全局配置
  background: "#1a1a1a",
  initialSpeed: 0.3,
  minSpeed: 0.1,
  collisionDamping: 0.8,
  minTextDisplaySize: 50, // 最小文本显示大小
  // areaRatio: 0.2, // 气泡总面积最多占容器面积的比例

  // 节点样式配置
  styleConfig: {
    id: (data) => data.symbol,
    size: (data) => data.r,
    color: (data) => (data.tradeInflow >= 0 ? 0x00ff00 : 0xff0000),

    // 悬停效果配置
    hover: {
      enabled: () => true,
      stroke: {
        width: (data) => (data.tradeInflow >= 0 ? 4 : 6),
        color: (data) => (data.tradeInflow >= 0 ? 0x00ff00 : 0xff0000),
        alpha: (data) => (data.tradeInflow >= 0 ? 0.8 : 0.5),
      },
      // scale: (data) => data.tradeInflow >= 0 ? 1.15 : 0.85,
    },

    image: {
      url: (data) => data.icon,
      style: {
        relativeSize: 0.4,
        yOffset: -0.5,
        maskRadius: 0.18,
        clipCircular: false,
      },
    },

    mainText: {
      text: (data) => data.symbol,
      style: {
        relativeSize: 0.5,
        yOffset: 0,
        fill: (data) => (data.tradeInflow >= 0 ? 0xffffff : 0xcccccc),
        align: "center",
      },
    },

    subText: {
      text: (data) => formatNumberWithUnits(data.tradeInflow),
      style: {
        relativeSize: 0.3,
        yOffset: 0.5,
        fill: (data) => (data.tradeInflow >= 0 ? 0xffffff : 0xcccccc),
        align: "center",
      },
    },
  },
});

onMounted(async () => {
  const container = document.querySelector(".canvas-wrapper");
  await bubbleChart.initialize(container);

  // 监听气泡点击事件
  bubbleChart.on(EVENTS.BUBBLE_CLICK, ({ data, id }) => {
    console.log("Bubble clicked:", {
      id,
      symbol: data.symbol,
      tradeInflow: data.tradeInflow,
      marketCap: data.marketCap,
    });
  });

  // 监听画布点击事件
  bubbleChart.on(EVENTS.CANVAS_CLICK, () => {
    console.log("Canvas background clicked");
  });

  // 现在只需要传入数据即可，样式已经在实例化时配置
  bubbleChart.setData(newData);
});

onBeforeUnmount(() => {
  // 移除事件监听
  bubbleChart.off(EVENTS.BUBBLE_CLICK);
  bubbleChart.off(EVENTS.CANVAS_CLICK);

  // 销毁图表
  bubbleChart.destroy();
});

function formatNumberWithUnits(number) {
  if (typeof number !== "number" && typeof number !== "string") {
    throw new Error("Input must be a number or a numeric string.");
  }

  // 将输入转换为数字
  const num = Number(number);
  if (isNaN(num)) {
    throw new Error("Input must be a valid number.");
  }

  // 保存负号信息
  const isNegative = num < 0;

  // 取绝对值进行处理
  const absNum = Math.abs(num);

  // 定义单位和值
  const units = [
    { value: 1e9, suffix: "B" }, // 十亿
    { value: 1e6, suffix: "M" }, // 百万
    { value: 1e3, suffix: "K" }, // 千
  ];

  // 检查是否需要转换为单位
  for (let i = 0; i < units.length; i++) {
    if (absNum >= units[i].value) {
      const formatted = (absNum / units[i].value).toFixed(2); // 保留两位小数
      return `${isNegative ? "-" : ""}${formatted.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ","
      )}${units[i].suffix}`;
    }
  }

  // 如果没有单位转换，直接千分化
  const formattedNumber = absNum
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return isNegative ? `-${formattedNumber}` : formattedNumber;
}

// 更新指定气泡的样式
function updateBubbleStyle() {
  bubbleChart.updateBubbleStyle("BTC", {
    size: 100,
    color: 0xff0000,
    image: {
      url: "/icon/trade_pairs/binance/DOT_USDT.png",
      style: {
        clipCircular: true,
      },
    },
    mainText: {
      style: {
        fill: 0xffff00,
      },
    },
  });
}

// 简化测试数据2
const testData2 = [
  // ...bubbleData,
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT1",
    tradeInflow: -800000000,
    tradeAmount: 400000000,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
  {
    icon: "/icon/trade_pairs/binance/DOT_USDT.png",
    symbol: "DOT2",
    tradeInflow: 800000,
    tradeAmount: 400000000,
    marketCap: "999999999",
    favor: false,
    tradeIn: 200000000,
    tradeOut: 120000000,
  },
];

// 简化测试函数
function testSetData() {
  const newTestData = setRadius(testData2, 50, 200);
  bubbleChart.setData(newTestData);
}

function testSetDataWithStyle() {
  const newTestData = setRadius(testData2, 50, 200);

  // 更新全局配置和样式配置
  bubbleChart.updateStyle({
    // 全局配置
    areaRatio: 0.4,
    minTextDisplaySize: 40,

    // 样式配置
    styleConfig: {
      color: (data) => (data.tradeInflow >= 0 ? 0x00ff00 : 0xff0000),
      hover: {
        enabled: true,
        stroke: {
          width: (data) => (data.tradeInflow >= 0 ? 6 : 10),
          color: (data) => (data.tradeInflow >= 0 ? "pink" : "white"),
        },
        scale: (data) => (data.tradeInflow >= 0 ? 1.15 : 0.85),
      },
      image: {
        style: {
          relativeSize: 0.5,
          clipCircular: true,
        },
      },
      mainText: {
        style: {
          relativeSize: 0.4,
          fill: (data) =>
            data.symbol === "DOT"
              ? 0xffff00
              : data.tradeInflow >= 0
              ? 0xffffff
              : 0xcccccc,
        },
      },
    },
  });

  bubbleChart.setData(newTestData);
}

// 恢复原始数据
function restoreOriginalData() {
  console.log("Restoring original data...");
  const originalData = setRadius(bubbleData, 50, 200);
  // 使用实例化时的配置
  bubbleChart.setData(originalData);
}

// 删除单个气泡
async function removeSingleBubble() {
  const removed = await bubbleChart.removeBubble("BTC");
  if (removed) {
    console.log("Successfully removed BTC bubble");
  }
}

// 删除多个气泡
async function removeMultipleBubbles() {
  const idsToRemove = ["ETH", "USDC", "DOGE"];
  const removedIds = await bubbleChart.removeBubbles(idsToRemove);
  console.log("Successfully removed bubbles:", removedIds);
}
</script>

<template>
  <div>
    <div class="canvas-wrapper"></div>

    <div class="controls">
      <button @click="restoreOriginalData">恢复原始数据</button>
      <button @click="updateBubbleStyle">更新气泡样式</button>
      <button @click="testSetData">测试 setData</button>
      <button @click="testSetDataWithStyle">测试 setData 带样式</button>
      <button @click="removeSingleBubble">删除单个气泡</button>
      <button @click="removeMultipleBubbles">删除多个气泡</button>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.canvas-wrapper {
  width: 80vw;
  height: 80vh;
  border: 1px solid #ccc;
  margin: 0 auto;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover {
  background-color: #45a049;
}
</style>
