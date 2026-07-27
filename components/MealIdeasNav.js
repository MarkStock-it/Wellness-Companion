import Link from 'next/link';

export default function MealIdeasNav({active,savedCount=0}){
 const item=(key,href,label)=><Link href={href} aria-current={active===key?'page':undefined} className={`flex min-h-touch items-center justify-center rounded-xl px-3 text-sm font-bold transition ${active===key?'bg-teal text-white shadow-sm':'text-inkSoft hover:bg-canvas'}`}>{label}{key==='saved'&&savedCount>0?<span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active===key?'bg-white/20 text-white':'bg-teal-light text-teal-dark'}`}>{savedCount}</span>:null}</Link>;
 return <nav aria-label="Meal ideas sections" className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
  {item('search','/meal-ideas','Find recipes')}
  {item('saved','/meal-ideas/saved','Saved recipes')}
 </nav>;
}
