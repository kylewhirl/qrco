"use client";

import { cn } from "@/lib/utils";
import { motion, MotionProps } from "motion/react";
import { useEffect, useRef, useState } from "react";

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
  const MotionComponent = motion.create(Component, { forwardMotionProps: true });
  const [text, setText] = useState(initialText);
  const [cursor, setCursor] = useState(initialText.length);
  const ref = useRef<HTMLElement | null>(null);
  const cursorRef = useRef(initialText.length);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(!startOnView);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // cancel and end animation
        setDone(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!startOnView) {
      setStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setStarted(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView, delay]);

  useEffect(() => {
    if (!started) return;
    // reset to initial state
    setText(initialText);
    setCursor(initialText.length);
    cursorRef.current = initialText.length;
    setDone(false);

    let cancelled = false;
    const delayMs = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

    async function run() {
      // initial delay
      await delayMs(delay);
      for (const op of ops) {
        if (cancelled) break;

        if (op.type === "move") {
          await delayMs(op.delay ?? 0);
          if (typeof op.to === "number") {
            setCursor(op.to);
            cursorRef.current = op.to;
          }
        }
        else if (op.type === "insert" && op.chars) {
          for (const ch of op.chars) {
            if (cancelled) break;
            setText(t =>
              t.slice(0, cursorRef.current) + ch + t.slice(cursorRef.current)
            );
            setCursor(c => {
              const next = c + 1;
              cursorRef.current = next;
              return next;
            });
            await delayMs(op.speed ?? 100);
          }
        }
        else if (op.type === "delete" && typeof op.count === "number") {
          for (let i = 0; i < op.count; i++) {
            if (cancelled) break;
            setText(t =>
              t.slice(0, cursorRef.current - 1) + t.slice(cursorRef.current)
            );
            setCursor(c => {
              const next = c - 1;
              cursorRef.current = next;
              return next;
            });
            await delayMs(op.speed ?? 50);
          }
        }
      }
      if (!cancelled) {
        // wait 500ms before hiding cursor
        await delayMs(500);
        if (!cancelled) setDone(true);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [delay, ops, started, initialText]);

  return (
    <MotionComponent
      ref={ref}
      className={cn("text-4xl font-bold leading-[5rem] tracking-[-0.02em]", className)}
      {...props}
    >
      {text.slice(0, cursor)}
      { (!done && hideCursor !== undefined && hideCursor !== true) && (
        <span
          className="inline-block bg-current animate-blink"
          style={{
            width: '3px',
            height: '1em',
            verticalAlign: 'middle',
          }}
        />
      ) }
      {text.slice(cursor)}
    </MotionComponent>
  );
}