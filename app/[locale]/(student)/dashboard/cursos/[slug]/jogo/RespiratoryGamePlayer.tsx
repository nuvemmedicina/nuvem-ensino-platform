"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./RespiratoryGamePlayer.module.css";
import { RespiratoryCase, casesFor } from "@/lib/respiratoryGame/cases";
import { libraryFor } from "@/lib/respiratoryGame/library";
import { stringsFor, GameLang, levelLabel } from "@/lib/respiratoryGame/i18n";
import {
  AnswerMode,
  ConfidenceLevel,
  LevelSetting,
  buildSession,
  conceptKey,
  conceptLabel,
  diagnosisFor,
  diagnosisOptions,
  priorityOf,
  chartGeometry,
} from "@/lib/respiratoryGame/logic";
import { recordRespiratoryGameAnswer, type RespiratoryProgressData } from "./actions";

type View = "game" | "performance" | "review" | "library" | "settings";

type PersistedSettings = {
  lang: GameLang;
  level: LevelSetting;
  mode: AnswerMode;
  confidence: ConfidenceLevel;
};

const SETTINGS_KEY = "nuvemRespiratoryGameSettings";
const DEFAULT_SETTINGS: PersistedSettings = { lang: "pt", level: "progressive", mode: "statement", confidence: "média" };

function Chart({ c, feedback }: { c: RespiratoryCase; feedback?: boolean }) {
  const g = chartGeometry(c);
  return (
    <svg viewBox={`0 0 ${g.W} ${g.H}`} width="100%">
      {g.gridLines.map((line, k) => (
        <g key={k}>
          <line x1={g.p} y1={line.y} x2={g.W - g.p} y2={line.y} stroke="#e5eaed" />
          <text x={g.p - 6} y={line.y + 4} fontSize={10} textAnchor="end" fill="#7892a0">
            {line.v}
          </text>
        </g>
      ))}
      <polyline fill="none" stroke="#285a72" strokeWidth={4} points={g.h2Points} />
      <polyline fill="none" stroke="#6ca9a7" strokeWidth={4} strokeDasharray="7 6" points={g.ch4Points} />
      {g.timeLabels.map((tl, idx) => (
        <text key={idx} x={tl.x} y={g.H - 10} fontSize={10} textAnchor="middle" fill="#7892a0">
          {tl.t}
        </text>
      ))}
      {feedback && g.markerLine && (
        <line
          x1={g.markerLine.x1}
          y1={g.markerLine.y1}
          x2={g.markerLine.x2}
          y2={g.markerLine.y2}
          stroke="#b25b56"
          strokeDasharray="6 5"
        />
      )}
      {feedback && g.markerLine2 && (
        <line
          x1={g.markerLine2.x1}
          y1={g.markerLine2.y1}
          x2={g.markerLine2.x2}
          y2={g.markerLine2.y2}
          stroke="#b25b56"
          strokeDasharray="6 5"
        />
      )}
    </svg>
  );
}

function loadSettings(): PersistedSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // localStorage indisponível — segue com os padrões
  }
  return DEFAULT_SETTINGS;
}

