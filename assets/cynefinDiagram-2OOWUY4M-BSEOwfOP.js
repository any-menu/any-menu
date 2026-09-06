import{c as $t}from"./chunk-JQRUD6KW-Cv0boemF.js";import{l as ut}from"./cynefin-OW5HDTMX-6OCTWOGG-bxOH7wEV.js";import{r as gt,o as bt,s as wt,g as Ct,i as Dt,t as kt,m as o,p as G,a3 as Bt,Z as At,Q as Tt,L as q,K as U,w as St,a8 as rt}from"./mermaid.esm.min-ZEJ9hRKt.js";import"./app-CnH3ALE1.js";var it=o(()=>({domains:new Map,transitions:[]}),"createDefaultData"),Q=it(),vt=o(()=>Q.domains,"getDomains"),Lt=o(()=>Q.transitions,"getTransitions"),zt=o(t=>{if(t)for(let e of t){let a=e.domain,n=(e.items??[]).map(s=>({label:s.label}));Q.domains.set(a,{name:a,items:n})}},"setDomains"),Mt=o(t=>{t&&(Q.transitions=t.filter(e=>e.from===e.to?(G.warn(`Cynefin: self-loop transition on domain "${e.from}" is not meaningful and will be skipped.`),!1):!0).map(e=>({from:e.from,to:e.to,label:e.label||void 0})))},"setTransitions"),Ft=o(()=>q({...St.cynefin,...U().cynefin}),"getConfig"),It=o(()=>{Tt(),Q=it()},"clear"),j={getDomains:vt,getTransitions:Lt,setDomains:zt,setTransitions:Mt,getConfig:Ft,clear:It,setAccTitle:kt,getAccTitle:Dt,setDiagramTitle:Ct,getDiagramTitle:wt,getAccDescription:bt,setAccDescription:gt},Pt=o(t=>{$t(t,j),j.setDomains(t.domains),j.setTransitions(t.transitions)},"populate"),Rt={parse:o(async t=>{let e=await ut("cynefin",t);G.debug(e),Pt(e)},"parse")};function E(t){let e=t+1831565813|0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}o(E,"seededRandom");function ot(t){let e=0;for(let a=0;a<t.length;a++){let n=t.charCodeAt(a);e=(e<<5)-e+n,e|=0}return e}o(ot,"hashString");function lt(t,e){return typeof t=="number"&&Number.isFinite(t)&&t!==0?t:ot(e)}o(lt,"resolveSeed");function st(t,e,a,n){let s=t/2,p=n??t*.015,D=7,P=e/D,d=[];for(let r=0;r<=D;r++){let m=E(a+r*17)*p*2-p;d.push({x:s+m,y:r*P})}let k=`M${d[0].x},${d[0].y}`;for(let r=0;r<d.length-1;r++){let m=d[r],l=d[r+1],f=(m.y+l.y)/2,b=r%2===0?1:-1,h=p*1.5*b*E(a+r*31+7),R=m.x+h,W=f,V=l.x-h;k+=` C${R},${W} ${V},${f} ${l.x},${l.y}`}return k}o(st,"generateFoldPath");function ct(t,e,a,n){let s=e/2,p=n??e*.015,D=7,P=t/D,d=[];for(let r=0;r<=D;r++){let m=E(a+r*23)*p*2-p;d.push({x:r*P,y:s+m})}let k=`M${d[0].x},${d[0].y}`;for(let r=0;r<d.length-1;r++){let m=d[r],l=d[r+1],f=(m.x+l.x)/2,b=r%2===0?1:-1,h=p*1.5*b*E(a+r*37+11),R=f,W=m.y+h,V=f,H=l.y-h;k+=` C${R},${W} ${V},${H} ${l.x},${l.y}`}return k}o(ct,"generateHorizontalBoundary");function dt(t,e){let a=t/2,n=e*.5,s=e,p=t*.03;return[`M${a},${n}`,`C${a+p},${n+(s-n)*.2}`,`${a-p*1.5},${n+(s-n)*.55}`,`${a+p*.5},${n+(s-n)*.75}`,`C${a-p},${n+(s-n)*.85}`,`${a+p*.3},${n+(s-n)*.95}`,`${a},${s}`].join(" ")}o(dt,"generateCliffPath");function ft(t,e,a,n){return[`M${t-a},${e}`,`A${a},${n} 0 1,1 ${t+a},${e}`,`A${a},${n} 0 1,1 ${t-a},${e}`,"Z"].join(" ")}o(ft,"generateConfusionPath");var nt={complex:{model:"Probe → Sense → Respond",practice:"Emergent Practices"},complicated:{model:"Sense → Analyse → Respond",practice:"Good Practices"},clear:{model:"Sense → Categorise → Respond",practice:"Best Practices"},chaotic:{model:"Act → Sense → Respond",practice:"Novel Practices"},confusion:{model:"",practice:"Disorder"}},Wt=o((t,e)=>{let a=t/2,n=e/2;return{complex:{cx:a/2,cy:n/2,x:0,y:0,w:a,h:n},complicated:{cx:a+a/2,cy:n/2,x:a,y:0,w:a,h:n},chaotic:{cx:a/2,cy:n+n/2,x:0,y:n,w:a,h:n},clear:{cx:a+a/2,cy:n+n/2,x:a,y:n,w:a,h:n},confusion:{cx:a,cy:n,x:a*.7,y:n*.7,w:a*.6,h:n*.6}}},"getDomainLayouts"),Vt=o(()=>{let t=rt(),e=U();return q(t,e.themeVariables).cynefin},"getCynefinDomainColors"),X=3,Ht=o((t,e,a,n)=>{let s=n.db,p=s.getDomains(),D=s.getTransitions(),P=s.getDiagramTitle(),d=s.getAccTitle(),k=s.getAccDescription(),r=s.getConfig(),m=Vt();G.debug("Rendering Cynefin diagram");let l=r.width,f=r.height,b=r.padding,h=r.showDomainDescriptions,R=r.boundaryAmplitude,W=l+b*2,V=f+b*2,H={complex:m.complexBg,complicated:m.complicatedBg,clear:m.clearBg,chaotic:m.chaoticBg,confusion:m.confusionBg},B=Bt(e);At(B,V,W,r.useMaxWidth??!0),B.attr("viewBox",`0 0 ${W} ${V}`),d&&B.append("title").text(d),k&&B.append("desc").text(k);let A=B.append("g").attr("transform",`translate(${b}, ${b})`),N=Wt(l,f),Y=lt(r.seed,e),pt=A.append("g").attr("class","cynefin-backgrounds"),K=["complex","complicated","chaotic","clear"];for(let c of K){let i=N[c];pt.append("rect").attr("class","cynefinDomain").attr("x",i.x).attr("y",i.y).attr("width",i.w).attr("height",i.h).attr("fill",H[c]).attr("fill-opacity",.4).attr("stroke","none")}let O=A.append("g").attr("class","cynefin-boundaries");O.append("path").attr("class","cynefinBoundary").attr("d",st(l,f,Y,R)).attr("fill","none"),O.append("path").attr("class","cynefinBoundary").attr("d",ct(l,f,Y+100,R)).attr("fill","none"),O.append("path").attr("class","cynefinCliff").attr("d",dt(l,f)).attr("fill","none");let mt=l*.15,yt=f*.15;A.append("path").attr("class","cynefinConfusion").attr("d",ft(l/2,f/2,mt,yt)).attr("fill",H.confusion).attr("fill-opacity",.5);let J=A.append("g").attr("class","cynefin-labels");for(let c of K){let i=N[c];J.append("text").attr("class","cynefinDomainLabel").attr("x",i.cx).attr("y",h?i.cy-30:i.cy).attr("text-anchor","middle").attr("dominant-baseline","middle").text(c.charAt(0).toUpperCase()+c.slice(1))}if(J.append("text").attr("class","cynefinDomainLabel").attr("x",l/2).attr("y",h?f/2-10:f/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text("Confusion"),h){let c=A.append("g").attr("class","cynefin-subtitles");for(let i of K){let x=N[i],y=nt[i];c.append("text").attr("class","cynefinSubtitle").attr("x",x.cx).attr("y",x.cy-10).attr("text-anchor","middle").attr("dominant-baseline","middle").text(y.model),c.append("text").attr("class","cynefinSubtitle").attr("x",x.cx).attr("y",x.cy+5).attr("text-anchor","middle").attr("dominant-baseline","middle").text(y.practice)}c.append("text").attr("class","cynefinSubtitle").attr("x",l/2).attr("y",f/2+8).attr("text-anchor","middle").attr("dominant-baseline","middle").text(nt.confusion.practice)}let _=A.append("g").attr("class","cynefin-items"),T=26,tt=10,xt=["complex","complicated","chaotic","clear","confusion"];for(let c of xt){let i=p.get(c);if(!i||i.items.length===0)continue;let x=N[c],y=c==="confusion",z=i.items,M=0;y&&i.items.length>X&&(M=i.items.length-X,z=i.items.slice(0,X));let S;if(y){let u=h?22:14;S=x.cy+u}else S=x.cy+(h?25:15);if([...z].forEach((u,v)=>{let w=S+v*(T+4),L=_.append("g"),F=L.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",T/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(u.label),g=u.label.length*7,$=F.node();if($&&typeof $.getBBox=="function"){let Z=$.getBBox();Z.width>0&&(g=Z.width)}let C=g+tt*2,I=x.cx-C/2;L.attr("transform",`translate(${I}, ${w})`),L.insert("rect","text").attr("class","cynefinItem").attr("x",0).attr("y",0).attr("width",C).attr("height",T).attr("rx",4).attr("ry",4).attr("fill",H[c]).attr("fill-opacity",.95),F.attr("x",C/2).attr("y",T/2)}),M>0){let u=S+z.length*(T+4),v=`+${M} more`,w=_.append("g"),L=w.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",T/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(v),F=v.length*7,g=L.node();if(g&&typeof g.getBBox=="function"){let I=g.getBBox();I.width>0&&(F=I.width)}let $=F+tt*2,C=x.cx-$/2;w.attr("transform",`translate(${C}, ${u})`),w.insert("rect","text").attr("class","cynefinItemOverflow").attr("x",0).attr("y",0).attr("width",$).attr("height",T).attr("rx",4).attr("ry",4).attr("fill",H[c]).attr("fill-opacity",.6),L.attr("x",$/2).attr("y",T/2)}}if(D.length>0){let c=B.select("defs").empty()?B.append("defs"):B.select("defs"),i=`cynefin-arrow-${e}`;c.append("marker").attr("id",i).attr("viewBox","0 0 10 10").attr("refX",9).attr("refY",5).attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto-start-reverse").append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("class","cynefinArrowHead");let x=A.append("g").attr("class","cynefin-arrows");D.forEach(y=>{let z=N[y.from],M=N[y.to];if(!z||!M)return;if(y.from===y.to){G.warn(`Cynefin renderer: skipping self-loop on domain "${y.from}"`);return}let S=z.cx,u=z.cy,v=M.cx,w=M.cy,L=(S+v)/2,F=(u+w)/2,g=v-S,$=w-u,C=Math.sqrt(g*g+$*$),I=C*.15,Z=-$/C,ht=g/C,et=L+Z*I,at=F+ht*I;x.append("path").attr("class","cynefinArrowLine").attr("d",`M${S},${u} Q${et},${at} ${v},${w}`).attr("fill","none").attr("marker-end",`url(#${i})`),y.label&&x.append("text").attr("class","cynefinArrowLabel").attr("x",et).attr("y",at-6).attr("text-anchor","middle").attr("dominant-baseline","auto").text(y.label)})}P&&A.append("text").attr("class","cynefinTitle").attr("x",l/2).attr("y",-b/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text(P)},"draw"),Nt={draw:Ht},Et=o(()=>{let t=rt(),e=U();return q(t,e.themeVariables).cynefin},"getCynefinTheme"),Qt=o(()=>{let t=Et();return`
	.cynefinDomain {
		stroke: none;
	}
	.cynefinDomainLabel {
		font-size: ${t.domainFontSize}px;
		font-weight: bold;
		fill: ${t.labelColor};
	}
	.cynefinSubtitle {
		font-size: ${t.itemFontSize-1}px;
		fill: ${t.textColor};
		font-style: italic;
	}
	.cynefinItem {
		fill-opacity: 0.95;
		stroke: ${t.boundaryColor};
		stroke-width: 1;
	}
	.cynefinItemText {
		font-size: ${t.itemFontSize}px;
		fill: ${t.textColor};
	}
	.cynefinItemOverflow {
		fill-opacity: 0.6;
		stroke: ${t.boundaryColor};
		stroke-width: 1;
		stroke-dasharray: 3 2;
	}
	.cynefinBoundary {
		stroke: ${t.boundaryColor};
		stroke-width: ${t.boundaryWidth};
		stroke-dasharray: 6 3;
	}
	.cynefinCliff {
		stroke: ${t.cliffColor};
		stroke-width: ${t.cliffWidth};
	}
	.cynefinConfusion {
		stroke: ${t.boundaryColor};
		stroke-width: 1.5;
		stroke-dasharray: 4 2;
	}
	.cynefinArrowLine {
		stroke: ${t.arrowColor};
		stroke-width: ${t.arrowWidth};
		fill: none;
	}
	.cynefinArrowHead {
		fill: ${t.arrowColor};
		stroke: none;
	}
	.cynefinArrowLabel {
		font-size: ${t.itemFontSize-1}px;
		fill: ${t.textColor};
	}
	.cynefinTitle {
		font-size: ${t.domainFontSize+2}px;
		font-weight: bold;
		fill: ${t.labelColor};
	}
	`},"styles"),Zt=Qt,Xt={parser:Rt,db:j,renderer:Nt,styles:Zt};export{Xt as diagram};
