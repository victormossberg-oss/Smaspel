
import { Link } from "react-router-dom";
import { Music2, Grid2X2, ArrowUpRight } from "lucide-react";

const games = [
  {
    title: "Låtspelet",
    description:
      "Känn igen låten på så få sekunder som möjligt.",
    path: "/latspelet",
    icon: Music2,
    label: "MUSIKQUIZ",
  },
  {
    title: "Ordspelet",
    description:
      "Gissa det hemliga ordet på så få försök som möjligt.",
    path: "/ordspelet",
    icon: Grid2X2,
    label: "ORDQUIZ",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0b0c] px-5 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        

        <section className="mt-14 grid gap-6 sm:grid-cols-2">
          {games.map((game) => {
            const Icon = game.icon;

            return (
              <Link
                key={game.path}
                to={game.path}
                className="group rounded-3xl border border-white/10 bg-[#1b1b1e] p-7 transition hover:-translate-y-1 hover:border-white/40 hover:bg-[#202024] sm:p-9"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Icon size={28} />
                  </div>

                  <ArrowUpRight
                    className="text-gray-500 transition group-hover:text-white"
                    size={24}
                  />
                </div>

                <p className="mt-8 text-xs font-bold tracking-[0.2em] text-gray-300">
                  {game.label}
                </p>

                <h2 className="mt-2 text-3xl font-extrabold">
                  {game.title}
                </h2>

                <p className="mt-4 leading-relaxed text-gray-400">
                  {game.description}
                </p>

                <div className="mt-8 inline-flex items-center gap-2 font-bold">
                  Spela nu
                  <span className="text-white">→</span>
                </div>
              </Link>
            );
          })}
        </section>

      </div>
    </main>
  );
}
