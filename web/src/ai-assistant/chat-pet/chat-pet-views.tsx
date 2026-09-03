import React, { useState, useEffect, useRef, useCallback } from "react";
import "./chat-pet-views.css";

export type PetStatus =
  | "idle"
  | "thinking"
  | "responding"
  | "tool"
  | "waiting"
  | "error"
  | "done";

interface PetConfig {
  id: string;
  displayName: string;
  description: string;
  spritesheetPath: string;
}

type PetState =
  | "idle"
  | "runRight"
  | "runLeft"
  | "wave"
  | "jump"
  | "fail"
  | "wait"
  | "run"
  | "look";

interface ChatPetViewsProps {
  status?: PetStatus;
  title?: string;
  content?: string;
}

const statusToStateMap: Record<PetStatus, PetState> = {
  idle: "idle",
  thinking: "look",
  responding: "run",
  tool: "jump",
  waiting: "wait",
  error: "fail",
  done: "wave",
};

interface Position {
  x: number;
  y: number;
}

// 宠物精灵尺寸，与css保持一致
const PET_WIDTH = 96;
const PET_HEIGHT = 104;

/** 将坐标约束在视口范围内，返回合法pos */
function clampPetPosition(pos: Position): Position {
  const maxX = Math.max(0, window.innerWidth - PET_WIDTH);
  const maxY = Math.max(0, window.innerHeight - PET_HEIGHT);
  return {
    x: Math.max(0, Math.min(pos.x, maxX)),
    y: Math.max(0, Math.min(pos.y, maxY)),
  };
}

/** 获取右下角默认位置 */
function getDefaultBottomRightPos(): Position {
  return clampPetPosition({
    x: window.innerWidth - 160,
    y: window.innerHeight - 145,
  });
}

