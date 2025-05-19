import Logo from "@/assets/logo"
import { TypingMorph } from "./ui/typing-morph"
import Link from "next/link"
import { Button } from "./ui/button"
import { UserButton, useUser } from "@stackframe/stack"
import { QrCode } from "lucide-react"


export default function Header() {
  const session = useUser();
  console.log(session);

  const isLoggedIn = !!session

  return (
        <header className="border-b bg-background">
            <div className="container mx-auto flex h-16 items-center px-6">
            <div className="flex flex-row items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                    <Logo className="!size-5" />
                    <TypingMorph
                    initialText="tqrco.de"
                    ops={[
                        { type: "move", to: 1, delay: 50 },
                        { type: "insert", chars: "he ", speed: 100 },
                        { type: "move", to: 6, delay: 100 },
                        { type: "insert", chars: " ", speed: 100 },
                        { type: "move", to: 10, delay: 100 },
                        { type: "delete", count: 1, speed: 50 },
                        { type: "move", to: 11, delay: 100 },
                        { type: "insert", chars: " co.", speed: 100 },
                    ]}
                    className="text-xl font-brand font-semibold"
                    />
                </Link>
            </div>
            <nav className="ml-auto flex items-center gap-4">
                {isLoggedIn ? (
                <>
                <Link href="/dashboard" passHref>
                <Button variant="outline">Dashboard</Button>
                </Link>
                <UserButton
                    showUserInfo={false}
                    colorModeToggle={() => { console.log("color mode toggle clicked") }}
                    extraItems={[{
                    text: 'Custom Action',
                    icon: <QrCode />,
                    onClick: () => console.log('Custom action clicked')
                    }]}
                />
                </>
                ) : (
                <>
                <Link href="/login" passHref>
                    <Button variant="outline">Login</Button>
                </Link>
                <Link href="/sign-up" passHref>
                    <Button>Get Started</Button>
                </Link>
                </>
                )}
            </nav>
            </div>
        </header>
    )
}