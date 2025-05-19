import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./button";


export function ThemeToggle() {

  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
                {resolvedTheme === "dark" ? <Moon size={18} /> : resolvedTheme === "light" ? <Sun size={18} /> : <Laptop size={18} />}
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuItem
                onClick={() => setTheme("light")}
                className={theme === "light" ? "font-semibold" : ""}
            >
                <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className={theme === "dark" ? "font-semibold" : ""}
            >
                <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => setTheme("system")}
                className={theme === "system" ? "font-semibold" : ""}
            >
                <Laptop className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
  )
}