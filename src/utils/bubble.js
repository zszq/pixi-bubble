import {
  Application,
  Graphics,
  Container,
  Text,
  Assets,
  Sprite,
} from "pixi.js";
import EventEmitter from "eventemitter3";

// 添加事件常量
export const EVENTS = {
  BUBBLE_CLICK: "bubble:click",
  CANVAS_CLICK: "canvas:click",
};

// 默认配置
const defaultConfig = {
  // 渲染相关配置
  background: "#000000", // 画布背景色，支持十六进制颜色
  backgroundAlpha: 1, // 画布背景透明度，范围 0-1
  antialias: true, // 是否开启抗锯齿，true 可以让图形边缘更平滑
  resolution: window.devicePixelRatio || 1, // 渲染分辨率，使用设备像素比以支持高清屏
  autoDensity: true, // 自动调整 Canvas 元素的分辨率以匹配显示密度

  // 气泡运动相关配置
  initialSpeed: 0.8, // 气泡初始运动速度，值越大移动越快
  minSpeed: 0.5, // 气泡最小运动速度，防止气泡完全停止
  collisionDamping: 0.8, // 碰撞后的速度衰减系数，值越小碰撞后减速越多

  // 容器尺寸配置
  wrapperSize: {
    width: 0, // 容器宽度，会在初始化时自动设置
    height: 0, // 容器高度，会在初始化时自动设置
  },

  // 点击烁效果配置
  flashStrokeWidth: 5, // 闪烁时边框宽度，单位为像素
  flashCycleTime: 60, // 闪烁动画周期，单位为帧数（60帧约等于1秒）
  flashAlphaMin: 0, // 闪烁效果最小透明度，范围 0-1
  flashAlphaMax: 1, // 闪烁效果最大透明度，范围 0-1

  // 添加最小文字显示尺寸配置
  minTextDisplaySize: 10, // 当气泡半径小于此值时不显示文字

  // 自动调整气泡数量配置
  areaRatio: null, // 气泡总面积占容器面积的最大比例，null 表示显示所有气泡
};

// 默认样式配置
const defaultStyleConfig = {
  // ID配置
  id: (data) => data.id, // 默认使用数据中的 id 字段

  // 大小配置
  size: 40, // 默认半径大小

  // 颜色配置
  color: 0x4ecdc4,

  // 图片配置
  image: {
    url: null,
    style: {
      relativeSize: 0.4,
      yOffset: -0.5,
      maskRadius: 0.18,
      clipCircular: false,
    },
  },

  // 主文本配置
  mainText: {
    text: (data) => String(data.name),
    style: {
      relativeSize: 0.5,
      yOffset: 0,
      fill: 0xffffff,
      align: "center",
      fontFamily: "Arial",
    },
  },

  // 副文本配置
  subText: {
    text: (data) => String(data.value),
    style: {
      relativeSize: 0.3,
      yOffset: 0.5,
      fill: 0xffffff,
      align: "center",
      fontFamily: "Arial",
    },
  },

  // 添加默认悬停配置
  hover: {
    enabled: true,
    stroke: {
      width: 3,
      color: 0xffffff,
      alpha: 0.8,
    },
    scale: 1,
  },
};

// 气泡节点类
class BubbleNode extends Container {
  constructor(data, styleConfig, globalConfig) {
    super();
    this.data = data;
    this.styleConfig = styleConfig;
    this.globalConfig = globalConfig;

    // 获取气泡 ID
    this.id = this.getStyleValue(this.styleConfig.id);

    // 初始化状态
    this.isFlashing = false;
    this.flashTime = 0;
    this.isHovered = false;
    this.imageSprite = null; // 保存图片精灵的引用
    this.imageMask = null; // 保存图片遮罩的引用

    // 计算气泡半径
    this.radius = this.calculateRadius();

    // 设置初始位置和速度
    this.initializePosition();
    this.initializeVelocity();

    // 创建图形
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    // 初始化气泡
    this.draw();
    this.setupInteraction();
    this.createTexts();
    this.loadImage();

    // 保存对当前闪烁气泡的引用
    this.currentFlashingBubble = null;

    // 添加动画相关属性
    this.isRemoving = false;
    this.removeScale = 1;
    this.removeSpeed = 0.05; // 降低缩小动画速度，使动画更平滑

    // 初始化缩放
    this.scale.set(1);

    // 添加悬停相关属性
    this.originalScale = 1;
    this.currentScale = 1;
  }

