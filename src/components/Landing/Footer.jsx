import { SITE } from "../../config/site";

export default function Footer() {
  return (
    <footer className="bg-[#081440] text-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <p className="break-words text-5xl font-extrabold tracking-tight text-white/90 sm:text-7xl lg:text-8xl">
          {SITE.brand}
        </p>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 py-6 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {SITE.brand}. All rights reserved.</p>
          <p>
            Developed by{" "}
            <a href="#home" className="font-semibold text-white hover:text-orange-400">
              MNR Technologies
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
