import{c as E}from"./chunk-JQRUD6KW-DNssddj8.js";import{l as F}from"./cynefin-OW5HDTMX-6OCTWOGG-Dx_YJc3y.js";import{r as z,o as R,s as D,g as P,i as B,t as W,m as c,a3 as G,Q as V,L as w,K as b,w as Z,p as C,a8 as K,Z as Q}from"./mermaid.esm.min-B4Zb8zQW.js";import"./app-DF1T71gO.js";var m={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},y=32,L={axes:[],curves:[],options:m},x=structuredClone(L),_=Z.radar,j=c(()=>w({..._,...b().radar}),"getConfig"),M=c(()=>x.axes,"getAxes"),H=c(()=>x.curves,"getCurves"),U=c(()=>x.options,"getOptions"),q=c(a=>{x.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),J=c(a=>{x.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:N(t.entries)}))},"setCurves"),N=c(a=>{if(a[0].axis==null)return a.map(e=>e.value);let t=M();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{let r=a.find(i=>i.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),X=c(a=>{let t=a.reduce((e,r)=>(e[r.name]=r,e),{});x.options={showLegend:t.showLegend?.value??m.showLegend,ticks:t.ticks?.value??m.ticks,max:t.max?.value??m.max,min:t.min?.value??m.min,graticule:t.graticule?.value??m.graticule},x.options.ticks>y&&(C.warn(`Radar diagram ticks (${x.options.ticks}) exceeds maximum allowed (${y}). Using ${y} instead.`),x.options.ticks=y)},"setOptions"),Y=c(()=>{V(),x=structuredClone(L)},"clear"),f={getAxes:M,getCurves:H,getOptions:U,setAxes:q,setCurves:J,setOptions:X,getConfig:j,clear:Y,setAccTitle:W,getAccTitle:B,setDiagramTitle:P,getDiagramTitle:D,getAccDescription:R,setAccDescription:z},tt=c(a=>{E(a,f);let{axes:t,curves:e,options:r}=a;f.setAxes(t),f.setCurves(e),f.setOptions(r)},"populate"),et={parse:c(async a=>{let t=await F("radar",a);C.debug(t),tt(t)},"parse")},at=c((a,t,e,r)=>{let i=r.db,n=i.getAxes(),o=i.getCurves(),s=i.getOptions(),l=i.getConfig(),d=i.getDiagramTitle(),p=G(t),g=rt(p,l),u=s.max??Math.max(...o.map(v=>Math.max(...v.entries))),h=s.min,$=Math.min(l.width,l.height)/2;it(g,n,$,s.ticks,s.graticule),st(g,n,$,l),k(g,n,o,h,u,s.graticule,l),O(g,o,s.showLegend,l),g.append("text").attr("class","radarTitle").text(d).attr("x",0).attr("y",-l.height/2-l.marginTop)},"draw"),rt=c((a,t)=>{let e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,i={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return Q(a,r,e,t.useMaxWidth??!0),a.attr("viewBox",`0 0 ${e} ${r}`).attr("overflow","visible"),a.append("g").attr("transform",`translate(${i.x}, ${i.y})`)},"drawFrame"),it=c((a,t,e,r,i)=>{if(i==="circle")for(let n=0;n<r;n++){let o=e*(n+1)/r;a.append("circle").attr("r",o).attr("class","radarGraticule")}else if(i==="polygon"){let n=t.length;for(let o=0;o<r;o++){let s=e*(o+1)/r,l=t.map((d,p)=>{let g=2*p*Math.PI/n-Math.PI/2,u=s*Math.cos(g),h=s*Math.sin(g);return`${u},${h}`}).join(" ");a.append("polygon").attr("points",l).attr("class","radarGraticule")}}},"drawGraticule"),st=c((a,t,e,r)=>{let i=t.length;for(let n=0;n<i;n++){let o=t[n].label,s=2*n*Math.PI/i-Math.PI/2,l=Math.cos(s),d=Math.sin(s);a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*l).attr("y2",e*r.axisScaleFactor*d).attr("class","radarAxisLine");let p=l>.01?"start":l<-.01?"end":"middle",g=d>.01?"hanging":d<-.01?"auto":"central",u=4;a.append("text").text(o).attr("x",e*r.axisLabelFactor*l+u*l).attr("y",e*r.axisLabelFactor*d+u*d).attr("text-anchor",p).attr("dominant-baseline",g).attr("class","radarAxisLabel")}},"drawAxes");function k(a,t,e,r,i,n,o){let s=t.length,l=Math.min(o.width,o.height)/2;e.forEach((d,p)=>{if(d.entries.length!==s)return;let g=d.entries.map((u,h)=>{let $=2*Math.PI*h/s-Math.PI/2,v=T(u,r,i,l),S=v*Math.cos($),I=v*Math.sin($);return{x:S,y:I}});n==="circle"?a.append("path").attr("d",A(g,o.curveTension)).attr("class",`radarCurve-${p}`):n==="polygon"&&a.append("polygon").attr("points",g.map(u=>`${u.x},${u.y}`).join(" ")).attr("class",`radarCurve-${p}`)})}c(k,"drawCurves");function T(a,t,e,r){let i=Math.min(Math.max(a,t),e);return r*(i-t)/(e-t)}c(T,"relativeRadius");function A(a,t){let e=a.length,r=`M${a[0].x},${a[0].y}`;for(let i=0;i<e;i++){let n=a[(i-1+e)%e],o=a[i],s=a[(i+1)%e],l=a[(i+2)%e],d={x:o.x+(s.x-n.x)*t,y:o.y+(s.y-n.y)*t},p={x:s.x-(l.x-o.x)*t,y:s.y-(l.y-o.y)*t};r+=` C${d.x},${d.y} ${p.x},${p.y} ${s.x},${s.y}`}return`${r} Z`}c(A,"closedRoundCurve");function O(a,t,e,r){if(!e)return;let i=(r.width/2+r.marginRight)*3/4,n=-(r.height/2+r.marginTop)*3/4,o=20;t.forEach((s,l)=>{let d=a.append("g").attr("transform",`translate(${i}, ${n+l*o})`);d.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${l}`),d.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}c(O,"drawLegend");var lt={draw:at},nt=c((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){let i=a[`cScale${r}`];e+=`
		.radarCurve-${r} {
			color: ${i};
			fill: ${i};
			fill-opacity: ${t.curveOpacity};
			stroke: ${i};
			stroke-width: ${t.curveStrokeWidth};
		}
		.radarLegendBox-${r} {
			fill: ${i};
			fill-opacity: ${t.curveOpacity};
			stroke: ${i};
		}
		`}return e},"genIndexStyles"),ot=c(a=>{let t=K(),e=b(),r=w(t,e.themeVariables),i=w(r.radar,a);return{themeVariables:r,radarOptions:i}},"buildRadarStyleOptions"),ct=c(({radar:a}={})=>{let{themeVariables:t,radarOptions:e}=ot(a);return`
	.radarTitle {
		font-size: ${t.fontSize};
		color: ${t.titleColor};
		dominant-baseline: hanging;
		text-anchor: middle;
	}
	.radarAxisLine {
		stroke: ${e.axisColor};
		stroke-width: ${e.axisStrokeWidth};
	}
	.radarAxisLabel {
		font-size: ${e.axisLabelFontSize}px;
		color: ${e.axisColor};
	}
	.radarGraticule {
		fill: ${e.graticuleColor};
		fill-opacity: ${e.graticuleOpacity};
		stroke: ${e.graticuleColor};
		stroke-width: ${e.graticuleStrokeWidth};
	}
	.radarLegendText {
		text-anchor: start;
		font-size: ${e.legendFontSize}px;
		dominant-baseline: hanging;
	}
	${nt(t,e)}
	`},"styles"),xt={parser:et,db:f,renderer:lt,styles:ct};export{xt as diagram};
