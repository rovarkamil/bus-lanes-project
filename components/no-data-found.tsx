import dynamic from "next/dynamic";
import noDataAnimation from "@/public/lottie/animations/not-found.json";
import { useTranslation } from '@/i18n/client';
// import Link from "next/link";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export const NoDataFound = () => {
  const { t } = useTranslation("Common");
  return (
    <main className="w-full min-h-[80vh] flex flex-col justify-center items-center bg-gradient-to-br from-background via-background/90 to-bg-primary/10">
      <div className="relative flex flex-col items-center justify-center p-10 rounded-3xl backdrop-blur-2xl mx-auto mt-20 animate-fade-in">
        <div className="relative mb-6 group">
          <div className="absolute -inset-4 bg-bg-primary/20 blur-2xl rounded-full opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-300" />
          <Lottie 
            animationData={noDataAnimation} 
            className="w-96 h-96 relative z-10 drop-shadow-xl group-hover:scale-105 transition-transform duration-300" 
            loop={true}
          />
        </div>
        <h1 className="w-full text-2xl lg:text-5xl font-extrabold text-center bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent tracking-tight mb-2 animate-gradient-move">
          {t("NoDataFound")}
        </h1>
        <p className="text-lg text-center text-muted-foreground mb-6 animate-fade-in-slow">
          {t("NoDataFoundSubtitle", { defaultValue: "Sorry, we couldn't find any data to show here." })}
        </p>
        {/* <Link href="/" passHref legacyBehavior>
          <a className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 animate-fade-in-slow">
            {t("GoHome", { defaultValue: "Go Home" })}
          </a>
        </Link> */}
      </div>
    </main>
  );
};

// Animations (add to your global CSS or Tailwind config)
// .animate-fade-in { animation: fadeIn 0.7s both; }
// .animate-fade-in-slow { animation: fadeIn 1.2s both; }
// .animate-gradient-move { animation: gradientMove 3s ease-in-out infinite alternate; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
// @keyframes gradientMove { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