  /**
   * 计算气泡半径
   * @returns {number} 计算后的半径
   */
  calculateRadius() {
    return this.getStyleValue(this.styleConfig.size);
  }

  /**
   * 使用外部工具函数
   */
  getStyleValue(style) {
    return getStyleValue(style, this.data);
  }

  /**
   * 初始化位置
   */
  initializePosition() {
    const { width, height } = this.globalConfig.wrapperSize || {
      width: 800,
      height: 600,
    };
    // 随机初始位置（考虑边界）
    this.x = Math.random() * (width - this.radius * 4) + this.radius * 2;
    this.y = Math.random() * (height - this.radius * 4) + this.radius * 2;
  }

  /**
   * 初始化速度
   */
  initializeVelocity() {
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.globalConfig.initialSpeed;
    this.vy = Math.sin(angle) * this.globalConfig.initialSpeed;
  }

  createTexts() {
    // 如果气泡半径小于等于最小文字显示尺寸，则不创建文字
    if (this.radius <= this.globalConfig.minTextDisplaySize) {
      return;
    }

    // 创建主文本
    if (this.styleConfig.mainText) {
      const mainConfig = this.styleConfig.mainText;
      const mainText = this.getStyleValue(mainConfig.text);

      const mainTextSprite = new Text({
        text: mainText,
        style: {
          fontSize:
            this.radius * this.getStyleValue(mainConfig.style.relativeSize),
          fill: this.getStyleValue(mainConfig.style.fill),
          align: this.getStyleValue(mainConfig.style.align),
          fontFamily: this.getStyleValue(mainConfig.style.fontFamily),
        },
      });

      mainTextSprite.anchor.set(0.5);
      mainTextSprite.y =
        this.radius * this.getStyleValue(mainConfig.style.yOffset);
      this.addChild(mainTextSprite);
    }

    // 创建副文字
    if (this.styleConfig.subText) {
      const subConfig = this.styleConfig.subText;
      const subText = this.getStyleValue(subConfig.text);

      const subTextSprite = new Text({
        text: subText,
        style: {
          fontSize:
            this.radius * this.getStyleValue(subConfig.style.relativeSize),
          fill: this.getStyleValue(subConfig.style.fill),
          align: this.getStyleValue(subConfig.style.align),
          fontFamily: this.getStyleValue(subConfig.style.fontFamily),
        },
      });

      subTextSprite.anchor.set(0.5);
      subTextSprite.y =
        this.radius * this.getStyleValue(subConfig.style.yOffset);
      this.addChild(subTextSprite);
    }
  }

  async loadImage() {
    try {
      // 移除旧的图片和遮罩
      if (this.imageSprite) {
        if (this.imageMask) {
          this.removeChild(this.imageMask);
        }
        this.removeChild(this.imageSprite);
        this.imageSprite = null;
        this.imageMask = null;
      }

      const imageConfig = this.styleConfig.image;
      const imageUrl = this.getStyleValue(imageConfig.url);
      const texture = await Assets.load(imageUrl);
      const sprite = new Sprite(texture);

      // 根据气泡大小决定图片大小和位置
      const isSmallBubble = this.radius <= this.globalConfig.minTextDisplaySize;
      const imageSize = isSmallBubble
        ? this.radius * 1.2
        : this.radius * this.getStyleValue(imageConfig.style.relativeSize);

      sprite.width = imageSize;
      sprite.height = imageSize;
      sprite.anchor.set(0.5);

      // 小气泡时图片居中，否则使用配置的偏移
      sprite.y = isSmallBubble
        ? 0
        : this.radius * this.getStyleValue(imageConfig.style.yOffset);

      // 根据配置决定是否裁剪为圆形
      const shouldClipCircular = this.getStyleValue(
        imageConfig.style.clipCircular
      );
      if (shouldClipCircular) {
        const circleMask = new Graphics()
          .circle(
            0,
            sprite.y,
            isSmallBubble
              ? imageSize / 2 // 小泡时遮罩大小与图片大小一致
              : this.radius * this.getStyleValue(imageConfig.style.maskRadius)
          )
          .fill({ color: 0xffffff });

        sprite.mask = circleMask;
        this.imageMask = circleMask;
        this.addChild(circleMask);
      }

      this.imageSprite = sprite;
      this.addChild(sprite);
    } catch (error) {
      console.error("Error loading image:", error);
    }
  }