export default function ChatPetViews({
  status = "idle",
  title,
  content,
}: ChatPetViewsProps) {
  const [petConfig, setPetConfig] = useState<PetConfig | null>(null);
  const [currentState, setCurrentState] = useState<PetState>("idle");
  const currentStateRef = useRef(currentState);
  const [dialogueConfig, setDialogueConfig] = useState<{
    title?: string;
    content?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [petPos, setPetPos] = useState<Position>(() => getDefaultBottomRightPos());

  // 存储宠物在窗口中的相对比例（0~1）
  const ratioRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // 标记是否已初始化比例（首次加载）
  const isRatioInitRef = useRef(false);

  const lastPosRef = useRef<Position>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 同步state到ref
  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  const stateMap = {
    idle: { row: 0, frames: 6, duration: 1100 },
    runRight: { row: 1, frames: 8, duration: 1060 },
    runLeft: { row: 2, frames: 8, duration: 1060 },
    wave: { row: 3, frames: 4, duration: 700 },
    jump: { row: 4, frames: 5, duration: 840 },
    fail: { row: 5, frames: 8, duration: 1220 },
    wait: { row: 6, frames: 6, duration: 1010 },
    run: { row: 7, frames: 6, duration: 820 },
    look: { row: 8, frames: 6, duration: 1030 },
  };

  const current = stateMap[currentState];
  const petPath = "/pets/clawd-4";
  const spriteUrl = `${petPath}/spritesheet.webp`;

  // 按比例重新计算位置
  const handleWindowResize = useCallback(() => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const maxX = winW - PET_WIDTH;
    const maxY = winH - PET_HEIGHT;

    // 首次加载：用默认位置初始化比例
    if (!isRatioInitRef.current) {
      const defaultPos = getDefaultBottomRightPos();
      ratioRef.current = {
        x: defaultPos.x / maxX,
        y: defaultPos.y / maxY,
      };
      isRatioInitRef.current = true;
      setPetPos(defaultPos);
      return;
    }

    // 按比例计算新位置
    const newX = ratioRef.current.x * maxX;
    const newY = ratioRef.current.y * maxY;
    const newPos = clampPetPosition({ x: newX, y: newY });
    setPetPos(newPos);
  }, []);

  // 加载宠物配置
  useEffect(() => {
    fetch(`${petPath}/pet.json`)
      .then((res) => res.json())
      .then(setPetConfig)
      .catch(() => {});
  }, []);

  // 状态与对话更新
  useEffect(() => {
    const nextState = statusToStateMap[status] ?? "idle";
    setCurrentState(nextState);

    if (status === "idle" && !title && !content) {
      setDialogueConfig(null);
      return;
    }

    setDialogueConfig({ title, content });

    if (status === "done" || status === "error") {
      const timeout = window.setTimeout(() => {
        setDialogueConfig(null);
        setCurrentState("idle");
      }, 3000);
      return () => window.clearTimeout(timeout);
    }
  }, [status, title, content]);

  // 监听窗口resize
  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleWindowResize]);

  // 点击交互
  const handleClick = () => {
    if (currentState !== "idle") return;
    setCurrentState("wait");
    setDialogueConfig({
      title: "嗨，你好。",
      content: "我是你的智能编码助手，有什么问题尽管问我。",
    });
    setTimeout(() => {
      setCurrentState("idle");
      setDialogueConfig(null);
    }, 3000);
  };

  // 拖拽开始：计算鼠标偏移，并初始化比例
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    // 计算鼠标相对于宠物左上角的偏移
    dragOffsetRef.current = {
      x: e.clientX - petPos.x,
      y: e.clientY - petPos.y,
    };
    lastPosRef.current = { ...petPos };

    // 首次拖拽时，用当前位置初始化比例
    if (!isRatioInitRef.current) {
      const maxX = window.innerWidth - PET_WIDTH;
      const maxY = window.innerHeight - PET_HEIGHT;
      ratioRef.current = {
        x: petPos.x / maxX,
        y: petPos.y / maxY,
      };
      isRatioInitRef.current = true;
    }
  };

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (currentState === "runLeft" || currentState === "runRight") {
      setCurrentState("idle");
    }
  }, [currentState]);

  // 拖拽移动：更新位置，并同步更新比例
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const rawX = e.clientX - dragOffsetRef.current.x;
      const rawY = e.clientY - dragOffsetRef.current.y;
      const newPos = clampPetPosition({ x: rawX, y: rawY });

      // 更新宠物状态（跑左/跑右）
      const deltaX = newPos.x - lastPosRef.current.x;
      if (["idle", "wait", "runRight", "runLeft"].includes(currentStateRef.current)) {
        if (deltaX > 2 && currentStateRef.current !== "runRight") {
          setCurrentState("runRight");
        } else if (deltaX < -2 && currentStateRef.current !== "runLeft") {
          setCurrentState("runLeft");
        }
      }

      // 更新位置，并同步更新比例
      setPetPos(newPos);
      const maxX = window.innerWidth - PET_WIDTH;
      const maxY = window.innerHeight - PET_HEIGHT;
      ratioRef.current = {
        x: newPos.x / maxX,
        y: newPos.y / maxY,
      };

      lastPosRef.current = { ...newPos };
    },
    [isDragging]
  );

  // 全局鼠标事件监听
  useEffect(() => {
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  if (!petConfig) return null;

  return (
    <div
      ref={containerRef}
      className="pet-container"
      onMouseDown={handleDragStart}
      style={{ left: petPos.x, top: petPos.y }}
    >
      {dialogueConfig && (
        <div className="pet-bubbles">
          <div className="pet-bubble-item">
            {dialogueConfig.title && (
              <div className="bubble-title">
                <span className="title-text">{dialogueConfig.title}</span>
                {currentState && (
                  <span className="title-status">
                    <span className="loading-dot"></span>
                  </span>
                )}
              </div>
            )}
            <div className="bubble-content">{dialogueConfig.content}</div>
          </div>
        </div>
      )}
      <div
        className="pet-sprite"
        style={{
          "--sprite-url": `url(${spriteUrl})`,
          "--sprite-row": current.row,
          "--sprite-frames": current.frames,
          "--sprite-duration": `${current.duration}ms`,
        } as React.CSSProperties}
        onClick={handleClick}
      />
    </div>
  );
}