export function RespiratoryGamePlayer({ initialProgress }: { initialProgress: RespiratoryProgressData }) {
  // Estado inicial é fixo (igual no servidor e no cliente) de propósito: ler
  // localStorage ou embaralhar casos com Math.random() direto no useState
  // faria o HTML da hidratação divergir do renderizado no servidor. A sessão
  // real (com as preferências salvas) só é montada depois, no useEffect.
  const [settings, setSettings] = useState<PersistedSettings>(DEFAULT_SETTINGS);
  const [draftSettings, setDraftSettings] = useState<PersistedSettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<View>("game");
  const [progress, setProgress] = useState<RespiratoryProgressData>(initialProgress);

  const [sessionCases, setSessionCases] = useState<RespiratoryCase[]>([]);
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [done, setDone] = useState(false);

  const [dragX, setDragX] = useState(0);
  const [locked, setLocked] = useState(false);
  const [exiting, setExiting] = useState<-1 | 0 | 1>(0);
  const [feedback, setFeedback] = useState<{
    caseData: RespiratoryCase;
    ok: boolean;
    userLabel: string;
    expectedLabel: string;
  } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scorePct, setScorePct] = useState(0);

  const pointerStartX = useRef<number | null>(null);

  const strings = stringsFor(settings.lang);

  function resetCardPosition() {
    setDragX(0);
    setExiting(0);
    setLocked(false);
  }

  function startSession(level: LevelSetting, lang: GameLang, list?: RespiratoryCase[], rev = false) {
    const pool = casesFor(lang);
    const session = list ?? buildSession(pool, level, progress.conceptStats);
    setSessionCases(session);
    setIndex(0);
    setHits(0);
    setStreak(0);
    setReviewMode(rev);
    setDone(false);
    setFeedback(null);
    setDetailsOpen(false);
    setScorePct(0);
    resetCardPosition();
  }

  // Só depois de hidratar: lê as preferências salvas e monta a primeira
  // sessão (com embaralhamento aleatório dos casos). Fazer isso aqui, em vez
  // de no estado inicial, evita divergir do HTML renderizado no servidor.
  /* eslint-disable react-hooks/set-state-in-effect -- inicialização client-only
   * (localStorage + Math.random()) que precisa ficar fora da renderização do
   * servidor; ver comentário acima dos estados. */
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setDraftSettings(loaded);
    setSessionCases(buildSession(casesFor(loaded.lang), loaded.level, initialProgress.conceptStats));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const c = sessionCases[index];
  const next = sessionCases[index + 1];

  function finish(ok: boolean, userLabel: string, expectedLabel: string, direction: -1 | 1) {
    if (locked || !c) return;
    setLocked(true);
    const newHits = ok ? hits + 1 : hits;
    const newStreak = ok ? streak + 1 : 0;
    setHits(newHits);
    setStreak(newStreak);
    setScorePct(Math.round((newHits / (index + 1)) * 100));

    recordRespiratoryGameAnswer({
      caseId: c.id,
      category: c.category,
      conceptKey: conceptKey(c),
      correct: ok,
      mode: settings.mode,
      confidence: settings.confidence,
      streakAfterAnswer: newStreak,
      reviewMode,
    }).then((updated) => setProgress(updated));

    setExiting(direction);
    window.setTimeout(() => {
      setFeedback({ caseData: c, ok, userLabel, expectedLabel });
    }, 220);
  }

  function choose(value: boolean) {
    if (locked || !c) return;
    const expectedBool = settings.mode === "validity" ? c.category !== "Qualidade" : c.answer;
    const ok = value === expectedBool;
    const userLabel = value ? strings.validCorrect : strings.invalidIncorrect;
    const expectedLabel = expectedBool ? strings.validCorrect : strings.invalidIncorrect;
    finish(ok, userLabel, expectedLabel, value ? 1 : -1);
  }

  function answerDiagnosis(chosen: string) {
    if (locked || !c) return;
    const expected = diagnosisFor(c, settings.lang);
    finish(chosen === expected, chosen, expected, 1);
  }

  function goNext() {
    setFeedback(null);
    setDetailsOpen(false);
    const nextIndex = index + 1;
    if (nextIndex >= sessionCases.length) {
      setDone(true);
    } else {
      setIndex(nextIndex);
      resetCardPosition();
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (locked || settings.mode === "diagnosis") return;
    if ((e.target as HTMLElement).closest("button")) return;
    pointerStartX.current = e.clientX;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current == null || locked) return;
    setDragX(e.clientX - pointerStartX.current);
  }
  function onPointerUp() {
    if (pointerStartX.current == null) return;
    pointerStartX.current = null;
    if (Math.abs(dragX) > 110) choose(dragX > 0);
    else setDragX(0);
  }

  function startReview() {
    const cases = casesFor(settings.lang);
    const ranked = cases
      .filter((x) => progress.errorCaseIds.includes(x.id))
      .sort((a, b) => priorityOf(b, progress.conceptStats) - priorityOf(a, progress.conceptStats));
    if (!ranked.length) return;
    setView("game");
    startSession(settings.level, settings.lang, ranked, true);
  }

  function startDaily() {
    const cases = casesFor(settings.lang);
    const shuffled = [...cases]
      .sort(() => Math.random() - 0.5)
      .sort((a, b) => priorityOf(b, progress.conceptStats) - priorityOf(a, progress.conceptStats))
      .slice(0, 5);
    setView("game");
    startSession(settings.level, settings.lang, shuffled, false);
  }

  function saveSettings() {
    setSettings(draftSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(draftSettings));
    } catch {
      // per-viewer apenas: se não puder salvar, segue sem persistir a preferência
    }
    setView("game");
    startSession(draftSettings.level, draftSettings.lang);
  }

  const cardStyle: React.CSSProperties =
    exiting !== 0
      ? { transform: `translateX(${exiting * 1200}px) rotate(${exiting * 18}deg)`, opacity: 0 }
      : dragX !== 0
        ? { transform: `translateX(${dragX}px) rotate(${dragX / 25}deg)` }
        : {};

  const isDiagnosis = settings.mode === "diagnosis";

  const navItems: { key: View; label: string }[] = [
    { key: "game", label: strings.training },
    { key: "performance", label: strings.performance },
    { key: "review", label: strings.reviewErrors },
    { key: "library", label: strings.support },
  ];

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandCopy}>
            <h1>{strings.medicalEducation}</h1>
            <p>{strings.trainingSubtitle}</p>
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.pill}>
            {strings.streak}: <b>{streak}</b>
          </div>
          <div className={styles.pill}>
            {strings.hits}: <b>{hits}</b>
          </div>
        </div>
      </header>

      <nav className={styles.navtools}>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`${styles.navBtn} ${view === item.key ? styles.active : ""}`}
            onClick={() => setView(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button
          className={`${styles.navBtn} ${view === "settings" ? styles.active : ""}`}
          onClick={() => {
            setDraftSettings(settings);
            setView("settings");
          }}
        >
          {strings.settings}
        </button>
      </nav>

      {view === "game" && (
        <div className={styles.layout}>
          <main>
            {!done && c && (
              <>
                <div className={styles.trainingStatus}>
                  <span>{strings.caseOf(index + 1, sessionCases.length)}</span>
                  <span>{strings.bankNote(casesFor(settings.lang).length)}</span>
                </div>
                <div className={styles.cardWrap}>
                  <div className={styles.deck}>
                    {next && (
                      <div className={styles.cardPreview}>
                        <div className={styles.previewLabel}>{strings.nextCase}</div>
                        <div className={styles.kicker}>
                          <span>{next.type}</span>
                          <span>{levelLabel[next.difficulty][settings.lang]}</span>
                        </div>
                        <h2 className={styles.claim}>{isDiagnosis ? strings.diagnosisClaim : next.claim}</h2>
                      </div>
                    )}
                    <div
                      className={styles.card}
                      style={cardStyle}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                    >
                      <div
                        className={`${styles.stamp} ${styles.stampPositive}`}
                        style={{ opacity: Math.max(0, dragX / 120) }}
                      >
                        {strings.correctUpper}
                      </div>
                      <div
                        className={`${styles.stamp} ${styles.stampNegative}`}
                        style={{ opacity: Math.max(0, -dragX / 120) }}
                      >
                        {strings.incorrectUpper}
                      </div>
                      <div className={styles.kicker}>
                        <span>{strings.caseOf(index + 1, sessionCases.length)}</span>
                        <span>
                          <span>{levelLabel[c.difficulty][settings.lang]}</span> · <span>{c.type}</span>
                        </span>
                      </div>
                      <h2 className={styles.claim}>
                        {isDiagnosis ? strings.diagnosisClaim : settings.mode === "validity" ? strings.validityClaim : c.claim}
                      </h2>
                      <p className={styles.question}>
                        {isDiagnosis
                          ? strings.diagnosisQuestion
                          : settings.mode === "validity"
                            ? strings.validityQuestion
                            : strings.statementQuestion}
                      </p>
                      <div className={styles.chartBox}>
                        <div className={styles.chartHead}>
                          <span>{strings.expiredConcentration}</span>
                          <div className={styles.legend}>
                            <span>H₂</span>
                            <span>CH₄</span>
                          </div>
                        </div>
                        <Chart c={c} />
                      </div>
                      <div className={styles.meta}>
                        {c.meta.map((v, j) => (
                          <div key={j}>
                            <b>{[strings.substrateExam, strings.reference, strings.context][j]}</b>
                            {v}
                          </div>
                        ))}
                      </div>
                      {isDiagnosis ? (
                        <div className={styles.diagnosisActions}>
                          {diagnosisOptions(c, settings.lang).map((opt) => (
                            <button key={opt} onClick={() => answerDiagnosis(opt)}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.actions}>
                          <button className={`${styles.btn} ${styles.btnNo}`} onClick={() => choose(false)}>
                            <span className={styles.choiceIcon}>✕</span>
                            <span>
                              <b>{strings.incorrect}</b>
                              <small>{strings.swipeLeft}</small>
                            </span>
                          </button>
                          <button className={`${styles.btn} ${styles.btnYes}`} onClick={() => choose(true)}>
                            <span className={styles.choiceIcon}>✓</span>
                            <span>
                              <b>{strings.correct}</b>
                              <small>{strings.swipeRight}</small>
                            </span>
                          </button>
                        </div>
                      )}
                      <div className={styles.hint}>{isDiagnosis ? strings.chooseInterpretation : strings.dragOrButtons}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {done && (
              <div className={styles.done}>
                <h2>{strings.roundDone}</h2>
                <div className={styles.scorefinal}>{sessionCases.length ? Math.round((hits / sessionCases.length) * 100) : 0}%</div>
                <p>{strings.resultCorrectSummary(hits, sessionCases.length)}</p>
                <button className={styles.restart} onClick={() => startSession(settings.level, settings.lang)}>
                  {strings.playAgain}
                </button>
              </div>
            )}
          </main>

          <aside className={styles.sidebar}>
            <h2>{strings.progress}</h2>
            <div className={styles.progressOuter}>
              <div
                className={styles.progressInner}
                style={{ width: `${sessionCases.length ? (index / sessionCases.length) * 100 : 0}%` }}
              />
            </div>
            <div className={styles.scorebig}>
              {scorePct}
              <span style={{ fontSize: 24 }}>%</span>
            </div>
            <div className={styles.small}>{strings.accuracyRound}</div>

            <h2 className={styles.criteriaTitle}>{strings.criteria}</h2>
            <div className={styles.rule}>
              <b>SIBO (H₂)</b>
              <span>{strings.siboRule}</span>
            </div>
            <div className={styles.rule}>
              <b>IMO (CH₄)</b>
              <span>{strings.imoRule}</span>
            </div>
            <div className={styles.rule}>
              <b>{strings.intolerances}</b>
              <span>{strings.intoleranceRule}</span>
            </div>
            <div className={styles.rule}>
              <b>{strings.quality}</b>
              <span>{strings.qualityRule}</span>
            </div>
            <div className={styles.sourceNote}>{strings.disclaimer}</div>
          </aside>
        </div>
      )}

      {view === "performance" && (
        <section className={styles.panel}>
          <div className={styles.dashboardGrid}>
            <div className={styles.dashcard}>
              <h3>{strings.masteryMap}</h3>
              {Object.entries(progress.conceptStats).length === 0 ? (
                <div className={styles.skillrow}>
                  <div className={styles.skilltop}>
                    <span>{strings.noConceptYet}</span>
                    <b>—</b>
                  </div>
                </div>
              ) : (
                Object.entries(progress.conceptStats).map(([key, x]) => {
                  const pct = x.n ? Math.round((x.ok / x.n) * 100) : 0;
                  return (
                    <div className={styles.skillrow} key={key}>
                      <div className={styles.skilltop}>
                        <span>{conceptLabel(key, settings.lang)}</span>
                        <b>{x.n ? `${pct}%` : "—"}</b>
                      </div>
                      <div className={styles.skillbar}>
                        <i className={styles.skillbarFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.dashcard}>
              <h3>{strings.highConfidenceErrors}</h3>
              {Object.entries(progress.confidenceErrors).length === 0 ? (
                <p>{strings.noConfidenceErrors}</p>
              ) : (
                Object.entries(progress.confidenceErrors)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, n]) => (
                    <div className={styles.priority} key={key} style={{ marginBottom: 8 }}>
                      <b>{conceptLabel(key, settings.lang)}</b>
                      <br />
                      {strings.confidenceErrorsCount(n)}
                    </div>
                  ))
              )}
            </div>

            <div className={styles.dashcard}>
              <h3>{strings.achievements}</h3>
              <div className={styles.badgegrid}>
                {[
                  { label: strings.badgeFirstSteps, unlocked: progress.totalAnswered >= 1 },
                  { label: strings.badgeOnPace, unlocked: progress.bestStreak >= 5 },
                  { label: strings.badge100Cases, unlocked: progress.totalAnswered >= 100 },
                  { label: strings.badgeReviewer, unlocked: progress.errorCaseIds.length === 0 && progress.totalAnswered >= 10 },
                ].map((b) => (
                  <div className={`${styles.badge} ${b.unlocked ? styles.badgeUnlocked : ""}`} key={b.label}>
                    {b.unlocked ? "✓ " : ""}
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.dashcard}>
              <h3>{strings.summary}</h3>
              <div className={styles.scorebig}>
                {progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0}%
              </div>
              <p>{strings.trainingSummaryText(progress.totalAnswered, progress.errorCaseIds.length)}</p>
            </div>

            <div className={styles.dashcard}>
              <h3>{strings.bestStreak}</h3>
              <div className={styles.scorebig}>{progress.bestStreak}</div>
              <div>{strings.streakMessage}</div>
            </div>
          </div>
        </section>
      )}

      {view === "review" && (
        <section className={styles.panel}>
          <div className={styles.reviewbox}>
            <h2>{strings.adaptiveReview}</h2>
            <p>
              {progress.errorCaseIds.length > 0
                ? strings.reviewQueueText(progress.errorCaseIds.length)
                : strings.reviewQueueEmpty}
            </p>
            <button className={styles.reviewbtn} disabled={progress.errorCaseIds.length === 0} onClick={startReview}>
              {strings.trainPriority}
            </button>
          </div>
        </section>
      )}

      {view === "library" && (
        <section className={styles.panel}>
          <div className={styles.libraryGrid}>
            {libraryFor(settings.lang).map((topic, n) => (
              <article className={`${styles.topic} ${styles.clinicalTopic}`} key={topic.t}>
                <div className={styles.tag}>
                  {strings.guideLabel} · {String(n + 1).padStart(2, "0")}
                </div>
                <h3>{topic.t}</h3>
                <h4>{topic.sub}</h4>
                <p className={styles.libraryLead}>{topic.lead}</p>
                <ol className={styles.librarySteps}>
                  {topic.steps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
                <blockquote>{topic.quote}</blockquote>
                <div className={styles.clinicalTip}>
                  <b>{strings.howToIdentify}</b>
                  <span>{topic.tip}</span>
                </div>
                <div className={styles.sourceLabel}>{strings.sourceLabel}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === "settings" && (
        <section className={`${styles.panel} ${styles.settingsView}`}>
          <div className={styles.settingsCard}>
            <div className={styles.settingsHeading}>
              <span className={styles.eyebrow}>{strings.trainingPreferences}</span>
              <h2>{strings.settings}</h2>
              <p>{strings.settingsIntro}</p>
            </div>
            <div className={styles.settingsForm}>
              <label>
                <span>{strings.language}</span>
                <small>{strings.languageHelp}</small>
                <select
                  value={draftSettings.lang}
                  onChange={(e) => setDraftSettings((s) => ({ ...s, lang: e.target.value as GameLang }))}
                >
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                </select>
              </label>
              <label>
                <span>{strings.level}</span>
                <small>{strings.levelHelp}</small>
                <select
                  value={String(draftSettings.level)}
                  onChange={(e) =>
                    setDraftSettings((s) => ({
                      ...s,
                      level: (e.target.value === "progressive" ? "progressive" : Number(e.target.value)) as LevelSetting,
                    }))
                  }
                >
                  <option value="progressive">{strings.progressive}</option>
                  <option value="1">{strings.basic}</option>
                  <option value="2">{strings.intermediate}</option>
                  <option value="3">{strings.advanced}</option>
                  <option value="4">{strings.expert}</option>
                </select>
              </label>
              <label>
                <span>{strings.answerMode}</span>
                <small>{strings.answerModeHelp}</small>
                <select
                  value={draftSettings.mode}
                  onChange={(e) => setDraftSettings((s) => ({ ...s, mode: e.target.value as AnswerMode }))}
                >
                  <option value="statement">{strings.correctIncorrect}</option>
                  <option value="diagnosis">{strings.giveDiagnosis}</option>
                  <option value="validity">{strings.technicalValidity}</option>
                </select>
              </label>
              <label>
                <span>{strings.confidence}</span>
                <small>{strings.confidenceHelp}</small>
                <select
                  value={draftSettings.confidence}
                  onChange={(e) => setDraftSettings((s) => ({ ...s, confidence: e.target.value as ConfidenceLevel }))}
                >
                  <option value="baixa">{strings.low}</option>
                  <option value="média">{strings.medium}</option>
                  <option value="alta">{strings.high}</option>
                </select>
              </label>
            </div>
            <div className={styles.settingsActions}>
              <button className={styles.primarySettings} onClick={saveSettings}>
                {strings.saveReturn}
              </button>
              <button className={styles.secondarySettings} onClick={startDaily}>
                {strings.dailyChallenge}
              </button>
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <span>{strings.footerBrand}</span>
        <span>{strings.footerText}</span>
      </footer>

      {feedback && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={`${styles.resultIcon} ${feedback.ok ? styles.resultIconOk : styles.resultIconErr}`}>
              {feedback.ok ? "✓" : "✕"}
            </div>
            <h3>{feedback.ok ? strings.correctAnswer : strings.incorrectAnswer}</h3>
            <p>
              {settings.confidence === "alta" && !feedback.ok ? strings.highConfidenceMistake : strings.compareDecision}
            </p>
            <div className={styles.mistakeTitle}>{feedback.ok ? strings.confirmationPoint : strings.whereWrong}</div>
            <div className={styles.errorMap}>
              <div className={styles.errorCell}>
                <b>{strings.yourAnswer}</b>
                {feedback.userLabel}
              </div>
              <div className={styles.errorCell}>
                <b>{strings.expected}</b>
                {feedback.expectedLabel}
              </div>
              <div className={styles.errorCell}>
                <b>{strings.concept}</b>
                {conceptLabel(conceptKey(feedback.caseData), settings.lang)}
              </div>
              <div className={styles.errorCell}>
                <b>{strings.confidence}</b>
                {settings.confidence}
              </div>
            </div>
            <div className={styles.feedbackChart}>
              <div className={styles.caption}>{strings.decisivePoint}</div>
              <Chart c={feedback.caseData} feedback />
            </div>
            <div className={styles.why}>{feedback.caseData.why}</div>
            <button className={styles.detailsToggle} onClick={() => setDetailsOpen((v) => !v)}>
              {strings.understandReasoning}
            </button>
            {detailsOpen && <div className={styles.detailsBox}>{feedback.caseData.detail}</div>}
            <button className={styles.continue} onClick={goNext}>
              {strings.nextCase}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
