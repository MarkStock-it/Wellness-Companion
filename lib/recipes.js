const base=`https://www.themealdb.com/api/json/v1/${process.env.NEXT_PUBLIC_MEALDB_KEY||'1'}`;
const MAX_SEARCH_RESULTS=48;
function text(value){return String(value||'').trim()}
export function normalizeRecipe(meal,intentTags=[]){
 const ingredients=[];for(let index=1;index<=20;index+=1){const name=text(meal[`strIngredient${index}`]),measure=text(meal[`strMeasure${index}`]);if(name)ingredients.push({name,measure})}
 const raw=text(meal.strInstructions);let instructions=raw.split(/\r?\n/).map(item=>item.replace(/^\s*\d+[.)-]?\s*/,'').trim()).filter(Boolean);if(instructions.length<2)instructions=raw.split(/(?<=[.!?])\s+(?=[A-Z])/).map(item=>item.trim()).filter(Boolean);
 const tags=[...new Set([meal.strCategory,...intentTags].map(text).filter(Boolean))].slice(0,5);
 return{id:String(meal.idMeal),title:text(meal.strMeal),image:text(meal.strMealThumb),category:text(meal.strCategory),area:text(meal.strArea),ingredients,instructions,sourceUrl:text(meal.strSource)||text(meal.strYoutube),videoUrl:text(meal.strYoutube),tags,prepTime:null,cookTime:null,totalTime:null,servings:null,calories:null};
}
async function json(url){const response=await fetch(url);if(!response.ok)throw new Error('The recipe service is unavailable right now.');return response.json()}
async function lookup(id){const data=await json(`${base}/lookup.php?i=${encodeURIComponent(id)}`);return data.meals?.[0]||null}
export async function getRecipe(id){const meal=await lookup(id);return meal?normalizeRecipe(meal):null}
export async function searchRecipes(terms,intentTags=[]){
 const clean=[...new Set(terms.map(text).filter(Boolean))].slice(0,6);const found=new Map();
 const ingredients=[...new Set(clean.flatMap(term=>{
  const useful=term.toLowerCase().replace(/\b(recipes?|meals?|easy|healthy|breakfast|lunch|dinner)\b/g,' ').trim();
  return[useful,...useful.split(/\s+/)].filter(part=>part.length>2).map(part=>part.replace(/\s+/g,'_'));
 }))].slice(0,12);
 const searches=await Promise.all([
  ...clean.map(term=>json(`${base}/search.php?s=${encodeURIComponent(term)}`).catch(()=>({meals:null}))),
  ...ingredients.map(ingredient=>json(`${base}/filter.php?i=${encodeURIComponent(ingredient)}`).catch(()=>({meals:null}))),
 ]);
 searches.forEach(result=>(result.meals||[]).forEach(meal=>found.set(meal.idMeal,meal)));
 const selected=[...found.values()].slice(0,MAX_SEARCH_RESULTS);const complete=[];
 for(let index=0;index<selected.length;index+=8){
  const batch=await Promise.all(selected.slice(index,index+8).map(meal=>meal.strInstructions?meal:lookup(meal.idMeal).catch(()=>null)));
  complete.push(...batch.filter(Boolean));
 }
 return complete.map(meal=>normalizeRecipe(meal,intentTags));
}
export function fallbackTerms(query){
 const ignored=new Set(['recipe','recipes','meal','meals','easy','healthy','high','low','minute','minutes','for','after','the','and','with']);const words=String(query).toLowerCase().match(/[a-z]+/g)||[];const useful=words.filter(word=>!ignored.has(word));const concepts=[];
 if(words.includes('protein'))concepts.push('chicken','egg','salmon','lentil');
 if(words.includes('breakfast'))concepts.push('egg','oats','pancake');
 if(words.includes('vegetarian')||words.includes('vegan'))concepts.push('lentil','chickpea','beans');
 if(words.includes('quick')||words.includes('minute')||words.includes('minutes'))concepts.push('pasta','egg');
 return[useful.join(' '),...useful,...concepts].filter(Boolean).filter((term,index,list)=>list.indexOf(term)===index).slice(0,6);
}
export function cacheRecipe(recipe){try{sessionStorage.setItem(`wc-recipe-${recipe.id}`,JSON.stringify(recipe))}catch{}}
export function cachedRecipe(id){try{const session=JSON.parse(sessionStorage.getItem(`wc-recipe-${id}`)||'null');if(session)return session;const saved=JSON.parse(localStorage.getItem('wc-ai-recipe-ideas')||'[]');return saved.find(recipe=>recipe.id===id)||null}catch{return null}}