  /**
   * 处理容器大小变化
   * @param {Object} wrapperSize - 新的容器尺寸
   */
  handleResize(wrapperSize) {
    // 确保气泡在新的容器范围内
    this.x = Math.max(
      this.radius,
      Math.min(wrapperSize.width - this.radius, this.x)
    );
    this.y = Math.max(
      this.radius,
      Math.min(wrapperSize.height - this.radius, this.y)
    );
  }

  /**
   * 获取悬停样式
   * @returns {Object} 悬停样式配置
   */
  getHoverStyle() {
    // 从 styleConfig 中获取悬停配置
    const hoverConfig = this.styleConfig.hover;
    return {
      enabled: this.getStyleValue(hoverConfig.enabled),
      stroke: {
        width: this.getStyleValue(hoverConfig.stroke?.width),
        color: this.getStyleValue(hoverConfig.stroke?.color),
        alpha: this.getStyleValue(hoverConfig.stroke?.alpha),
      },
      scale: this.getStyleValue(hoverConfig.scale),
    };
  }

  /**
   * 绘制气泡
   */
  draw() {
    this.graphics.clear();

    const color = this.getStyleValue(this.styleConfig.color);
    const hoverStyle = this.getHoverStyle();

    // 绘制悬停效果
    if (this.isHovered && hoverStyle.enabled) {
      // 绘制边框
      if (hoverStyle.stroke) {
        this.graphics.circle(0, 0, this.radius + 1).stroke({
          width: hoverStyle.stroke.width,
          color: hoverStyle.stroke.color,
          alpha: hoverStyle.stroke.alpha,
          join: "round",
          cap: "round",
          alignment: 0.5,
        });
      }

      // 应用缩放
      if (hoverStyle.scale !== 1) {
        this.scale.set(hoverStyle.scale);
      }
    } else {
      this.scale.set(1);
    }

    // 绘制闪烁效果
    if (this.isFlashing) {
      const cyclePosition = (this.flashTime % 60) / 60;
      const flashAlpha = Math.sin(cyclePosition * Math.PI);

      const strokeWidth = this.globalConfig.flashStrokeWidth || 3;
      this.graphics.circle(0, 0, this.radius + strokeWidth / 2).stroke({
        width: strokeWidth,
        color: color,
        alpha: flashAlpha,
        join: "round",
        cap: "round",
        alignment: 0.5,
      });
    }

    // 绘制主体
    this.graphics.circle(0, 0, this.radius).fill({ color: color, alpha: 0.1 });

    // 绘制边缘渐变
    const shadowWidth = this.radius * 0.2;
    for (let i = 0; i < shadowWidth; i++) {
      const progress = i / shadowWidth;
      const alpha = 0.8 * (1 - progress);

      this.graphics.circle(0, 0, this.radius - i).stroke({
        width: 1,
        color: color,
        alpha: alpha,
        alignment: 0.5,
      });
    }
  }

  /**
   * 设置交互事件
   */
  setupInteraction() {
    this.eventMode = "static";
    this.cursor = "pointer";

    this.addEventListener("pointerenter", () => {
      if (!this.isFlashing && !this.isRemoving) {
        this.isHovered = true;
        this.draw();
      }
    });

    this.addEventListener("pointerleave", () => {
      this.isHovered = false;
      this.draw();
    });

    this.addEventListener("click", (event) => {
      this.startFlashing();

      // 触发气泡点击事件
      this.globalConfig.events.emit(EVENTS.BUBBLE_CLICK, {
        data: this.data,
        id: this.id,
      });

      // 阻止事件继续传播
      event.stopPropagation();
    });
  }

  /**
   * 开始闪烁效果
   */
  startFlashing() {
    // 停止其他泡的闪烁效果
    if (
      this.globalConfig.currentFlashingBubble &&
      this.globalConfig.currentFlashingBubble !== this
    ) {
      this.globalConfig.currentFlashingBubble.stopFlashing();
    }

    this.isHovered = false;
    this.isFlashing = true;
    this.flashTime = 0;
    this.globalConfig.currentFlashingBubble = this;
  }

