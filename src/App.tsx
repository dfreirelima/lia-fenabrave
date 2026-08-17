import { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { PinGate } from "@/screens/PinGate";
import { BottomNav } from "@/components/BottomNav";
import { useConversations } from "@/lib/queries";

// Home ships in the entry chunk; the rest stream in on first navigation.
import Home from "@/screens/Home";
const Conversas = lazy(() => import("@/screens/Conversas"));
const Operacoes = lazy(() => import("@/screens/Operacoes"));
const Equipe = lazy(() => import("@/screens/Equipe"));
const Thread = lazy(() => import("@/screens/Thread"));

export default function App() {
  return (
    <PinGate>
      <Shell />
    </PinGate>
  );
}

function Shell() {
  const location = useLocation();
  const { data: conversations } = useConversations();
  const liveCount = conversations?.filter((c) => c.is_live).length ?? 0;

  return (
    <div className="relative h-full overflow-hidden">
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/conversas" element={<Conversas />} />
              <Route path="/operacoes" element={<Operacoes />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/conversa/:id" element={<Thread />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>

      <BottomNav badge={liveCount} />
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="h-full px-4 pt-safe">
      <div className="skeleton mt-4 h-8 w-40 rounded-xl" />
      <div className="skeleton mt-5 h-44 rounded-card" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="skeleton h-28 rounded-tile" />
        <div className="skeleton h-28 rounded-tile" />
      </div>
      <div className="skeleton mt-4 h-32 rounded-card" />
    </div>
  );
}
