import { endings, type Ending } from '../gameData';

type Props = {
  ending: Ending;
  onRestart: () => void;
};

export function EndingScreen({ ending, onRestart }: Props) {
  return (
    <main className="ending-screen">
      <section className="ending-card">
        <p className="eyebrow">Конец</p>
        <h1>{endings[ending].title}</h1>
        <p>{endings[ending].body}</p>
        <button type="button" onClick={onRestart}>Начать заново</button>
      </section>
    </main>
  );
}