  /**
   * 停止闪烁效果
   */
  stopFlashing() {
    this.isFlashing = false;
    if (this.globalConfig.currentFlashingBubble === this) {
      this.globalConfig.currentFlashingBubble = null;
    }
    this.draw();
  }

  /**
   * 更新气泡状态
   */
  update() {
    // 更新位置
    this.x += this.vx;
    this.y += this.vy;

    // 碰撞检测
    const { width, height } = this.globalConfig.wrapperSize;
    if (this.x < this.radius || this.x > width - this.radius) {
      this.vx *= -1;
      this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    }
    if (this.y < this.radius || this.y > height - this.radius) {
      this.vy *= -1;
      this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    }

    // 更新闪烁效果
    if (this.isFlashing) {
      this.flashTime += 1;
      this.draw();
    }

    // 处理移除动画
    if (this.isRemoving) {
      this.removeScale = Math.max(0, this.removeScale - this.removeSpeed);

      // 设置缩放
      this.scale.set(this.removeScale);

      // 当缩放接近 0 时完成动画
      if (this.removeScale <= 0.01) {
        this.removeScale = 0;
        this.scale.set(0);
        if (this.onRemoveComplete) {
          this.onRemoveComplete();
        }
      }
    }
  }

  /**
   * 开始移除动画
   * @param {Function} onComplete - 动画完成后的回调函数
   */
  startRemoveAnimation(onComplete) {
    this.isRemoving = true;
    this.removeScale = 1;
    this.onRemoveComplete = onComplete;

    // 停止移动
    this.vx = 0;
    this.vy = 0;
  }
}

// 主气泡图类
class BubbleChart {
  constructor(options = {}) {
    // 分离全局配置和样式配置
    const { styleConfig, ...globalConfig } = options;

    // 深度合并默认配置和用户配置
    this.config = mergeConfig(defaultConfig, globalConfig);

    // 运行时状
    this.config.currentFlashingBubble = null;

    this.container = null;
    this.app = null;
    this.bubbles = [];

    // 合并默认样式配置和用户样式配置
    this.currentStyleConfig = mergeConfig(
      defaultStyleConfig,
      styleConfig || {}
    );

    this.resizeObserver = null;

    // 添加事件发射器
    this.events = new EventEmitter();

    // 将 events 添加到 config 中，这样 BubbleNode 可以访问
    this.config.events = this.events;
  }

  /**
   * 初始化图表
   * @param {HTMLElement} container - 容器元素
   */
  async initialize(container) {
    this.container = container;

    // 设置容器大小监听
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    this.resizeObserver.observe(container);

    // 初始化容器尺寸
    const rect = container.getBoundingClientRect();
    this.config.wrapperSize.width = rect.width;
    this.config.wrapperSize.height = rect.height;

    // 创建
    this.app = new Application();
    await this.app.init({
      background: this.config.background,
      backgroundAlpha: this.config.backgroundAlpha,
      antialias: this.config.antialias,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      resizeTo: container,
    });

    container.appendChild(this.app.canvas);

    // 启动动画循环
    this.app.ticker.add(this.update.bind(this));

    // 改为使用 click 事件
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.addEventListener("click", (event) => {
      // 只有当点击目标是舞台本身时才触发 canvas 点击事件
      if (event.target === this.app.stage) {
        // 如果有正在闪烁的气泡，停止其闪烁效果
        if (this.config.currentFlashingBubble) {
          this.config.currentFlashingBubble.stopFlashing();
        }

        this.events.emit(EVENTS.CANVAS_CLICK, event);
      }
    });
  }

  /**
   * 设置数据
   * @param {Array} data - 要设置的数据
   */
  setData(data) {
    // 根据配置决定是否需要调整气泡数量
    const processedData =
      this.config.areaRatio != null ? this.adjustBubblesCount(data) : data;

    // 清除现有气泡
    if (this.config.currentFlashingBubble) {
      this.config.currentFlashingBubble.stopFlashing();
    }
    this.bubbles.forEach((bubble) => bubble.destroy());
    this.bubbles = [];

    // 创建新气泡
    this.bubbles = processedData.map((item) => {
      const bubble = new BubbleNode(item, this.currentStyleConfig, this.config);
      this.app.stage.addChild(bubble);
      return bubble;
    });
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    this.config.wrapperSize.width = rect.width;
    this.config.wrapperSize.height = rect.height;

    // 更新所有气泡的位置
    this.bubbles.forEach((bubble) =>
      bubble.handleResize(this.config.wrapperSize)
    );
  }

