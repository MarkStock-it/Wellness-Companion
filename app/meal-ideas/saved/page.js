'use client';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
import MealIdeasNav from '@/components/MealIdeasNav';
import useStoredState from '@/components/useStoredState';

export default function SavedRecipes(){
 const[savedIdeas,,ready]=useStoredState('wc-ai-recipe-ideas',[]);
 const detailHref=id=>`/meal-ideas/details?id=${encodeURIComponent(id)}&from=saved`;
 return <div className="px-5 pb-5"><PageHeader title="Meal ideas" backHref="/more"/>
  <MealIdeasNav active="saved" savedCount={savedIdeas.length}/>
  <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Your collection</p><h1 className="mt-1 font-display text-3xl font-bold">Saved recipes</h1></div><span className="shrink-0 text-sm font-bold text-inkSoft">{savedIdeas.length} saved</span></div>
  {!ready?<Card className="mt-5"><div className="flex items-center gap-3"><span className="spinner h-7 w-7 rounded-full border-2 border-teal-light border-t-teal"/><p className="font-bold">Loading saved recipes…</p></div></Card>:savedIdeas.length>0?<div className="mt-5 space-y-4">{savedIdeas.map(recipe=><Card key={recipe.id} className="relative overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md"><Link href={detailHref(recipe.id)} className="absolute inset-0 z-[2]" aria-label={`View ${recipe.title}`}/><div className="flex gap-4 p-4"><span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gold-light text-gold"><Icon name="bowl" size={36}/></span><div className="pointer-events-none relative z-[3] min-w-0 flex-1"><p className="text-sm font-bold text-teal-dark">{recipe.protein||'AI recipe'}</p><h2 className="mt-1 font-display text-xl font-bold">{recipe.title}</h2>{recipe.overview&&<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-inkSoft">{recipe.overview}</p>}</div></div><div className="pointer-events-none relative z-[3] flex flex-wrap gap-2 border-t border-line px-4 py-3">{(recipe.tags||[]).map(tag=><span key={tag} className="rounded-full bg-teal-light px-3 py-1.5 text-xs font-bold text-teal-dark">{tag}</span>)}</div></Card>)}</div>:<Card className="mt-5 py-8 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-light text-gold"><Icon name="bowl" size={32}/></span><h2 className="mt-4 font-display text-xl font-bold">No saved recipes yet</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-inkSoft">Recipes you confirm from the Wellness AI will appear here.</p><Link href="/meal-ideas" className="mt-5 inline-flex min-h-touch items-center rounded-2xl bg-teal px-5 font-bold text-white">Find recipes</Link></Card>}
 </div>;
}
