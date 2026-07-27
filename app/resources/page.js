import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Icon from '@/components/Icon';
const support=[
  ['Call your care team','For new or worsening symptoms','tel:'],
  ['Find a registered dietitian','Search a professional directory','https://www.eatright.org/find-a-nutrition-expert'],
  ['Cancer support information','Trusted guidance from the WHO','https://www.who.int/health-topics/cancer'],
];
export default function Resources(){return <div className="px-5 pb-5"><PageHeader title="Support resources" backHref="/more"/>
 <Card className="mt-4 border-0 bg-teal text-white"><Icon name="heart" size={30}/><h2 className="mt-4 font-display text-2xl font-bold">You are not alone</h2><p className="mt-2 text-base leading-relaxed text-white/80">Your care team is the best source for advice specific to you.</p></Card>
 <h2 className="mb-3 mt-7 font-display text-xl font-bold">Helpful connections</h2><div className="space-y-3">{support.map(([title,detail,href],i)=><a key={title} href={href} target={href.startsWith('http')?'_blank':undefined} rel="noreferrer"><Card className="mb-3 flex items-center gap-4 p-4"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${i?'bg-gold-light text-gold':'bg-teal-light text-teal'}`}><Icon name={i?'info':'phone'}/></span><span className="flex-1"><strong className="block">{title}</strong><span className="block text-sm text-inkSoft">{detail}</span></span><Icon name="chevron" className="text-inkSoft"/></Card></a>)}</div>
 <Card className="mt-5 bg-clay-light/60"><div className="flex gap-3"><Icon name="info" className="shrink-0 text-clay"/><div><h2 className="font-bold">When to get urgent help</h2><p className="mt-1 text-sm leading-relaxed text-inkSoft">If you have severe trouble breathing, chest pain, confusion, or another emergency, contact your local emergency service immediately.</p></div></div></Card>
 </div>}