  /**
   * 更新动画
   */
  update() {
    // 更新所有泡
    this.bubbles.forEach((bubble) => bubble.update());

    // 处理碰撞
    this.handleCollisions();
  }

  /**
   * 处理气泡之间的碰撞
   */
  handleCollisions() {
    for (let i = 0; i < this.bubbles.length; i++) {
      for (let j = i + 1; j < this.bubbles.length; j++) {
        const b1 = this.bubbles[i];
        const b2 = this.bubbles[j];

        // 计算气泡间距离
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = b1.radius + b2.radius;

        // 处理碰撞
        if (distance < minDistance) {
          // 计算碰撞角度
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          // 分离重叠的气泡 - 添加缓动系数使分离更平滑
          const separationFactor = 0.1; // 降低分离速度的系数
          const overlap = (minDistance - distance) / 2;
          b1.x -= overlap * cos * separationFactor;
          b1.y -= overlap * sin * separationFactor;
          b2.x += overlap * cos * separationFactor;
          b2.y += overlap * sin * separationFactor;

          // 交换速度（带衰减）
          const temp_vx = b1.vx;
          const temp_vy = b1.vy;

          b1.vx = b2.vx * this.config.collisionDamping;
          b1.vy = b2.vy * this.config.collisionDamping;
          b2.vx = temp_vx * this.config.collisionDamping;
          b2.vy = temp_vy * this.config.collisionDamping;

          // 确保最小速度
          const normalizeSpeed = (bubble) => {
            const currentSpeed = Math.sqrt(
              bubble.vx * bubble.vx + bubble.vy * bubble.vy
            );
            if (currentSpeed < this.config.minSpeed) {
              const scale = this.config.minSpeed / currentSpeed;
              bubble.vx *= scale;
              bubble.vy *= scale;
            }
          };

          normalizeSpeed(b1);
          normalizeSpeed(b2);
        }
      }
    }
  }

  /**
   * 销毁图表
   */
  destroy() {
    if (this.config.currentFlashingBubble) {
      this.config.currentFlashingBubble.stopFlashing();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.app) {
      this.app.destroy(true);
    }
    this.bubbles = [];
  }

  /**
   * 更新指定气泡的样式
   * @param {string|number} id - 气泡的ID
   * @param {Object} styleConfig - 要更新的样式配置
   */
  updateBubbleStyle(id, styleConfig) {
    // 检查 styleConfig 参数
    if (!styleConfig || Object.keys(styleConfig).length === 0) {
      console.error(
        "updateBubbleStyle: No style configuration provided for bubble:",
        id
      );
      return;
    }

    // 1. 查找气泡
    const bubble = this.bubbles.find((b) => b.id === id);
    if (!bubble) {
      console.warn(`Bubble with id ${id} not found`);
      return;
    }

    // 2. 更新样式配置
    bubble.styleConfig = mergeConfig(bubble.styleConfig, styleConfig);

    // 3. 确定需要更新的组件
    const updates = {
      size: false, // 是否更新大小
      image: false, // 是否更新图片
      text: false, // 是否更新文字
    };

    // 检查大小更新
    if (styleConfig.size) {
      const oldRadius = bubble.radius;
      bubble.radius = bubble.calculateRadius();
      updates.size = oldRadius !== bubble.radius;
    }

    // 检查图片更新
    if (styleConfig.image?.url || styleConfig.image?.style || updates.size) {
      updates.image = true;
    }

    // 检查文字更新
    if (styleConfig.mainText || styleConfig.subText || updates.size) {
      updates.text = true;
    }

    // 4. 执行更新
    // 更新文字
    if (updates.text) {
      bubble.removeChild(
        ...bubble.children.filter((child) => child instanceof Text)
      );
      bubble.createTexts();
    }

    // 更新图片
    if (updates.image) {
      bubble.loadImage();
    }

    // 5. 重新绘制气泡
    bubble.draw();
  }

  // 添加事件监听方法
  on(eventName, callback) {
    this.events.on(eventName, callback);
  }

  // 添加事件移除方法
  off(eventName, callback) {
    this.events.off(eventName, callback);
  }

