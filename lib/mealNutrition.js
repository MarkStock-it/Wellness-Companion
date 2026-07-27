export function mealText(value) {
  return typeof value === 'string' ? value : value?.detail || '';
}

export function estimateFromText(text) {
  const source=String(text||'').replace(/,/g,'');
  function amount(kind){
    const suffix=kind==='calories'?'(?:kcal|calories?)':'(?:g|grams?)';
    const label=kind==='calories'?'(?:estimated\\s*)?(?:calories?|energy)':'(?:estimated\\s*)?protein';
    const range=source.match(new RegExp(`${label}[^\\d]{0,20}(\\d+(?:\\.\\d+)?)\\s*(?:-|–|to)\\s*(\\d+(?:\\.\\d+)?)\\s*${suffix}`,'i'));
    const single=source.match(new RegExp(`${label}[^\\d]{0,20}(\\d+(?:\\.\\d+)?)\\s*${suffix}`,'i'));
    return range?Math.round((Number(range[1])+Number(range[2]))/2):single?Math.round(Number(single[1])):null;
  }
  return {calories:amount('calories'),protein:amount('protein')};
}
