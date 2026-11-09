"use client";
import { SetRow } from "./set-row";
import { PlanView } from "./plan-view";
import { AssessmentForm } from "./assessment-form";
import { WeightChart } from "./weight-chart";
import { Empty } from "./empty";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Play,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  User,
  X,
} from "lucide-react";

import { browserDb } from "@/lib/supabase";
import { exercises, muscles, evidence, type Exercise } from "@/lib/catalog";
import {
  emptyState,
  generatePlan,
  review,
  volume,
  type State,
  type Assessment,
  type Plan,
  type Session,
  type SetLog,
} from "@/lib/training";
import { assessmentSchema } from "@/lib/schemas";
const Anatomy = dynamic(() => import("./anatomy"), {
  ssr: false,
  loading: () => <div className="loading">Preparando mapa muscular…</div>,
});
const navigation = [
  ["Dashboard", LayoutDashboard],
  ["My Personal AI", Sparkles],
  ["Meu Treino", Dumbbell],
  ["Mapa Muscular", Activity],
  ["Biblioteca de Exercícios", BookOpen],
  ["Minha Evolução", TrendingUp],
  ["Periodização", CalendarDays],
  ["Histórico", History],
  ["Meu Perfil", User],
  ["Configurações", Settings],
] as const;
export default function App() {
  const [db] = useState(browserDb);
  const [token, setToken] = useState("");
  const [loaded, setLoaded] = useState(!db);
  const [state, setState] = useState<State>(emptyState);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState("Dashboard");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState("chest");
  const [libraryGroup, setLibraryGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [proposal, setProposal] = useState<Plan | null>(null);
  const [active, setActive] = useState<{
    index: number;
    startedAt: string;
    logs: SetLog[];
  } | null>(null);
  const [restEnd, setRestEnd] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const saving = useRef(false);
  useEffect(() => {
    if (!db) {
      setLoaded(true);
      return;
    }
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? "");
      if (!session) {
        setState(emptyState);
        setRevision(0);
        setLoaded(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [db]);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoaded(false);
    fetch("/api/data", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (!cancelled) {
          setState(d.state ?? emptyState);
          setRevision(d.revision);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);
  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(i);
      window.removeEventListener("beforeunload", warn);
    };
  }, [active]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (!detail) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    const controls = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex="0"]',
        ) ?? [],
      );
    controls()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetail(null);
      if (event.key !== "Tab") return;
      const list = controls(),
        first = list[0],
        last = list.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [detail]);
  async function save(next: State) {
    if (!token) {
      setError("Entre na sua conta para salvar.");
      return false;
    }
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/data", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: next, revision }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setRevision(d.revision);
      setState(next);
      setNotice("Alterações salvas.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  function go(name: string) {
    setPage(name);
    setMenu(false);
    setNotice("");
    setError("");
  }
  const a = state.assessment;
  const currentMuscle = muscles.find((m) => m.id === selected) ?? muscles[0];
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekSessions = state.sessions.filter(
    (s) => new Date(s.finishedAt) >= weekStart,
  );
  const weekSets = weekSessions.flatMap((s) => s.sets);
  const [displayDate, setDisplayDate] = useState<Date | null>(null);
  useEffect(() => setDisplayDate(new Date()), []);
  const dateLabel = displayDate
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(displayDate)
    : "SEU ESPAÇO DE EVOLUÇÃO";
  async function auth(form: FormData) {
    if (!db) return;
    setBusy(true);
    setError("");
    const credentials = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };
    const result =
      authMode === "login"
        ? await db.auth.signInWithPassword(credentials)
        : await db.auth.signUp(credentials);
    setBusy(false);
    if (result.error) setError(result.error.message);
    else if (authMode !== "login")
      setNotice(
        "Cadastro enviado. Confirme seu e-mail, se solicitado pelo Supabase.",
      );
  }
  async function ask() {
    if (!message.trim() || busy) return;
    const question = message;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: question }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await save({
        ...state,
        messages: [
          ...state.messages,
          { role: "user", content: question },
          { role: "assistant", content: d.answer },
        ].slice(-200) as State["messages"],
      });
      setMessage("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function finish(discomfort: boolean) {
    if (!active || !state.plan) return;
    if (!active.logs.length) {
      setError("Registre pelo menos uma série antes de finalizar.");
      return;
    }
    const session: Session = {
      id: crypto.randomUUID(),
      day: state.plan.days[active.index].name,
      startedAt: active.startedAt,
      finishedAt: new Date().toISOString(),
      sets: active.logs,
      discomfort,
    };
    if (await save({ ...state, sessions: [...state.sessions, session] })) {
      setActive(null);
      setRestEnd(0);
      go("Histórico");
    }
  }
  function build() {
    if (!a) {
      go("Meu Perfil");
      return;
    }
    try {
      setProposal(generatePlan(a));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className={dark ? "shell dark" : "shell"}>
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Dashboard");
          }}
        >
          <span className="brandmark">
            <Activity size={24} />
          </span>
          my personal<span className="branddot">.</span>
        </a>
        <p className="navlabel">SEU ESPAÇO DE EVOLUÇÃO</p>
        <nav>
          {navigation.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "navitem active" : "navitem"}
              onClick={() => go(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {page === name && <span className="navdot" />}
            </button>
          ))}
        </nav>
        <div className="coachcard">
          <Sparkles size={23} />
          <h3>Ciência em cada movimento.</h3>
          <p>Conheça seu corpo. Treine com propósito.</p>
          <button onClick={() => go("My Personal AI")}>
            Conversar com a IA <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="account">
          <div className="avatar">{a?.name.slice(0, 1) || "M"}</div>
          <div>
            <b>{a?.name || "Seu espaço"}</b>
            <small>{token ? "Conta conectada" : "Conecte sua conta"}</small>
          </div>
          {token && (
            <button
              aria-label="Sair"
              onClick={() => {
                setActive(null);
                db?.auth.signOut();
              }}
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button
            className="mobilemenu"
            aria-label="Abrir navegação"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <span>
            Meu espaço <ChevronRight size={14} /> <b>{page}</b>
          </span>
          <div>
            <span className="status">
              <i />
              {token ? "Conectado" : "Primeiro acesso"}
            </span>
            <button
              className="iconbutton"
              aria-label="Alternar tema"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀" : "☾"}
            </button>
            <div className="avatar small">{a?.name.slice(0, 1) || "M"}</div>
          </div>
        </header>
        <div className="content">
          <div className="heading">
            <div>
              <p className="eyebrow">MY PERSONAL / {dateLabel}</p>
              <h1>
                {page === "Dashboard"
                  ? `Seu próximo passo começa aqui${a ? ", " + a.name.split(" ")[0] : ""}.`
                  : page}
              </h1>
              <p>
                {page === "Dashboard"
                  ? "Mais consciência no treino. Mais consistência na sua evolução."
                  : "Seu treinamento, com informação e acompanhamento."}
              </p>
            </div>
            {page === "Dashboard" && (
              <button
                className="primary"
                onClick={() => go(a ? "Meu Treino" : "Meu Perfil")}
              >
                <Plus size={17} />
                {a ? "Ver meu treino" : "Começar avaliação"}
              </button>
            )}
          </div>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Fechar erro">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert" role="status">
              {notice}
              <button onClick={() => setNotice("")} aria-label="Fechar aviso">
                <X size={16} />
              </button>
            </div>
          )}
          {!db && (
            <div className="configbanner">
              <ShieldCheck size={20} />
              <div>
                <b>Ambiente aguardando configuração</b>
                <p>
                  Conecte o Supabase no arquivo .env.local para criar sua conta
                  e salvar seus dados. Biblioteca e mapa muscular já podem ser
                  explorados.
                </p>
              </div>
            </div>
          )}
          {db && !token && (
            <section className="card auth">
              <div>
                <span className="pill">SEU TREINO COMEÇA COM VOCÊ</span>
                <h2>
                  {authMode === "login"
                    ? "Entre no seu espaço."
                    : "Crie sua conta."}
                </h2>
                <p>Seu histórico e seus objetivos, em um só lugar.</p>
              </div>
              <form action={auth}>
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  Senha
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
                <button className="primary" disabled={busy}>
                  {busy
                    ? "Aguarde…"
                    : authMode === "login"
                      ? "Entrar"
                      : "Cadastrar"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode(authMode === "login" ? "signup" : "login")
                  }
                >
                  {authMode === "login"
                    ? "Ainda não tenho conta"
                    : "Já tenho conta"}
                </button>
              </form>
            </section>
          )}
          {!loaded ? (
            <div className="card loading">Carregando seus dados…</div>
          ) : (
            <>
              {page === "Dashboard" && (
                <>
                  <div className="stats">
                    {[
                      [
                        Target,
                        "Objetivo",
                        a?.goal || "Vamos definir",
                        "Personalizado para você",
                      ],
                      [
                        CalendarDays,
                        "Treinos nesta semana",
                        `${weekSessions.length}`,
                        a ? `Meta: ${a.days} sessões` : "Defina sua frequência",
                      ],
                      [
                        Dumbbell,
                        "Volume registrado",
                        `${volume(weekSets).toLocaleString("pt-BR")} kg`,
                        "Carga × repetições; não inclui peso corporal",
                      ],
                      [
                        TrendingUp,
                        "Séries concluídas",
                        `${weekSets.length}`,
                        "Na semana atual",
                      ],
                    ].map(([Icon, label, value, sub], i) => {
                      const I = Icon as typeof Target;
                      return (
                        <section className="card stat" key={i}>
                          <span className="statlabel">
                            {String(label)}
                            <I size={18} />
                          </span>
                          <strong>{String(value)}</strong>
                          <small>{String(sub)}</small>
                        </section>
                      );
                    })}
                  </div>
                  <div className="dashboardgrid">
                    <section className="card bodycard">
                      <div className="cardheading">
                        <div>
                          <span className="eyebrow">CONHEÇA SEU CORPO</span>
                          <h2>Seu mapa muscular</h2>
                        </div>
                        <span className="pill">MODELO 3D</span>
                      </div>
                      <Anatomy selected={selected} onSelect={setSelected} />
                      <div className="musclefooter">
                        <span>
                          <i />
                          {currentMuscle.name}
                        </span>
                        <button onClick={() => go("Mapa Muscular")}>
                          Explorar anatomia <ArrowUpRight size={17} />
                        </button>
                      </div>
                    </section>
                    <div className="stack">
                      <section className="nextwork">
                        <span className="eyebrow">UM PASSO DE CADA VEZ</span>
                        <h2>
                          {state.plan
                            ? state.plan.days[0].name
                            : "Um plano que começa com a sua história."}
                        </h2>
                        <p>
                          {state.plan
                            ? "Sua ficha está pronta. Reserve um momento para cuidar de você."
                            : "Conte sobre seus objetivos, rotina e experiência para preparar sua primeira proposta."}
                        </p>
                        <button
                          onClick={() => go(a ? "Meu Treino" : "Meu Perfil")}
                        >
                          {a ? "Abrir meu treino" : "Fazer minha avaliação"}
                          <ArrowUpRight size={19} />
                        </button>
                        <Dumbbell className="watermark" size={115} />
                      </section>
                      <section className="card">
                        <div className="cardheading">
                          <h2>Foco da semana</h2>
                          <Activity size={19} />
                        </div>
                        {muscles.map((m) => {
                          const n = weekSets.filter(
                            (s) =>
                              exercises.find((e) => e.id === s.exerciseId)
                                ?.group === m.id,
                          ).length;
                          return (
                            <div className="barrow" key={m.id}>
                              <span>{m.name}</span>
                              <div>
                                <i
                                  style={{
                                    width: `${Math.min(100, (n / Math.max(1, weekSets.length)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <b>{n}</b>
                            </div>
                          );
                        })}
                        <small>
                          Séries por grupo principal. Não estima crescimento
                          muscular.
                        </small>
                      </section>
                      <section className="aihint">
                        <Sparkles size={25} />
                        <div>
                          <b>Seu treino pode evoluir com você.</b>
                          <p>{review(state.sessions)}</p>
                          <button onClick={() => go("Periodização")}>
                            Ver acompanhamento <ChevronRight size={16} />
                          </button>
                        </div>
                      </section>
                    </div>
                  </div>
                  <section className="card">
                    <div className="cardheading">
                      <div>
                        <span className="eyebrow">
                          CONSISTÊNCIA CONSTRÓI RESULTADOS
                        </span>
                        <h2>Sua evolução, de verdade</h2>
                      </div>
                      <button onClick={() => go("Minha Evolução")}>
                        Ver evolução <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <WeightChart state={state} />
                  </section>
                </>
              )}
              {page === "Meu Perfil" && (
                <AssessmentForm
                  key={a?.name || "new"}
                  assessment={a}
                  disabled={busy || !token || !!active}
                  onSave={async (value) => {
                    if (
                      await save({ ...state, assessment: value, plan: null })
                    ) {
                      setProposal(null);
                      go("Meu Treino");
                    }
                  }}
                />
              )}
              {page === "Mapa Muscular" && (
                <div className="twocol">
                  <section className="card">
                    <Anatomy selected={selected} onSelect={setSelected} />
                  </section>
                  <section className="card">
                    <span className="eyebrow">REGIÃO SELECIONADA</span>
                    <h2>{currentMuscle.name}</h2>
                    <p>{currentMuscle.function}</p>
                    <h3>Estruturas e subdivisões</h3>
                    <ul>
                      {currentMuscle.parts.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <p className="muted">
                      A seleção é por grupo muscular. As subdivisões são
                      descritas abaixo da ilustração anatômica.
                    </p>
                    <h3>Exercícios relacionados</h3>
                    {exercises
                      .filter(
                        (e) =>
                  e.group === selected ||
                          e.secondary.includes(selected),
                      )
                      .map((e) => (
                        <button
                          className="exerciserow"
                          key={e.id}
                          onClick={() => setDetail(e)}
                        >
                          {e.name}
                          <ChevronRight size={17} />
                        </button>
                      ))}
                  </section>
                </div>
              )}
              {page === "Biblioteca de Exercícios" && (
                <>
                  <div className="filters">
                    <input
                      placeholder="Buscar exercício, equipamento ou movimento…"
                      aria-label="Pesquisar exercícios"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <select
                      aria-label="Grupo muscular"
                      value={libraryGroup}
                      onChange={(e) => setLibraryGroup(e.target.value)}
                    >
                      <option value="all">Todos os músculos</option>
                      {muscles.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="exercisegrid">
                    {exercises
                      .filter(
                        (e) =>
                          (libraryGroup === "all" ||
                            e.group === libraryGroup) &&
                          `${e.name} ${e.equipment} ${e.pattern}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((e) => (
                        <button
                          className="card exercisecard"
                          key={e.id}
                          onClick={() => setDetail(e)}
                        >
                          <div className="exerciseicon">
                            <Dumbbell size={35} />
                            <span>{e.pattern}</span>
                          </div>
                          <span className="eyebrow">
                            {e.equipment} · {e.level}
                          </span>
                          <h3>{e.name}</h3>
                          <p>{muscles.find((m) => m.id === e.group)?.name}</p>
                          <span className="link">
                            Ver execução <ArrowUpRight size={16} />
                          </span>
                        </button>
                      ))}
                  </div>
                </>
              )}
              {page === "Meu Treino" && (
                <>
                  <section className="card cardheading">
                    <div>
                      <h2>
                        {state.plan
                          ? "Seu plano de treinamento"
                          : "Vamos criar seu primeiro plano?"}
                      </h2>
                      <p>
                        {state.plan?.reason ||
                          "Preencha sua avaliação antes de gerar uma proposta. Você revisa antes de salvar."}
                      </p>
                    </div>
                    <button
                      className="primary"
                      disabled={busy || !!active}
                      onClick={build}
                    >
                      <Sparkles size={18} />
                      {state.plan ? "Nova proposta" : "Gerar proposta"}
                    </button>
                  </section>
                  {proposal && (
                    <section className="card proposal">
                      <span className="pill">
                        PROPOSTA · AGUARDANDO SUA REVISÃO
                      </span>
                      <h2>
                        {proposal.days.length} dias · ciclo de {proposal.weeks}{" "}
                        semanas
                      </h2>
                      <p>{proposal.reason}</p>
                      <PlanView plan={proposal} onDetail={setDetail} />
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={async () => {
                          if (await save({ ...state, plan: proposal }))
                            setProposal(null);
                        }}
                      >
                        Aprovar e salvar proposta
                      </button>
                      <button onClick={() => setProposal(null)}>
                        Descartar
                      </button>
                    </section>
                  )}
                  {state.plan && !active && (
                    <PlanView
                      plan={state.plan}
                      onDetail={setDetail}
                      onStart={(index) => {
                        setActive({
                          index,
                          startedAt: new Date().toISOString(),
                          logs: [],
                        });
                        setError("");
                      }}
                      onChange={(plan) => save({ ...state, plan })}
                      disabled={busy}
                    />
                  )}
                  {state.plan && active && (
                    <section className="card">
                      <div className="cardheading">
                        <div>
                          <span className="pill">SESSÃO EM ANDAMENTO</span>
                          <h2>{state.plan.days[active.index].name}</h2>
                        </div>
                        <span className="timer">
                          <Timer size={20} />
                          {Math.max(0, Math.ceil((restEnd - now) / 1000))}s
                          descanso
                        </span>
                      </div>
                      <p>
                        Registre apenas séries realizadas. Mantenha esta página
                        aberta: a sessão só será salva ao finalizar.
                      </p>
                      {state.plan.days[active.index].items.map((item) => (
                        <div className="setgroup" key={item.exerciseId}>
                          <h3>
                            {
                              exercises.find((e) => e.id === item.exerciseId)
                                ?.name
                            }
                          </h3>
                          <small>
                            {item.reps} repetições sugeridas · RIR {item.rir} ·{" "}
                            {item.rest}s de descanso
                          </small>
                          {Array.from({ length: item.sets }, (_, index) => {
                            const log = active.logs.find(
                              (l) =>
                                l.exerciseId === item.exerciseId &&
                                l.set === index,
                            );
                            return (
                              <SetRow
                                key={index}
                                index={index}
                                log={log}
                                defaultReps={item.reps}
                                onLog={(value) => {
                                  setActive({
                                    ...active,
                                    logs: [
                                      ...active.logs.filter(
                                        (l) =>
                                          !(
                                            l.exerciseId === item.exerciseId &&
                                            l.set === index
                                          ),
                                      ),
                                      {
                                        ...value,
                                        exerciseId: item.exerciseId,
                                        set: index,
                                      },
                                    ],
                                  });
                                  setRestEnd(Date.now() + item.rest * 1000);
                                }}
                              />
                            );
                          })}
                        </div>
                      ))}
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() => finish(false)}
                      >
                        Finalizar sessão
                      </button>
                      <button disabled={busy} onClick={() => finish(true)}>
                        Finalizar e registrar desconforto
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Descartar esta sessão não salva?"))
                            setActive(null);
                        }}
                      >
                        Descartar sessão
                      </button>
                    </section>
                  )}
                </>
              )}
              {page === "Minha Evolução" && (
                <>
                  <section className="card">
                    <h2>Cada registro conta.</h2>
                    <p>
                      Medidas informadas por você. Não são estimativas de
                      composição corporal.
                    </p>
                    <form
                      className="inlineform"
                      action={async (f) => {
                        const weight = Number(f.get("weight")),
                          waist = f.get("waist")
                            ? Number(f.get("waist"))
                            : null;
                        await save({
                          ...state,
                          measurements: [
                            ...state.measurements,
                            {
                              id: crypto.randomUUID(),
                              date: String(f.get("date")),
                              weight,
                              waist,
                            },
                          ],
                        });
                      }}
                    >
                      <label>
                        Data
                        <input
                          name="date"
                          type="date"
                          required
                          defaultValue={new Date().toLocaleDateString("en-CA")}
                          max={new Date().toLocaleDateString("en-CA")}
                        />
                      </label>
                      <label>
                        Peso (kg)
                        <input
                          name="weight"
                          type="number"
                          step="0.1"
                          min="25"
                          max="350"
                          required
                        />
                      </label>
                      <label>
                        Cintura (cm, opcional)
                        <input
                          name="waist"
                          type="number"
                          step="0.1"
                          min="30"
                          max="250"
                        />
                      </label>
                      <button className="primary" disabled={!token || busy}>
                        Registrar medida
                      </button>
                    </form>
                    <WeightChart state={state} />
                    {state.measurements
                      .slice()
                      .reverse()
                      .map((m) => (
                        <div className="exerciserow" key={m.id}>
                          <span>
                            {m.date} · {m.weight} kg
                            {m.waist ? ` · cintura ${m.waist} cm` : ""}
                          </span>
                          <button
                            disabled={busy}
                            onClick={() =>
                              save({
                                ...state,
                                measurements: state.measurements.filter(
                                  (x) => x.id !== m.id,
                                ),
                              })
                            }
                          >
                            Excluir registro
                          </button>
                        </div>
                      ))}
                  </section>
                  <section className="card">
                    <h2>Entenda as adaptações</h2>
                    <p>
                      A prática pode melhorar coordenação, força e capacidade de
                      trabalho. Hipertrofia e mudanças corporais variam entre
                      pessoas e dependem de vários fatores. Este sistema não
                      prevê sua aparência futura.
                    </p>
                    <p>
                      Fotos privadas e simulação visual de adaptações ainda não
                      estão disponíveis nesta versão.
                    </p>
                  </section>
                </>
              )}
              {page === "Periodização" && (
                <section className="card">
                  <span className="pill">REAVALIAR NÃO É TROCAR TUDO</span>
                  <h2>
                    {state.plan
                      ? `Ciclo de ${state.plan.weeks} semanas`
                      : "Seu ciclo começa com um plano"}
                  </h2>
                  <p>{review(state.sessions)}</p>
                  {state.plan && (
                    <>
                      <p>
                        Reavaliação sugerida:{" "}
                        {new Date(
                          new Date(state.plan.createdAt).getTime() +
                            state.plan.weeks * 7 * 86400000,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                      <label>
                        Duração do ciclo
                        <select
                          value={state.plan.weeks}
                          disabled={busy}
                          onChange={(e) =>
                            save({
                              ...state,
                              plan: {
                                ...state.plan!,
                                weeks: Number(e.target.value),
                              },
                            })
                          }
                        >
                          {[4, 5, 6, 7, 8].map((w) => (
                            <option key={w} value={w}>
                              {w} semanas
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  <p>
                    O prazo organiza a revisão. Você pode manter os exercícios
                    quando continua evoluindo, com boa execução e recuperação.
                  </p>
                  <button
                    className="primary"
                    onClick={() => go("My Personal AI")}
                  >
                    Conversar sobre meu progresso
                  </button>
                  <h3>Fontes iniciais</h3>
                  {evidence.map((e) => (
                    <p key={e.url}>
                      <a href={e.url} target="_blank" rel="noreferrer">
                        {e.title} ↗
                      </a>
                      <br />
                      <small>{e.note}</small>
                    </p>
                  ))}
                </section>
              )}
              {page === "Histórico" && (
                <section className="card">
                  <h2>Sessões realizadas</h2>
                  {!state.sessions.length ? (
                    <Empty text="Seu histórico começa quando você finaliza seu primeiro treino." />
                  ) : (
                    state.sessions
                      .slice()
                      .reverse()
                      .map((s) => (
                        <details key={s.id}>
                          <summary>
                            {s.day} ·{" "}
                            {new Date(s.finishedAt).toLocaleString("pt-BR")} ·{" "}
                            {s.sets.length} séries
                          </summary>
                          <p>
                            {volume(s.sets).toLocaleString("pt-BR")} kg de
                            volume externo registrado
                            {s.discomfort ? " · Desconforto relatado" : ""}
                          </p>
                          {s.sets.map((l, i) => (
                            <p key={i}>
                              {
                                exercises.find((e) => e.id === l.exerciseId)
                                  ?.name
                              }{" "}
                              · série {l.set + 1} · {l.kg} kg × {l.reps} · RPE{" "}
                              {l.rpe}
                            </p>
                          ))}
                        </details>
                      ))
                  )}
                </section>
              )}
              {page === "My Personal AI" && (
                <section className="card chat">
                  <div className="cardheading">
                    <div className="chatbrand">
                      <span className="brandmark">
                        <Sparkles />
                      </span>
                      <div>
                        <h2>My Personal AI</h2>
                        <small>Informação para treinar com consciência</small>
                      </div>
                    </div>
                    <span className="pill">ASSISTENTE EDUCATIVO</span>
                  </div>
                  <div className="messages">
                    {!state.messages.length && (
                      <Empty text="Pergunte sobre execução, recuperação ou sobre a sua ficha. A IA precisa de avaliação salva, consentimento e configuração da OpenAI." />
                    )}
                    {state.messages.map((m, i) => (
                      <div key={i} className={`bubble ${m.role}`}>
                        <b>{m.role === "user" ? "Você" : "My Personal AI"}</b>
                        <p>{m.content}</p>
                      </div>
                    ))}
                  </div>
                  <form
                    className="chatinput"
                    onSubmit={(e) => {
                      e.preventDefault();
                      ask();
                    }}
                  >
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      placeholder="Como posso melhorar a execução do meu treino?"
                      aria-label="Mensagem para a IA"
                    />
                    <button
                      className="primary"
                      disabled={busy || !token || !message.trim()}
                    >
                      {busy ? "Aguarde…" : "Enviar"}
                      <ArrowUpRight size={18} />
                    </button>
                  </form>
                  <small>
                    Até 20 consultas por dia. As respostas não alteram sua
                    ficha. A IA pode errar; valide orientações com um
                    profissional.
                  </small>
                </section>
              )}
              {page === "Configurações" && (
                <section className="card">
                  <h2>Preferências e privacidade</h2>
                  <button className="secondary" onClick={() => setDark(!dark)}>
                    Usar tema {dark ? "claro" : "escuro"}
                  </button>
                  <h3>Seus dados são seus.</h3>
                  <p>
                    Seus registros são usados para organizar o treino. Ao
                    autorizar a IA, avaliação sem nome e registros recentes são
                    enviados à OpenAI. Não informe dados médicos desnecessários.
                    Você pode retirar esse consentimento no perfil.
                  </p>
                  <p>
                    Esta é uma versão inicial. Antes de oferecer o serviço ao
                    público, o operador deve informar sua identidade, contato de
                    privacidade, bases legais, retenção e subprocessadores.
                  </p>
                  <button
                    disabled={!token}
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(state, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "my-personal-meus-dados.json";
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Exportar meus dados
                  </button>
                  <h3>Excluir conta e dados</h3>
                  <p>
                    A exclusão é definitiva e remove os registros vinculados à
                    conta.
                  </p>
                  <form
                    className="inlineform"
                    action={async (f) => {
                      setBusy(true);
                      try {
                        const r = await fetch("/api/account", {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            confirmation: f.get("confirmation"),
                          }),
                        });
                        const d = await r.json();
                        if (!r.ok) throw Error(d.error);
                        await db?.auth.signOut();
                        setNotice("Conta excluída.");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label>
                      Digite EXCLUIR
                      <input
                        name="confirmation"
                        pattern="EXCLUIR"
                        required
                        autoComplete="off"
                      />
                    </label>
                    <button className="danger" disabled={!token || busy}>
                      Excluir definitivamente
                    </button>
                  </form>
                </section>
              )}
            </>
          )}
          <footer>
            <span>
              <Activity size={15} /> My Personal
            </span>
            <p>
              Informação e acompanhamento. Não substitui avaliação de
              profissional habilitado.
            </p>
            <span>Feito para o seu ritmo.</span>
          </footer>
        </div>
      </main>
      {detail && (
        <div className="modaloverlay" onClick={() => setDetail(null)}>
          <section
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-label={detail.name}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setDetail(null)}
              aria-label="Fechar"
            >
              <X />
            </button>
            <span className="pill">
              {detail.equipment} · {detail.level}
            </span>
            <h2>{detail.name}</h2>
            <p>{detail.technical}</p>
            <h3>Como executar</h3>
            <ol>
              {detail.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <h3>Músculos envolvidos</h3>
            <p>
              Principal: {muscles.find((m) => m.id === detail.group)?.name}.
              Auxiliares:{" "}
              {detail.secondary
                .map((id) => muscles.find((m) => m.id === id)?.name)
                .join(", ") || "dependem da estabilização individual"}
              .
            </p>
            <h3>Cuidados</h3>
            <p>{detail.care} Interrompa se sentir dor.</p>
            <p>
              Alternativa: {detail.alternative}. A escolha depende de
              equipamentos e limitações.
            </p>
            <p>
              Progrida apenas com técnica consistente e recuperação adequada.
              Séries e repetições são definidas no plano, conforme avaliação.
            </p>
            <small>
              Demonstração em vídeo/animação ainda não disponível. As instruções
              não substituem supervisão técnica.
            </small>
          </section>
        </div>
      )}
    </div>
  );
}
