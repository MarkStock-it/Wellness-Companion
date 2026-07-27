'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
import MealIdeasNav from '@/components/MealIdeasNav';
import useStoredState from '@/components/useStoredState';
import { cacheRecipe, fallbackTerms, searchRecipes } from '@/lib/recipes';

const SEARCH_STATE_KEY='wc-meal-ideas-search';

export default function MealIdeas(){
 const[query,setQuery]=useState('');const[recipes,setRecipes]=useState([]);const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[searched,setSearched]=useState(false);const[intent,setIntent]=useState([]);
 const[savedIdeas]=useStoredState('wc-ai-recipe-ideas',[]);
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem(SEARCH_STATE_KEY)||'null');if(!saved)return;setQuery(String(saved.query||''));setRecipes(Array.isArray(saved.recipes)?saved.recipes:[]);setIntent(Array.isArray(saved.intent)?saved.intent:[]);setSearched(Boolean(saved.searched))}catch{}},[]);
 async function search(event){event.preventDefault();const value=query.trim();if(!value||loading)return;setLoading(true);setError('');setSearched(true);try{const terms=fallbackTerms(value),tags=[];
 const results=await searchRecipes(terms,tags);results.forEach(cacheRecipe);setRecipes(results);setIntent(tags);try{sessionStorage.setItem(SEARCH_STATE_KEY,JSON.stringify({query:value,recipes:results,intent:tags,searched:true}))}catch{}}catch(reason){setError(reason.message)}finally{setLoading(false)}}
 const detailHref=id=>`/meal-ideas/details?id=${encodeURIComponent(id)}`;
 return <div className="px-5 pb-5"><PageHeader title="Meal ideas" backHref="/more"/>
  <MealIdeasNav active="search" savedCount={savedIdeas.length}/>
  <form onSubmit={search} className="sticky top-[78px] z-10 -mx-3 rounded-2xl bg-canvas/95 px-3 pb-3 backdrop-blur-xl"><label className="sr-only" htmlFor="recipe-search">Search recipes</label><div className="relative"><Icon name="search" size={20} className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-inkSoft transition-all duration-200 ${query?'translate-x-2 opacity-0':'opacity-100'}`}/><input id="recipe-search" className={`field min-h-[60px] bg-surface pr-16 text-lg transition-[padding] duration-200 ${query?'pl-4':'pl-12'}`} value={query} onChange={event=>setQuery(event.target.value)} placeholder="High protein breakfast" autoComplete="off"/><button type="submit" disabled={!query.trim()||loading} className="icon-button absolute right-2 top-1/2 -translate-y-1/2 bg-teal text-white disabled:opacity-40" aria-label="Search recipes"><Icon name="chevron" size={19}/></button></div></form>
  {!searched&&!loading&&<Card className="mt-3 bg-teal-light"><p className="font-bold text-teal-dark">Search naturally</p><p className="mt-2 text-sm leading-relaxed text-inkSoft">Try “low sodium dinner,” “easy chicken recipes,” “30 minute meals,” or “soft foods after chemotherapy.”</p></Card>}
  {loading&&<Card className="mt-4"><div className="flex items-center gap-3"><span className="spinner h-7 w-7 rounded-full border-2 border-teal-light border-t-teal"/><div><p className="font-bold">Searching a wider recipe collection</p><p className="mt-1 text-sm text-inkSoft">Checking recipe names, ingredients, and full cooking records. This can take a little longer…</p></div></div></Card>}
  {error&&<p role="alert" className="mt-4 rounded-2xl bg-clay-light p-4 text-sm font-bold text-clay">{error}</p>}
  {!loading&&recipes.length>0&&<><div className="mb-3 mt-5 flex items-end justify-between"><div><p className="eyebrow">Search results</p><h2 className="mt-1 font-display text-2xl font-bold">{recipes.length} recipes</h2></div>{intent.length>0&&<span className="text-sm text-inkSoft">Matched to your request</span>}</div><div className="space-y-4">{recipes.map(recipe=><Card key={recipe.id} className="relative overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md"><Link href={detailHref(recipe.id)} className="absolute inset-0 z-[2]" aria-label={`View ${recipe.title}`}/><img src={recipe.image} alt="" className="aspect-[16/9] w-full bg-canvas object-cover" loading="lazy"/><div className="pointer-events-none relative z-[3] p-4"><p className="text-sm font-bold text-teal-dark">{recipe.category}{recipe.area?` · ${recipe.area}`:''}</p><h2 className="mt-1 font-display text-xl font-bold">{recipe.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-inkSoft">{recipe.ingredients.slice(0,5).map(item=>item.name).join(', ')}</p><div className="pointer-events-auto relative z-[4] mt-3 flex flex-wrap gap-2">{recipe.tags.map(tag=><Link key={tag} href={detailHref(recipe.id)} className="min-h-touch inline-flex items-center rounded-full bg-teal-light px-3 text-sm font-bold text-teal-dark" aria-label={`View ${recipe.title}, tagged ${tag}`}>{tag}</Link>)}</div></div></Card>)}</div></>}
  {!loading&&searched&&!error&&!recipes.length&&<Card className="mt-4"><p className="text-center font-bold">No recipes found</p><p className="mt-2 text-center text-sm text-inkSoft">Try a main ingredient or a simpler phrase.</p></Card>}
 </div>
}