  /**
   * 删除指定 ID 的气泡
   * @param {string|number} id - 要删除的气泡 ID
   * @returns {Promise<boolean>} - 是否成功删除
   */
  removeBubble(id) {
    return new Promise((resolve) => {
      // 查找气泡索引
      const index = this.bubbles.findIndex((bubble) => bubble.id === id);

      // 如果找不到气泡，返回 false
      if (index === -1) {
        console.warn(`Bubble with id ${id} not found`);
        resolve(false);
        return;
      }

      const bubble = this.bubbles[index];

      // 如果是正在闪烁的气泡，停止闪烁
      if (this.config.currentFlashingBubble === bubble) {
        bubble.stopFlashing();
        this.config.currentFlashingBubble = null;
      }

      // 开始移除动画
      bubble.startRemoveAnimation(() => {
        // 动画完成后从舞台中移除
        this.app.stage.removeChild(bubble);

        // 销毁气泡
        bubble.destroy();

        // 从数组中移除
        this.bubbles.splice(index, 1);

        resolve(true);
      });
    });
  }

  /**
   * 删除多个气泡
   * @param {Array<string|number>} ids - 要删除的气泡 ID 数组
   * @returns {Promise<Array<string|number>>} - 成功删除的气泡 ID 数组
   */
  async removeBubbles(ids) {
    if (!Array.isArray(ids)) {
      console.error("removeBubbles: ids must be an array");
      return [];
    }

    const removedIds = [];
    for (const id of ids) {
      const removed = await this.removeBubble(id);
      if (removed) {
        removedIds.push(id);
      }
    }

    return removedIds;
  }

  /**
   * 根据容器面积调整气泡数量
   * @param {Array} data - 原始数据数组
   * @returns {Array} - 调整后的数据数组
   */
  adjustBubblesCount(data) {
    const containerArea =
      this.config.wrapperSize.width * this.config.wrapperSize.height;
    const maxTotalArea = containerArea * this.config.areaRatio;

    // 使用全局工具函数而不是类方法
    const bubbleAreas = data.map((item) => {
      const radius = getStyleValue(this.currentStyleConfig.size, item);
      const area = Math.PI * radius * radius;
      return { item, radius, area };
    });

    // 按面积从大到小排序
    bubbleAreas.sort((a, b) => b.area - a.area);

    // 累加计算面积，找出可以显示的气泡
    let totalArea = 0;
    const visibleBubbles = [];

    for (const { item, area } of bubbleAreas) {
      if (totalArea + area <= maxTotalArea) {
        visibleBubbles.push(item);
        totalArea += area;
      } else {
        break;
      }
    }

    console.log(
      `Adjusted bubbles count from ${data.length} to ${visibleBubbles.length} (area ratio: ${this.config.areaRatio})`
    );
    return visibleBubbles;
  }

  /**
   * 更新配置
   * @param {Object} options - 新的配置对象
   */
  updateStyle(options = {}) {
    // 分离全局配置和样式配置
    const { styleConfig, ...globalConfig } = options;

    // 更新全局配置
    if (Object.keys(globalConfig).length > 0) {
      this.config = mergeConfig(this.config, globalConfig);
    }

    // 更新样式配置
    if (styleConfig) {
      this.currentStyleConfig = mergeConfig(
        this.currentStyleConfig,
        styleConfig
      );
    }

    // 重新创建所有气泡以应用新配置
    if (this.bubbles.length > 0) {
      const currentData = this.bubbles.map((bubble) => bubble.data);
      this.setData(currentData);
    }
  }
}

// 深度合并置对象
function mergeConfig(defaultConfig, userConfig) {
  const result = { ...defaultConfig };

  for (const key in userConfig) {
    if (userConfig.hasOwnProperty(key)) {
      if (
        typeof userConfig[key] === "object" &&
        userConfig[key] !== null &&
        typeof defaultConfig[key] === "object" &&
        defaultConfig[key] !== null
      ) {
        // 递归合并嵌套对象
        result[key] = mergeConfig(defaultConfig[key], userConfig[key]);
      } else {
        // 直接覆盖非对象值
        result[key] = userConfig[key];
      }
    }
  }

  return result;
}

// 获取样式值 - 支持常量函数两种方式
function getStyleValue(style, data) {
  if (style == null) {
    return null;
  }

  // 处理函数
  if (typeof style === "function") {
    return style(data);
  }

  // 返回原始值
  return style;
}

export default BubbleChart;
