import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw,
  RefreshCcw,
  Play,
  Shield,
  Volleyball,
  Move,
  MousePointer2,
  X,
  Hash,
  Trophy,
  Plus,
  Users,
  Swords,
  ClipboardList,
  Settings,
  Menu,
  ChevronDown,
  UserPlus,
  Trash2,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const courtOrder = [4, 3, 2, 5, 6, 1];
const backRow = [1, 5, 6];

const positionLabels = {
  1: "Giao bóng",
  2: "Trước phải",
  3: "Trước giữa",
  4: "Trước trái",
  5: "Sau trái",
  6: "Sau giữa",
};

const roleFields = [
  ["setter", "Chuyền hai", "S"],
  ["opposite", "Đối chuyền", "OP"],
  ["outside1", "Chủ công 1", "OH"],
  ["outside2", "Chủ công 2", "OH"],
  ["middle1", "Phụ công 1", "MB"],
  ["middle2", "Phụ công 2", "MB"],
];

function makeDefaultPlayers(prefix = "") {
  return {
    setter: { name: `${prefix}Chuyền hai`, number: "1" },
    opposite: { name: `${prefix}Đối chuyền`, number: "2" },
    outside1: { name: `${prefix}Chủ công 1`, number: "3" },
    outside2: { name: `${prefix}Chủ công 2`, number: "4" },
    middle1: { name: `${prefix}Phụ công 1`, number: "5" },
    middle2: { name: `${prefix}Phụ công 2`, number: "6" },
  };
}

function makeDefaultLiberos(prefix = "") {
  return [
    { id: "libero1", name: `${prefix}Libero 1`, number: "7" },
    { id: "libero2", name: `${prefix}Libero 2`, number: "8" },
  ];
}

function initialRotation(players) {
  return {
    1: { id: "setter", role: "S", roleName: "Chuyền hai", ...players.setter },
    2: { id: "outside1", role: "OH", roleName: "Chủ công 1", ...players.outside1 },
    3: { id: "middle1", role: "MB", roleName: "Phụ công 1", ...players.middle1 },
    4: { id: "opposite", role: "OP", roleName: "Đối chuyền", ...players.opposite },
    5: { id: "outside2", role: "OH", roleName: "Chủ công 2", ...players.outside2 },
    6: { id: "middle2", role: "MB", roleName: "Phụ công 2", ...players.middle2 },
  };
}

function makeTeam(label, prefix) {
  const players = makeDefaultPlayers(prefix);
  return {
    label,
    players,
    liberos: makeDefaultLiberos(prefix),
    activeLiberoId: "libero1",
    rotation: initialRotation(players),
    rotationCount: 0,
    liberoMode: "auto",
    manualLiberoPosition: null,
  };
}

function rotateClockwise(rotation) {
  return {
    1: rotation[2],
    2: rotation[3],
    3: rotation[4],
    4: rotation[5],
    5: rotation[6],
    6: rotation[1],
  };
}

function getActiveLibero(team) {
  return team.liberos.find((l) => l.id === team.activeLiberoId) || team.liberos[0] || { id: "none", name: "Libero", number: "" };
}

function makeLibero(team) {
  const libero = getActiveLibero(team);
  return {
    id: libero.id,
    role: "L",
    roleName: "Libero",
    name: libero.name || "Libero",
    number: libero.number || "",
  };
}

function getLiberoInfo(team) {
  const { rotation, liberoMode, manualLiberoPosition } = team;

  if (liberoMode === "off") return null;

  if (liberoMode === "manual") {
    if (!manualLiberoPosition) return null;
    return {
      position: manualLiberoPosition,
      replaced: rotation[manualLiberoPosition],
      libero: makeLibero(team),
      mode: "manual",
    };
  }

  for (const pos of backRow) {
    if (rotation[pos]?.role === "MB") {
      return {
        position: pos,
        replaced: rotation[pos],
        libero: makeLibero(team),
        mode: "auto",
      };
    }
  }

  return null;
}

function getCardInfo(position, team, liberoInfo) {
  const player = team.rotation[position];
  const hasLibero = liberoInfo?.position === position;

  return {
    player,
    hasLibero,
    libero: hasLibero ? liberoInfo.libero : null,
    liberoMode: hasLibero ? liberoInfo.mode : null,
  };
}

function formatPlayer(player) {
  if (!player) return "Chưa có";
  return player.number ? `#${player.number} ${player.name}` : player.name;
}

function addHistory(list, item) {
  return [item, ...list].slice(0, 80);
}

interface SectionTitleProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc?: string;
}

function SectionTitle({ icon: Icon, title, desc }: SectionTitleProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-2xl bg-emerald-400/15 p-2 text-emerald-200 ring-1 ring-emerald-300/20">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-lg font-black md:text-xl">{title}</h2>
        {desc && <p className="mt-1 text-xs leading-relaxed text-slate-300 md:text-sm">{desc}</p>}
      </div>
    </div>
  );
}

interface ServeToastProps {
  toast: { team: string; server: string; id: number } | null;
}

