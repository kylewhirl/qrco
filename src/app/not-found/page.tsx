import Link from "next/link";

export default function NotFoundPage() {
    return (
        <div>
                <h1>404</h1>
                <p>Sorry, the page you are looking for does not exist.</p>
                <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>Go back home</Link>
        </div>
    );
}