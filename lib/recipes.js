const base=`https://www.themealdb.com/api/json/v1/${process.env.NEXT_PUBLIC_MEALDB_KEY||'1'}`;
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
 const clean=[...new Set(terms.map(text).filter(Boolean))].slice(0,4);const found=new Map();
 for(const term of clean){const byName=await json(`${base}/search.php?s=${encodeURIComponent(term)}`).catch(()=>({meals:null}));(byName.meals||[]).forEach(meal=>found.set(meal.idMeal,meal));if(found.size<8){const ingredient=term.toLowerCase().replace(/\b(recipes?|meals?|easy|healthy|breakfast|lunch|dinner)\b/g,'').trim().replace(/\s+/g,'_');if(ingredient){const filtered=await json(`${base}/filter.php?i=${encodeURIComponent(ingredient)}`).catch(()=>({meals:null}));(filtered.meals||[]).slice(0,5).forEach(meal=>found.set(meal.idMeal,meal))}}}
 const selected=[...found.values()].slice(0,8);const complete=await Promise.all(selected.map(meal=>meal.strInstructions?meal:lookup(meal.idMeal)));return complete.filter(Boolean).map(meal=>normalizeRecipe(meal,intentTags));
}
export function fallbackTerms(query){const ignored=new Set(['recipe','recipes','meal','meals','easy','healthy','high','low','minute','minutes','for','after','the','and','with']);const words=String(query).toLowerCase().match(/[a-z]+/g)||[];const useful=words.filter(word=>!ignored.has(word));return[useful.join(' '),...useful].filter(Boolean).slice(0,4)}
export function cacheRecipe(recipe){try{sessionStorage.setItem(`wc-recipe-${recipe.id}`,JSON.stringify(recipe))}catch{}}
export function cachedRecipe(id){try{const session=JSON.parse(sessionStorage.getItem(`wc-recipe-${id}`)||'null');if(session)return session;const saved=JSON.parse(localStorage.getItem('wc-ai-recipe-ideas')||'[]');return saved.find(recipe=>recipe.id===id)||null}catch{return null}}
