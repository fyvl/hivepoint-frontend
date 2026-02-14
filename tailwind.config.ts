import type { Config } from "tailwindcss"

const config: Config = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px"
            }
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))"
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))"
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))"
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))"
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))"
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))"
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))"
                },
                chart: {
                    "1": "hsl(var(--chart-1))",
                    "2": "hsl(var(--chart-2))",
                    "3": "hsl(var(--chart-3))",
                    "4": "hsl(var(--chart-4))",
                    "5": "hsl(var(--chart-5))"
                },
                honey: {
                    DEFAULT: "hsl(var(--honey))",
                    light: "hsl(var(--honey-light))",
                    dark: "hsl(var(--honey-dark))"
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)"
            },
            boxShadow: {
                glow: "0 0 20px -5px hsl(var(--primary) / 0.3)",
                "glow-lg": "0 0 40px -10px hsl(var(--primary) / 0.4)",
                soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)"
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" }
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" }
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.6" }
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" }
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" }
                },
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" }
                },
                "scale-in": {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" }
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                float: "float 3s ease-in-out infinite",
                shimmer: "shimmer 2s linear infinite",
                "fade-in": "fade-in 0.5s ease-out",
                "scale-in": "scale-in 0.3s ease-out"
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "honey-mesh": "linear-gradient(135deg, hsl(var(--honey)) 0%, hsl(var(--honey-light)) 50%, hsl(var(--honey-dark)) 100%)"
            }
        }
    },
    plugins: [require("tailwindcss-animate")]
}

export default config
