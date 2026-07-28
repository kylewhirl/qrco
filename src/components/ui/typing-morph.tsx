"use client";

import { cn } from "@/lib/utils";
import { motion, type MotionProps } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Op {
  type: "move" | "insert" | "delete";
  to?: number;
  chars?: string;
  count?: number;
  speed?: number;
  delay?: number;
}

interface TypingMorphProps extends MotionProps {
  as?: React.ElementType;
  className?: string;
  delay?: number;
  initialText?: string;
  ops: Op[];
  startOnView?: boolean;
  hideCursor?: boolean;
}

interface TypingState {
  text: string;
  cursor: number;
}

function clampCursor(cursor: number, text: string) {
  return Math.max(0, Math.min(cursor, text.length));
}

function applyOp(state: TypingState, op: Op): TypingState {
  if (op.type === "move" && typeof op.to === "number") {
    return { ...state, cursor: clampCursor(op.to, state.text) };
  }

  if (op.type === "insert" && op.chars) {
    const cursor = clampCursor(state.cursor, state.text);
    return {
      text: state.text.slice(0, cursor) + op.chars + state.text.slice(cursor),
      cursor: cursor + op.chars.length,
    };
  }

  if (op.type === "delete" && typeof op.count === "number") {
    const cursor = clampCursor(state.cursor, state.text);
    const count = Math.min(Math.max(0, op.count), cursor);
    return {
      text: state.text.slice(0, cursor - count) + state.text.slice(cursor),
      cursor: cursor - count,
    };
  }

  return state;
}

function applyOps(initialText: string, ops: Op[]): TypingState {
  return ops.reduce(applyOp, { text: initialText, cursor: initialText.length });
}

export function TypingMorph({
  initialText = "",
  ops = [],
  delay = 0,
  startOnView = false,
  as: Component = "div",
  className,
  hideCursor = false,
  ...props
}: TypingMorphProps) {
  const MotionComponent = useMemo(
    () => motion.create(Component, { forwardMotionProps: true }),
    [Component]
  );
  const opsKey = JSON.stringify(ops);
  const normalizedOps = useMemo<Op[]>(() => JSON.parse(opsKey) as Op[], [opsKey]);
  const [frame, setFrame] = useState<TypingState>({
    text: initialText,
    cursor: initialText.length,
  });
  const ref = useRef<HTMLElement | null>(null);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(!startOnView);
  const finalFrame = useMemo(
    () => applyOps(initialText, normalizedOps),
    [initialText, normalizedOps]
  );

  useEffect(() => {
    if (!startOnView) {
      setStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;

    let currentFrame: TypingState = {
      text: initialText,
      cursor: initialText.length,
    };
    setFrame(currentFrame);
    setDone(false);

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const delayMs = (ms: number) => new Promise<boolean>((resolve) => {
      if (cancelled) {
        resolve(false);
        return;
      }

      timer = setTimeout(() => {
        timer = undefined;
        resolve(!cancelled);
      }, ms);
    });

    const commit = (op: Op) => {
      currentFrame = applyOp(currentFrame, op);
      setFrame(currentFrame);
    };

    const finishImmediately = () => {
      if (document.visibilityState !== "hidden") return;

      cancelled = true;
      if (timer) clearTimeout(timer);
      currentFrame = finalFrame;
      setFrame(finalFrame);
      setDone(true);
    };

    async function run() {
      if (!await delayMs(delay)) return;

      for (const op of normalizedOps) {
        if (cancelled) return;

        if (op.type === "move") {
          if (!await delayMs(op.delay ?? 0)) return;
          commit(op);
        }
        else if (op.type === "insert" && op.chars) {
          for (const ch of op.chars) {
            if (cancelled) return;
            commit({ type: "insert", chars: ch });
            if (!await delayMs(op.speed ?? 100)) return;
          }
        }
        else if (op.type === "delete" && typeof op.count === "number") {
          for (let i = 0; i < op.count; i++) {
            if (cancelled) return;
            commit({ type: "delete", count: 1 });
            if (!await delayMs(op.speed ?? 50)) return;
          }
        }
      }

      if (await delayMs(500)) setDone(true);
    }

    document.addEventListener("visibilitychange", finishImmediately);
    finishImmediately();
    if (!cancelled) void run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", finishImmediately);
    };
  }, [delay, finalFrame, started, initialText, normalizedOps]);

  const { text, cursor } = frame;

  return (
    <MotionComponent
      ref={ref}
      className={cn("text-4xl font-bold leading-[5rem] tracking-[-0.02em]", className)}
      {...props}
    >
      {text.slice(0, cursor)}
      {!done && !hideCursor && (
        <span
          className="inline-block bg-current animate-blink"
          style={{
            width: '3px',
            height: '1em',
            verticalAlign: 'middle',
          }}
        />
      )}
      {text.slice(cursor)}
    </MotionComponent>
  );
}
