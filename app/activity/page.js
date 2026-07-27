'use client';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import BigButton from '@/components/BigButton';
import Icon from '@/components/Icon';
import useStoredState from '@/components/useStoredState';

export default function ActivityPage() {
  const [data, setData] = useStoredState('wc-activity', {});
  return <div className="px-5 pb-5"><PageHeader title="Activity" backHref="/" />
    <Card className="mt-4 overflow-hidden border-0 bg-teal p-6 text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon name="activity" size={28}/></div>
      <p className="mt-5 text-sm font-bold uppercase tracking-widest text-teal-light">Today&apos;s movement</p>
      <h2 className="mt-1 font-display text-2xl font-bold">Gentle stretching</h2>
      <p className="mt-2 text-base text-white/80">10 minutes · Seated or standing</p>
      <div className="mt-5"><BigButton variant={data.done ? 'secondary' : 'outline'} onClick={() => setData({...data, done: !data.done})}>{data.done ? <><Icon name="check"/> Completed today</> : 'Mark as complete'}</BigButton></div>
    </Card>
    <Card className="mt-4">
      <h2 className="font-display text-xl font-bold">How is your energy?</h2><p className="mt-1 text-sm text-inkSoft">Choose the answer that feels closest.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">{['Low','Okay','Good'].map((option, i) => <button key={option} onClick={() => setData({...data, energy: option})} aria-pressed={data.energy === option} className={`min-h-[76px] rounded-2xl border p-2 text-sm font-bold ${data.energy === option ? 'border-teal bg-teal text-white' : 'border-line bg-canvas'}`}><span className="mx-auto mb-2 block h-1.5 rounded-full bg-current" style={{width: `${20+i*10}px`}}/>{option}</button>)}</div>
      {data.energy && <p className="mt-4 flex items-center gap-2 rounded-xl bg-teal-light p-3 text-sm font-medium text-teal-dark"><Icon name="check" size={18}/> Energy saved for today</p>}
    </Card>
    <Card className="mt-4 flex gap-3 bg-gold-light/60"><Icon name="info" className="shrink-0 text-gold"/><p className="text-sm leading-relaxed text-inkSoft">Move gently and stop if you feel pain, dizziness, or shortness of breath.</p></Card>
  </div>;
}
