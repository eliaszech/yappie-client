// Minimalist speech-bubble logo with three typing dots cut out via fill-rule.
// Uses `currentColor` so it inherits the surrounding text color — render with
// `text-primary` (or any other token) to recolor.
export default function YappieLogo({ className = "w-full h-full" }) {
    return (
        <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Yappie"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 7C9.23858 7 7 9.23858 7 12V28C7 30.7614 9.23858 33 12 33H14.4L13.5366 39.4754C13.3935 40.5489 14.5868 41.286 15.4806 40.6708L26.5 33H36C38.7614 33 41 30.7614 41 28V12C41 9.23858 38.7614 7 36 7H12ZM17.5 22.5C18.8807 22.5 20 21.3807 20 20C20 18.6193 18.8807 17.5 17.5 17.5C16.1193 17.5 15 18.6193 15 20C15 21.3807 16.1193 22.5 17.5 22.5ZM24 22.5C25.3807 22.5 26.5 21.3807 26.5 20C26.5 18.6193 25.3807 17.5 24 17.5C22.6193 17.5 21.5 18.6193 21.5 20C21.5 21.3807 22.6193 22.5 24 22.5ZM33 20C33 21.3807 31.8807 22.5 30.5 22.5C29.1193 22.5 28 21.3807 28 20C28 18.6193 29.1193 17.5 30.5 17.5C31.8807 17.5 33 18.6193 33 20Z"
                fill="currentColor"
            />
        </svg>
    );
}
