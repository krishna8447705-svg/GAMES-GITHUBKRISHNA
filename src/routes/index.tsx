import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameShell } from "@/components/game-shell";
import { useP2PRoom } from "@/lib/multiplayer/use-p2p-room";

export const Route = createFileRoute("/")({ component: Home });

type Session = { name: string; room: string; online: boolean; joinLabel: string };

function lobbyFromIpPort(ip: string, port: string): { room: string; label: string } {
  const host = ip.trim() || "127.0.0.1";
  const p = (port.replace(/[^0-9]/g, "").slice(0, 5) || "5555");
  const room = `${host.replace(/[^a-zA-Z0-9]/g, "-")}-${p}`.replace(/-+/g, "-").slice(0, 64);
  return { room: room || "FASTND", label: `${host}:${p}` };
}

function Home() {
  const [session, setSession] = useState<Session | null>(null);
  if (!session) return <Menu onPlay={setSession} />;
  if (session.online) {
    return <OnlineRace key={session.room + session.name} session={session} onExit={() => setSession(null)} />;
  }
  return <GameShell {...session} p2p={null} onExit={() => setSession(null)} />;
}

function OnlineRace({ session, onExit }: { session: Session; onExit: () => void }) {
  const p2p = useP2PRoom({ room: session.room, name: session.name });
  return <GameShell {...session} p2p={p2p} onExit={onExit} />;
}

function Menu({ onPlay }: { onPlay: (s: Session) => void }) {
  const [name, setName] = useState("Racer");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fnp-name");
      if (saved) setName(saved);
    } catch {
      /* ignore */
    }
  }, []);
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState("5555");
  const [online, setOnline] = useState(true);

  const hint = useMemo(
    () =>
      online
        ? "Everyone types the same server IP and port to drop into one highway."
        : "Traffic and nitro only. No lobby.",
    [online],
  );

  const go = () => {
    const n = name.trim().slice(0, 16) || "Racer";
    const { room, label } = lobbyFromIpPort(host, port);
    try {
      localStorage.setItem("fnp-name", n);
    } catch {
      /* ignore */
    }
    onPlay({ name: n, room, online, joinLabel: label });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5 py-10 text-fg">
      <div className="w-full max-w-md">
        <p className="text-xs font-medium tracking-[0.28em] text-muted">DAYLIGHT RUN</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide">FAST ND PRAISE</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Engine on, camera behind the car. The road bends through town — drive under buildings, grab nitro, hold the curves.
        </p>

        <div className="mt-8 rounded-xl bg-surface p-5">
          <label className="block text-xs font-medium text-muted" htmlFor="racer">
            Racer name
          </label>
          <input
            id="racer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Your callsign"
            className="mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg outline-none ring-accent focus:ring-2"
          />

          <div className="mt-5 grid grid-cols-2 gap-2">
            <ModeBtn active={!online} onClick={() => setOnline(false)} label="Solo" />
            <ModeBtn active={online} onClick={() => setOnline(true)} label="Online" />
          </div>

          {online && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted" htmlFor="host">
                  Server IP
                </label>
                <input
                  id="host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  maxLength={40}
                  className="mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted" htmlFor="port">
                  Port
                </label>
                <input
                  id="port"
                  value={port}
                  onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                  inputMode="numeric"
                  className="mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
                />
              </div>
              <p className="col-span-3 mt-1 text-xs leading-relaxed text-subtle">
                Friends join with the same IP and port. Default {host}:{port || "5555"}.
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-subtle">{hint}</p>

          <button
            type="button"
            onClick={go}
            className="mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
          >
            Drive
          </button>
        </div>

        <ul className="mt-6 space-y-1 text-xs text-subtle">
          <li>W / Up — accelerate</li>
          <li>S / Down — brake</li>
          <li>A / D or arrows — steer</li>
          <li>Shift or E — nitro boost</li>
          <li>P / Esc — pause</li>
        </ul>
      </div>
    </main>
  );
}

function ModeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "h-11 rounded-md text-sm font-medium " +
        (active ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted")
      }
    >
      {label}
    </button>
  );
}