function ServeToast({ toast }: ServeToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-yellow-300/40 bg-slate-950/95 p-5 text-center text-white shadow-2xl backdrop-blur"
        >
          <div className="text-xs font-black uppercase tracking-[0.2em] text-yellow-200">Người phát bóng</div>
          <div className="mt-1 text-lg font-black text-emerald-200 md:text-xl">{toast.team}</div>
          <div className="mt-1 rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold text-white md:text-base">{toast.server}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MobileMatchBoardProps {
  score: { home: number; opponent: number };
  servingTeam: "home" | "opponent";
  setNumber: number;
  onHomePoint: () => void;
  onOpponentPoint: () => void;
  onStartMatch: () => void;
  onResetMatch: () => void;
  onToggleCompact: () => void;
}

function MobileMatchBoard({ score, servingTeam, setNumber, onHomePoint, onOpponentPoint, onStartMatch, onResetMatch, onToggleCompact }: MobileMatchBoardProps) {
  return (
    <div className="sticky top-0 z-40 -mx-3 mb-3 border-b border-white/10 bg-slate-950/95 px-3 py-3 shadow-2xl backdrop-blur md:hidden">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-emerald-400/15 p-2 text-emerald-200">
            <Volleyball size={18} />
          </div>
          <div>
            <div className="text-sm font-black">Bàn điểm mini</div>
            <div className="text-[11px] text-slate-400">Set {setNumber} · {servingTeam === "home" ? "Đội mình" : "Đối thủ"} giao</div>
          </div>
        </div>
        <button onClick={onToggleCompact} title="Thu gọn" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white active:scale-95">
          <Minimize2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_74px_1fr] gap-2 text-center">
        <button onClick={onHomePoint} className={`rounded-2xl border p-3 active:scale-[0.98] ${servingTeam === "home" ? "border-yellow-300 bg-yellow-300/15" : "border-emerald-300/20 bg-emerald-400/10"}`}>
          <div className="text-[11px] font-bold text-slate-300">Đội mình</div>
          <div className="text-4xl font-black text-emerald-200">{score.home}</div>
          <div className="mt-1 rounded-xl bg-emerald-400 py-1 text-xs font-black text-slate-950">+1</div>
        </button>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/90 p-2">
          <div className="text-[10px] text-slate-400">Tỉ số</div>
          <div className="text-lg font-black text-white">VS</div>
          <button onClick={onStartMatch} className="mt-1 w-full rounded-xl bg-white/10 py-1 text-[10px] font-black">Start</button>
          <button onClick={onResetMatch} className="mt-1 w-full rounded-xl bg-white/10 py-1 text-[10px] font-black">Reset</button>
        </div>

        <button onClick={onOpponentPoint} className={`rounded-2xl border p-3 active:scale-[0.98] ${servingTeam === "opponent" ? "border-yellow-300 bg-yellow-300/15" : "border-orange-300/20 bg-orange-400/10"}`}>
          <div className="text-[11px] font-bold text-slate-300">Đối thủ</div>
          <div className="text-4xl font-black text-orange-200">{score.opponent}</div>
          <div className="mt-1 rounded-xl bg-orange-400 py-1 text-xs font-black text-slate-950">+1</div>
        </button>
      </div>
    </div>
  );
}

interface PlayerFormProps {
  team: any;
  onUpdatePlayer: (playerKey: string, field: string, value: string) => void;
  onUpdateLibero: (liberoId: string, field: string, value: string) => void;
  onAddLibero: () => void;
  onRemoveLibero: (liberoId: string) => void;
  onSelectActiveLibero: (liberoId: string) => void;
  onStart: () => void;
  onReset: () => void;
  onSetLiberoMode: (mode: string) => void;
  onClearLibero: () => void;
}

