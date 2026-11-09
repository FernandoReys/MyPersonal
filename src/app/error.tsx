"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: 40 }}>
      <h1>Não foi possível abrir esta tela.</h1>
      <p>Tente novamente. Seus dados salvos permanecem no banco.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
