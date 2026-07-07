import { endings, type Ending } from '../gameData';

type Props = {
  ending: Ending;
  endingsFound: Ending[];
  onRestart: () => void;
};

const endingLabels: Record<Ending, string> = {
  bad: 'Плохая',
  good: 'Хорошая',
  secret: 'Секретная',
};

export function EndingScreen({ ending, endingsFound, onRestart }: Props) {
  return (
    <main className="ending-screen">
      <section className="ending-card">
        <p className="eyebrow">Конец</p>
        <h1>{endings[ending].title}</h1>
        <p>{endings[ending].body}</p>
        <div className="ending-list">
          {(['good', 'bad', 'secret'] as Ending[]).map((item) => (
            <span key={item} className={endingsFound.includes(item) ? 'badge unlocked' : 'badge'}>
              {endingsFound.includes(item) ? endingLabels[item] : '???'}
            </span>
          ))}
        </div>
        <button type="button" onClick={onRestart}>Начать заново</button>
      </section>
    </main>
  );
}