function PlayerForm({ team, onUpdatePlayer, onUpdateLibero, onAddLibero, onRemoveLibero, onSelectActiveLibero, onStart, onReset, onSetLiberoMode, onClearLibero }: PlayerFormProps) {
  return (
    <Card className="border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
      <CardContent className="p-4 md:p-5">
        <SectionTitle icon={Settings} title={`Cài đặt ${team.label}`} desc="Nhập tên, số áo, thêm nhiều libero và chọn libero đang sử dụng." />

        <div className="space-y-2 md:space-y-3">
          {roleFields.map(([key, label, role]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-100">{label}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-black text-slate-300">{role}</span>
              </div>
              <div className="grid grid-cols-[1fr_76px] gap-2">
                <input value={team.players[key]?.name || ""} onChange={(e) => onUpdatePlayer(key, "name", e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm outline-none transition focus:border-emerald-300/70 focus:ring-4 focus:ring-emerald-300/10" placeholder={`Tên ${label}`} />
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={team.players[key]?.number || ""} onChange={(e) => onUpdatePlayer(key, "number", e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-7 pr-2 text-sm outline-none transition focus:border-emerald-300/70 focus:ring-4 focus:ring-emerald-300/10" placeholder="Số" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-sky-100">
              <Shield size={18} /> Danh sách Libero
            </div>
            <button onClick={onAddLibero} className="flex items-center gap-1 rounded-xl bg-sky-300 px-2 py-1.5 text-xs font-black text-slate-950">
              <UserPlus size={14} /> Thêm
            </button>
          </div>

          <div className="space-y-2">
            {team.liberos.map((libero, index) => (
              <div key={libero.id} className={`rounded-2xl border p-2 ${team.activeLiberoId === libero.id ? "border-sky-200 bg-sky-300/15" : "border-white/10 bg-slate-950/35"}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button onClick={() => onSelectActiveLibero(libero.id)} className="rounded-xl bg-white/10 px-2 py-1 text-[11px] font-black text-white">
                    {team.activeLiberoId === libero.id ? "Đang dùng" : "Chọn L"}
                  </button>
                  <button disabled={team.liberos.length <= 1} onClick={() => onRemoveLibero(libero.id)} className="rounded-xl bg-rose-400 px-2 py-1 text-xs font-black text-slate-950 disabled:opacity-40">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_76px] gap-2">
                  <input value={libero.name} onChange={(e) => onUpdateLibero(libero.id, "name", e.target.value)} className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm outline-none focus:border-sky-300/70" placeholder={`Libero ${index + 1}`} />
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={libero.number} onChange={(e) => onUpdateLibero(libero.id, "number", e.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-7 pr-2 text-sm outline-none focus:border-sky-300/70" placeholder="Số" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ["auto", "Auto"],
              ["manual", "Thủ công"],
              ["off", "Tắt"],
            ].map(([mode, label]) => (
              <button key={mode} onClick={() => (mode === "off" ? onClearLibero() : onSetLiberoMode(mode))} className={`min-h-10 rounded-xl px-2 text-xs font-black transition md:text-sm ${team.liberoMode === mode ? "bg-sky-300 text-slate-950" : "bg-white/10 text-white hover:bg-white/15"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={onStart} className="h-11 rounded-2xl bg-emerald-500 font-black text-slate-950 hover:bg-emerald-400">
            <Play className="mr-2 h-4 w-4" /> Bắt đầu
          </Button>
          <Button onClick={onReset} variant="secondary" className="h-11 rounded-2xl font-black">
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CourtViewProps {
  team: any;
  started: boolean;
  liberoInfo: any;
  onRotate: () => void;
  onSelectLiberoPosition: (pos: number) => void;
  onClearLibero: () => void;
  onSwapPositions: (a: number, b: number) => void;
}

function CourtView({ team, started, liberoInfo, onRotate, onSelectLiberoPosition, onClearLibero, onSwapPositions }: CourtViewProps) {
  const [dragged, setDragged] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  function dragStart(e, pos) {
    if (!started) return;
    setDragged(pos);
    e.dataTransfer.setData("text/plain", String(pos));
  }

  function drop(e, target) {
    e.preventDefault();
    const source = Number(e.dataTransfer.getData("text/plain") || dragged);
    if (started && source && source !== target) onSwapPositions(source, target);
    setDragged(null);
    setHover(null);
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
      <CardContent className="p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle icon={Volleyball} title={`Sân ${team.label}`} desc="Kéo thả để đổi vị trí. P1 là vị trí giao bóng." />
          <Button onClick={onRotate} disabled={!started} className="h-11 w-full rounded-2xl bg-orange-400 font-black text-slate-950 hover:bg-orange-300 disabled:opacity-40 sm:w-auto">
            <RotateCw className="mr-2 h-4 w-4" /> Xoay cầu
          </Button>
        </div>

        <div className="rounded-2xl border border-orange-200/20 bg-gradient-to-br from-orange-500/25 to-emerald-500/20 p-2 shadow-inner sm:p-4 md:rounded-[2rem] md:border-4 md:p-6">
          <div className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.2em] text-orange-100/80 sm:text-xs md:tracking-[0.3em]">Lưới</div>
          <div className="mb-2.5 h-1.5 rounded-full bg-white/70 shadow-lg sm:mb-4 sm:h-2" />

          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {courtOrder.map((pos) => {
              const info = getCardInfo(pos, team, liberoInfo);
              const player = info.player;
              const isFront = [2, 3, 4].includes(pos);
              const isManualSelected = team.liberoMode === "manual" && team.manualLiberoPosition === pos;
              const isHover = hover === pos && dragged !== pos;

              return (
                <motion.div
                  layout
                  key={`${team.label}-${pos}-${player?.name}-${player?.number}-${info.hasLibero}-${team.rotationCount}-${team.manualLiberoPosition}-${team.activeLiberoId}`}
                  draggable={started}
                  onDragStart={(e) => dragStart(e, pos)}
                  onDragOver={(e) => {
                    if (!started) return;
                    e.preventDefault();
                    setHover(pos);
                  }}
                  onDragLeave={() => hover === pos && setHover(null)}
                  onDrop={(e) => drop(e, pos)}
                  onDragEnd={() => {
                    setDragged(null);
                    setHover(null);
                  }}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: dragged === pos ? 0.55 : 1, scale: isHover ? 1.03 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className={`relative min-h-[135px] rounded-xl border p-1.5 shadow-xl transition sm:min-h-[165px] md:min-h-[195px] md:rounded-[1.5rem] md:p-3 ${info.hasLibero ? "border-sky-200/70 bg-sky-400/25" : isFront ? "border-orange-100/50 bg-orange-100/15" : "border-emerald-100/50 bg-emerald-100/15"} ${started ? "cursor-grab active:cursor-grabbing" : "opacity-80"} ${isHover ? "ring-2 ring-yellow-300/60 sm:ring-4" : ""} ${isManualSelected ? "ring-2 ring-sky-300/80 sm:ring-4" : ""}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-1 sm:mb-2">
                    <div className="rounded-full bg-slate-950/75 px-1 py-0.2 text-[8px] font-black sm:px-2.5 sm:text-xs">P{pos}</div>
                    <div className="flex items-center gap-1">
                      {started && <Move size={10} className="hidden text-white/77 sm:block" />}
                      <div className="rounded-full bg-white/15 px-1 py-0.2 text-[8px] font-black sm:px-2.5 sm:text-xs">{player?.role}</div>
                    </div>
                  </div>

                  {player?.number && (
                    <div className="absolute right-1 top-[26px] flex h-[18px] w-[18px] items-center justify-center rounded bg-white text-[8px] font-black text-slate-950 shadow sm:right-2 sm:top-[28px] sm:h-8 sm:w-8 sm:text-sm md:right-3 md:top-10 md:h-11 md:w-11 md:rounded-2xl md:text-xl">
                      {player.number}
                    </div>
                  )}

                  <div className="text-[8px] text-slate-400 sm:text-[11px]">{positionLabels[pos]}</div>
                  <div className="mt-0.5 pr-4 text-[11px] font-black leading-tight truncate sm:mt-1 sm:pr-8 sm:text-base md:pr-12 md:text-xl">
                    {player?.name}
                  </div>
                  <div className="text-[8px] text-slate-400/80 sm:text-xs truncate">
                    {player?.roleName}
                  </div>

                  {info.hasLibero && (
                    <div className="mt-1 rounded border border-sky-200/20 bg-sky-950/40 p-1 text-sky-100 sm:mt-2.5 sm:p-2">
                      <div className="text-[7px] font-black uppercase tracking-[0.1em] text-sky-300/90 sm:text-[10px]">L · {info.liberoMode === "manual" ? "T.công" : "Auto"}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-0.5 text-[8px] font-black sm:text-xs md:text-sm">
                        <Shield size={9} className="sm:size-3.5" />
                        {info.libero.number && <span className="rounded bg-sky-200 px-0.5 py-0.2 text-[7px] text-slate-950 sm:text-[9px]">#{info.libero.number}</span>}
                        <span className="truncate max-w-[45px] sm:max-w-none">{info.libero.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-1.5 flex gap-1 sm:gap-2">
                    <button type="button" disabled={!started} onClick={(e) => { e.stopPropagation(); onSelectLiberoPosition(pos); }} className="flex min-h-5 flex-1 items-center justify-center gap-0.5 rounded bg-sky-300 px-1 py-0.5 text-[8px] font-black text-slate-950 transition hover:bg-sky-200 disabled:opacity-40 sm:min-h-9 sm:px-2 sm:text-xs">
                      <MousePointer2 size={9} className="sm:size-[13px]" /> L
                    </button>
                    {isManualSelected && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); onClearLibero(); }} className="min-h-5 rounded bg-rose-400 px-1 text-[8px] font-black text-slate-950 transition hover:bg-rose-300 sm:min-h-9 sm:px-2.5 sm:text-xs">
                        <X size={9} className="sm:size-[13px]" />
                      </button>
                    )}
                  </div>

                  {pos === 1 && (
                    <div className="absolute -right-0.5 -top-1 rounded-full bg-yellow-300 px-1 py-0.2 text-[8px] font-black text-slate-950 shadow-md sm:-right-2 sm:-top-2 sm:px-2.5 sm:text-xs">
                      SERVE
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoPanelProps {
  title: string;
  team: any;
  liberoInfo: any;
  history: any[];
}

function InfoPanel({ title, team, liberoInfo, history }: InfoPanelProps) {
  const serverInfo = getCardInfo(1, team, liberoInfo);
  const server = serverInfo.hasLibero ? `${formatPlayer(serverInfo.player)} / ${formatPlayer(serverInfo.libero)}` : formatPlayer(serverInfo.player);

  return (
    <Card className="border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
      <CardContent className="p-4 md:p-5">
        <SectionTitle icon={ClipboardList} title={title} desc="Theo dõi người giao bóng, libero và lịch sử thao tác." />

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="rounded-2xl bg-slate-950/50 p-3 md:p-4">
            <div className="text-xs text-slate-400">Số lần xoay</div>
            <div className="mt-1 text-3xl font-black text-orange-200">{team.rotationCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-950/50 p-3 md:p-4">
            <div className="text-xs text-slate-400">Giao bóng</div>
            <div className="mt-1 text-xs font-bold text-emerald-200 md:text-sm">{server}</div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 md:p-4">
          <div className="mb-1 flex items-center gap-2 font-bold text-sky-100"><Shield size={17} /> Libero đang dùng</div>
          {liberoInfo ? (
            <div className="text-sm text-slate-200">
              <b>{formatPlayer(liberoInfo.libero)}</b> dưới <b>{formatPlayer(liberoInfo.replaced)}</b> tại P{liberoInfo.position}.
              <div className="mt-1 text-xs text-sky-100/80">Chế độ: {liberoInfo.mode === "manual" ? "Thủ công" : "Tự động"}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-300">Chưa có libero.</div>
          )}
        </div>

        <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1 md:max-h-[560px]">
          <AnimatePresence initial={false}>
            {history.length === 0 ? <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">Chưa có lịch sử.</div> : history.map((item, index) => (
              <motion.div key={`${item.action}-${index}-${item.note}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black">{item.action}</div>
                  {item.round !== undefined && <div className="rounded-full bg-white/10 px-2 py-1 text-[11px]">Lần {item.round}</div>}
                  {item.score && <div className="rounded-full bg-white/10 px-2 py-1 text-[11px]">{item.score}</div>}
                </div>
                {item.server && <div className="mt-1 text-xs text-emerald-200">Giao bóng: {item.server}</div>}
                <div className="mt-1 text-xs leading-relaxed text-slate-400">{item.note}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VolleyballRotationSimulator() {
  const [activeTab, setActiveTab] = useState<string>("match");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [servingTeam, setServingTeam] = useState<"home" | "opponent">("home");
  const [score, setScore] = useState({ home: 0, opponent: 0 });
  const [setNumber, setSetNumber] = useState(1);
  const [teams, setTeams] = useState({ home: makeTeam("Đội mình", ""), opponent: makeTeam("Đối thủ", "ĐT ") });
  const [histories, setHistories] = useState<{ home: any[]; opponent: any[]; match: any[] }>({ home: [], opponent: [], match: [] });
  const [serveToast, setServeToast] = useState<{ team: string; server: string; id: number } | null>(null);
  const [compactMode, setCompactMode] = useState(false);

  const homeLibero = useMemo(() => getLiberoInfo(teams.home), [teams.home]);
  const opponentLibero = useMemo(() => getLiberoInfo(teams.opponent), [teams.opponent]);

  const tabs: [string, string, React.ComponentType<any>][] = [
    ["match", "Trận", Trophy],
    ["home", "Đội mình", Users],
    ["opponent", "Đối thủ", Swords]
  ];

  function updateTeam(teamKey, updater) {
    setTeams((prev) => ({ ...prev, [teamKey]: updater(prev[teamKey]) }));
  }

  function pushHistory(type, item) {
    setHistories((prev) => ({ ...prev, [type]: addHistory(prev[type], item) }));
  }

  function getServerText(team) {
    const lib = getLiberoInfo(team);
    const serverInfo = getCardInfo(1, team, lib);
    return serverInfo.hasLibero
      ? `${formatPlayer(serverInfo.player)} / ${formatPlayer(serverInfo.libero)}`
      : formatPlayer(serverInfo.player);
  }

  function showServeToast(teamKey, teamOverride) {
    const team = teamOverride || teams[teamKey];
    const id = Date.now();
    setServeToast({
      id,
      team: team.label,
      server: getServerText(team),
    });

    window.setTimeout(() => {
      setServeToast((current) => (current?.id === id ? null : current));
    }, 1500);
  }

  function updatePlayer(teamKey, playerKey, field, value) {
    updateTeam(teamKey, (team) => ({ ...team, players: { ...team.players, [playerKey]: { ...team.players[playerKey], [field]: value } } }));
  }

  function updateLibero(teamKey, liberoId, field, value) {
    updateTeam(teamKey, (team) => ({ ...team, liberos: team.liberos.map((l) => (l.id === liberoId ? { ...l, [field]: value } : l)) }));
  }

  function addLibero(teamKey) {
    updateTeam(teamKey, (team) => {
      const newId = `libero${Date.now()}`;
      const next = { id: newId, name: `Libero ${team.liberos.length + 1}`, number: String(team.liberos.length + 7) };
      return { ...team, liberos: [...team.liberos, next], activeLiberoId: newId };
    });
  }

  function removeLibero(teamKey, liberoId) {
    updateTeam(teamKey, (team) => {
      if (team.liberos.length <= 1) return team;
      const nextLiberos = team.liberos.filter((l) => l.id !== liberoId);
      const nextActive = team.activeLiberoId === liberoId ? nextLiberos[0].id : team.activeLiberoId;
      return { ...team, liberos: nextLiberos, activeLiberoId: nextActive };
    });
  }

  function selectActiveLibero(teamKey, liberoId) {
    updateTeam(teamKey, (team) => ({ ...team, activeLiberoId: liberoId }));
    pushHistory(teamKey, { action: "Đổi Libero", note: "Đã chọn libero đang sử dụng." });
  }

  function startTeam(teamKey) {
    updateTeam(teamKey, (team) => {
      const rotation = initialRotation(team.players);
      pushHistory(teamKey, { round: 0, action: "Bắt đầu đội hình", server: formatPlayer(rotation[1]), note: `${team.label} đã được đưa vào sân.` });
      return { ...team, rotation, rotationCount: 0, manualLiberoPosition: null };
    });
    setStarted(true);
  }

  function resetTeam(teamKey) {
    const fresh = teamKey === "home" ? makeTeam("Đội mình", "") : makeTeam("Đối thủ", "ĐT ");
    setTeams((prev) => ({ ...prev, [teamKey]: fresh }));
    setHistories((prev) => ({ ...prev, [teamKey]: [] }));
  }

  function rotateTeam(teamKey, action = "Xoay cầu") {
    const team = teams[teamKey];
    const nextRotation = rotateClockwise(team.rotation);
    const nextTeam = { ...team, rotation: nextRotation, rotationCount: team.rotationCount + 1 };
    const lib = getLiberoInfo(nextTeam);
    const serverInfo = getCardInfo(1, nextTeam, lib);
    const server = serverInfo.hasLibero ? `${formatPlayer(serverInfo.player)} / ${formatPlayer(serverInfo.libero)}` : formatPlayer(serverInfo.player);

    updateTeam(teamKey, () => nextTeam);
    pushHistory(teamKey, { round: nextTeam.rotationCount, action, server, note: lib ? `${formatPlayer(lib.libero)} dưới ${formatPlayer(lib.replaced)} ở P${lib.position}.` : "Không có libero." });
  }

  function setLiberoMode(teamKey, mode) {
    updateTeam(teamKey, (team) => ({ ...team, liberoMode: mode, manualLiberoPosition: mode === "auto" ? null : team.manualLiberoPosition }));
  }

  function clearLibero(teamKey) {
    updateTeam(teamKey, (team) => ({ ...team, liberoMode: "off", manualLiberoPosition: null }));
    pushHistory(teamKey, { action: "Tắt Libero", note: "Đã tắt hiển thị libero trên sân." });
  }

  function selectLibero(teamKey, position) {
    const team = teams[teamKey];
    updateTeam(teamKey, (t) => ({ ...t, liberoMode: "manual", manualLiberoPosition: position }));
    pushHistory(teamKey, { round: team.rotationCount, action: "Chọn Libero", server: formatPlayer(team.rotation[1]), note: `${formatPlayer(makeLibero(team))} đặt dưới ${formatPlayer(team.rotation[position])} ở P${position}.` });
  }

  function swapPositions(teamKey, source, target) {
    const team = teams[teamKey];
    const sourcePlayer = team.rotation[source];
    const targetPlayer = team.rotation[target];
    let nextManual = team.manualLiberoPosition;
    if (team.liberoMode === "manual") {
      if (nextManual === source) nextManual = target;
      else if (nextManual === target) nextManual = source;
    }
    updateTeam(teamKey, (t) => ({ ...t, rotation: { ...t.rotation, [source]: targetPlayer, [target]: sourcePlayer }, manualLiberoPosition: nextManual }));
    pushHistory(teamKey, { round: team.rotationCount, action: "Kéo thả", server: formatPlayer(team.rotation[1]), note: `${formatPlayer(sourcePlayer)} ↔ ${formatPlayer(targetPlayer)}.` });
  }

  function startMatch() {
    const homeRotation = initialRotation(teams.home.players);
    const opponentRotation = initialRotation(teams.opponent.players);
    setTeams((prev) => ({
      home: { ...prev.home, rotation: homeRotation, rotationCount: 0, manualLiberoPosition: null },
      opponent: { ...prev.opponent, rotation: opponentRotation, rotationCount: 0, manualLiberoPosition: null },
    }));
    setScore({ home: 0, opponent: 0 });
    setServingTeam("home");
    setStarted(true);
    setHistories({
      home: [{ round: 0, action: "Bắt đầu trận", server: formatPlayer(homeRotation[1]), note: "Đội mình sẵn sàng." }],
      opponent: [{ round: 0, action: "Bắt đầu trận", server: formatPlayer(opponentRotation[1]), note: "Đối thủ sẵn sàng." }],
      match: [{ action: "Bắt đầu set", score: "0 - 0", note: "Đội mình giao bóng trước." }],
    });
  }

  function resetMatch() {
    setStarted(false);
    setScore({ home: 0, opponent: 0 });
    setServingTeam("home");
    setSetNumber(1);
    setHistories((prev) => ({ ...prev, match: [] }));
  }

  function scorePoint(winner: "home" | "opponent") {
    if (!started) {
      startMatch();
      return;
    }

    const wasReceiving = servingTeam !== winner;
    const nextScore = { ...score, [winner]: score[winner] + 1 };
    setScore(nextScore);

    if (wasReceiving) {
      const rotatedTeamPreview = {
        ...teams[winner],
        rotation: rotateClockwise(teams[winner].rotation),
        rotationCount: teams[winner].rotationCount + 1,
      };

      setServingTeam(winner);
      rotateTeam(winner, "Xoay do giành giao bóng");
      showServeToast(winner, rotatedTeamPreview);
    } else {
      showServeToast(servingTeam, teams[servingTeam]);
    }

    pushHistory("match", {
      action: winner === "home" ? "Đội mình +1" : "Đối thủ +1",
      score: `${nextScore.home} - ${nextScore.opponent}`,
      note: wasReceiving
        ? `${winner === "home" ? "Đội mình" : "Đối thủ"} giành quyền giao bóng nên tự xoay cầu.`
        : `${winner === "home" ? "Đội mình" : "Đối thủ"} đang giao bóng nên không xoay.`,
    });
  }

  const currentKey = activeTab === "opponent" ? "opponent" : "home";
  const currentTeam = teams[currentKey];
  const currentLibero = currentKey === "home" ? homeLibero : opponentLibero;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-3 pt-3 pb-24 text-white md:p-6 lg:p-8">
      <ServeToast toast={serveToast} />
      {!compactMode && (
        <MobileMatchBoard score={score} servingTeam={servingTeam} setNumber={setNumber} onHomePoint={() => scorePoint("home")} onOpponentPoint={() => scorePoint("opponent")} onStartMatch={startMatch} onResetMatch={resetMatch} onToggleCompact={() => setCompactMode(true)} />
      )}

      <div className="mx-auto max-w-7xl">
        {compactMode ? (
          <div className="space-y-4">
            {/* COMPACT TOP BAR & SCOREBOARD */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300 ring-1 ring-emerald-400/20">
                    <Volleyball className="animate-spin-slow" size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-wide">MÔ PHỎNG THI ĐẤU THU GỌN</h2>
                    <p className="text-[11px] text-slate-400">Giao diện rút gọn tối giản</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setCompactMode(false)} className="h-8 rounded-xl bg-white/10 hover:bg-white/15 px-3 text-xs font-bold text-slate-200">
                    <Maximize2 className="mr-1 h-3 w-3" /> Mở rộng đầy đủ
                  </Button>
                </div>
              </div>

              {/* Score Control Board */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center sm:gap-4">
                {/* Home Point Button */}
                <button
                  onClick={() => scorePoint("home")}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border p-3 transition-all active:scale-[0.98] ${
                    servingTeam === "home"
                      ? "border-emerald-400/60 bg-emerald-400/10 shadow-lg shadow-emerald-500/5"
                      : "border-white/5 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">Đội mình</span>
                  <span className="text-4xl font-black text-emerald-300 my-0.5 sm:text-5xl">{score.home}</span>
                  <div className="rounded-xl bg-emerald-400 px-3 py-0.5 text-[11px] font-black text-slate-950 shadow">+1 Điểm</div>
                  {servingTeam === "home" && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-yellow-300 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow-md">
                      GIAO BÓNG
                    </span>
                  )}
                </button>

                {/* Info & Admin Buttons */}
                <div className="flex flex-col items-center justify-center px-1 min-w-[70px] sm:min-w-[120px]">
                  <div className="text-[10px] font-black text-yellow-300 uppercase tracking-widest bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-300/20">Set {setNumber}</div>
                  <div className="text-base font-black text-slate-500 my-1.5">VS</div>
                  <div className="flex flex-col gap-1 w-full max-w-[100px]">
                    <button onClick={() => setSetNumber((n) => n + 1)} className="rounded-lg bg-white/5 py-1 text-[9px] font-bold text-slate-300 hover:bg-white/10 transition border border-white/5">Set tiếp</button>
                    <button onClick={resetMatch} className="rounded-lg bg-white/5 py-1 text-[9px] font-bold text-red-300 hover:bg-red-400/10 transition border border-white/5">Reset trận</button>
                  </div>
                </div>

                {/* Opponent Point Button */}
                <button
                  onClick={() => scorePoint("opponent")}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border p-3 transition-all active:scale-[0.98] ${
                    servingTeam === "opponent"
                      ? "border-orange-400/60 bg-orange-400/10 shadow-lg shadow-orange-500/5"
                      : "border-white/5 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">Đối thủ</span>
                  <span className="text-4xl font-black text-orange-300 my-0.5 sm:text-5xl">{score.opponent}</span>
                  <div className="rounded-xl bg-orange-400 px-3 py-0.5 text-[11px] font-black text-slate-950 shadow">+1 Điểm</div>
                  {servingTeam === "opponent" && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-yellow-300 px-2 py-0.5 text-[9px] font-black text-slate-950 shadow-md">
                      GIAO BÓNG
                    </span>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Side-by-side Courts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <CourtView team={teams.home} started={started} liberoInfo={homeLibero} onRotate={() => rotateTeam("home")} onSelectLiberoPosition={(pos) => selectLibero("home", pos)} onClearLibero={() => clearLibero("home")} onSwapPositions={(a, b) => swapPositions("home", a, b)} />
              <CourtView team={teams.opponent} started={started} liberoInfo={opponentLibero} onRotate={() => rotateTeam("opponent")} onSelectLiberoPosition={(pos) => selectLibero("opponent", pos)} onClearLibero={() => clearLibero("opponent")} onSwapPositions={(a, b) => swapPositions("opponent", a, b)} />
            </div>
          </div>
        ) : (
          /* STANDARD FULL INTERFACE */
          <>
            <motion.header initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="mb-4 hidden rounded-[1.6rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur md:mb-6 md:block md:rounded-[2rem] md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 ring-1 ring-emerald-300/20 md:text-sm"><Volleyball size={17} /> Volleyball Rotation App</div>
                  <h1 className="text-2xl font-black tracking-tight md:text-4xl lg:text-5xl">Mô phỏng trận bóng chuyền</h1>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-300 md:text-sm lg:text-base">Có thể thêm nhiều libero, chọn libero đang dùng, ghi điểm tự xoay cầu và kéo thả vị trí.</p>
                  <div className="mt-3">
                    <Button onClick={() => setCompactMode(true)} className="h-9 rounded-xl bg-emerald-500/80 text-xs font-black text-slate-950 hover:bg-emerald-400">
                      <Minimize2 className="mr-1.5 h-3.5 w-3.5" /> Thu gọn giao diện (Xem thi đấu)
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-3xl bg-slate-950/45 p-2 text-center sm:min-w-[420px]">
                  <div className="rounded-2xl bg-emerald-400/15 p-3"><div className="text-xs text-slate-300">Đội mình</div><div className="text-3xl font-black text-emerald-200 md:text-4xl">{score.home}</div></div>
                  <div className="rounded-2xl bg-yellow-300/15 p-3"><div className="text-xs text-slate-300">Set {setNumber}</div><div className="mt-1 text-xs font-black text-yellow-200 md:text-sm">{servingTeam === "home" ? "Đội mình" : "Đối thủ"}</div><div className="text-[11px] text-slate-400">đang giao</div></div>
                  <div className="rounded-2xl bg-orange-400/15 p-3"><div className="text-xs text-slate-300">Đối thủ</div><div className="text-3xl font-black text-orange-200 md:text-4xl">{score.opponent}</div></div>
                </div>
              </div>
            </motion.header>

            <div className="mb-4 hidden grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-slate-950/90 p-2 shadow-2xl backdrop-blur md:sticky md:top-4 md:mb-6 md:grid">
              {tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setActiveTab(key)} className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-2 text-xs font-black transition md:text-sm ${activeTab === key ? "bg-emerald-400 text-slate-950" : "text-slate-200 hover:bg-white/10"}`}><Icon size={17} /> {label}</button>)}
            </div>

            {activeTab === "match" ? (
              <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                  <Card className="hidden border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur md:block">
                    <CardContent className="p-4 md:p-5">
                      <SectionTitle icon={Trophy} title="Bảng ghi điểm" desc="Đội đỡ bóng ghi điểm sẽ giành giao bóng và tự xoay cầu." />
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className={`rounded-[1.6rem] border p-4 md:p-6 ${servingTeam === "home" ? "border-yellow-300 bg-yellow-300/15" : "border-white/10 bg-slate-950/40"}`}>
                          <div className="flex items-center justify-between gap-2"><div><div className="text-sm font-bold text-slate-300">Đội mình</div><div className="text-6xl font-black text-emerald-200 md:text-7xl">{score.home}</div></div>{servingTeam === "home" && <div className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">SERVE</div>}</div>
                          <Button onClick={() => scorePoint("home")} className="mt-4 h-14 w-full rounded-2xl bg-emerald-500 text-lg font-black text-slate-950 hover:bg-emerald-400"><Plus className="mr-2 h-5 w-5" /> Đội mình +1</Button>
                        </div>
                        <div className={`rounded-[1.6rem] border p-4 md:p-6 ${servingTeam === "opponent" ? "border-yellow-300 bg-yellow-300/15" : "border-white/10 bg-slate-950/40"}`}>
                          <div className="flex items-center justify-between gap-2"><div><div className="text-sm font-bold text-slate-300">Đối thủ</div><div className="text-6xl font-black text-orange-200 md:text-7xl">{score.opponent}</div></div>{servingTeam === "opponent" && <div className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">SERVE</div>}</div>
                          <Button onClick={() => scorePoint("opponent")} className="mt-4 h-14 w-full rounded-2xl bg-orange-400 text-lg font-black text-slate-950 hover:bg-orange-300"><Plus className="mr-2 h-5 w-5" /> Đối thủ +1</Button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <Button onClick={startMatch} className="h-11 rounded-2xl bg-emerald-500 font-black text-slate-950 hover:bg-emerald-400"><Play className="mr-2 h-4 w-4" /> Bắt đầu</Button>
                        <Button onClick={resetMatch} variant="secondary" className="h-11 rounded-2xl font-black"><RefreshCcw className="mr-2 h-4 w-4" /> Reset điểm</Button>
                        <button onClick={() => setServingTeam("home")} className={`h-11 rounded-2xl text-sm font-black transition ${servingTeam === "home" ? "bg-yellow-300 text-slate-950" : "bg-white/10 hover:bg-white/15"}`}>Mình giao</button>
                        <button onClick={() => setServingTeam("opponent")} className={`h-11 rounded-2xl text-sm font-black transition ${servingTeam === "opponent" ? "bg-yellow-300 text-slate-950" : "bg-white/10 hover:bg-white/15"}`}>Đối thủ giao</button>
                      </div>
                      <button onClick={() => setSetNumber((n) => n + 1)} className="mt-2 h-11 w-full rounded-2xl bg-white/10 text-sm font-black transition hover:bg-white/15 sm:w-auto sm:px-5">Sang set tiếp theo</button>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 2xl:grid-cols-2">
                    <CourtView team={teams.home} started={started} liberoInfo={homeLibero} onRotate={() => rotateTeam("home")} onSelectLiberoPosition={(pos) => selectLibero("home", pos)} onClearLibero={() => clearLibero("home")} onSwapPositions={(a, b) => swapPositions("home", a, b)} />
                    <CourtView team={teams.opponent} started={started} liberoInfo={opponentLibero} onRotate={() => rotateTeam("opponent")} onSelectLiberoPosition={(pos) => selectLibero("opponent", pos)} onClearLibero={() => clearLibero("opponent")} onSwapPositions={(a, b) => swapPositions("opponent", a, b)} />
                  </div>
                </div>
                <div className="hidden md:block"><InfoPanel title="Nhật ký trận" team={teams[servingTeam]} liberoInfo={servingTeam === "home" ? homeLibero : opponentLibero} history={histories.match} /></div>
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-[330px_1fr_330px]">
                <div className="order-2 xl:order-1">
                  <PlayerForm team={currentTeam} onUpdatePlayer={(playerKey, field, value) => updatePlayer(currentKey, playerKey, field, value)} onUpdateLibero={(liberoId, field, value) => updateLibero(currentKey, liberoId, field, value)} onAddLibero={() => addLibero(currentKey)} onRemoveLibero={(liberoId) => removeLibero(currentKey, liberoId)} onSelectActiveLibero={(liberoId) => selectActiveLibero(currentKey, liberoId)} onStart={() => startTeam(currentKey)} onReset={() => resetTeam(currentKey)} onSetLiberoMode={(mode) => setLiberoMode(currentKey, mode)} onClearLibero={() => clearLibero(currentKey)} />
                </div>
                <div className="order-1 xl:order-2">
                  <CourtView team={currentTeam} started={started} liberoInfo={currentLibero} onRotate={() => rotateTeam(currentKey)} onSelectLiberoPosition={(pos) => selectLibero(currentKey, pos)} onClearLibero={() => clearLibero(currentKey)} onSwapPositions={(a, b) => swapPositions(currentKey, a, b)} />
                </div>
                <div className="order-3">
                  <InfoPanel title={`Thông tin ${currentTeam.label}`} team={currentTeam} liberoInfo={currentLibero} history={histories[currentKey]} />
                </div>
              </div>
            )}
          </>
        )}

        <footer className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-center text-sm font-bold text-slate-300 shadow-2xl backdrop-blur md:mt-8">
          Thiết Kế Bởi <span className="text-emerald-200">Thanh Tòng</span>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/90 px-4 py-2 shadow-[0_-8px_30px_rgb(0,0,0,0.5)] backdrop-blur-lg md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {tabs.map(([key, label, Icon]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors ${
                  isActive ? "text-emerald-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={20} className={isActive ? "scale-110 text-emerald-300" : "text-slate-400"} />
                <span className="text-[10px] font-black">{label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              setCompactMode(!compactMode);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-400 hover:text-slate-200"
          >
            {compactMode ? <Maximize2 size={20} className="text-orange-300" /> : <Minimize2 size={20} />}
            <span className="text-[10px] font-black">{compactMode ? "Mở rộng" : "Thu gọn"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
