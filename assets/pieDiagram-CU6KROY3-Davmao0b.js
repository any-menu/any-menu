import{c as Q}from"./chunk-JQRUD6KW-HgWYWp-f.js";import{d as U}from"./wardley-L42UT6IY-5TKZOOLJ-BaBjpvT1.js";import{a7 as X,aB as Z,aW as _,am as ee,aI as te,ar as ae,aC as l,aP as $,aT as ie,q as le,af as re,ae as se,az as W,H as oe,at as ne,aN as de,j as pe,ak as ce}from"./mermaid.esm.min-CuwiNrcA.js";import"./app-BnYQ9HSC.js";var ue=ce.pie,v={sections:new Map,showData:!1},h=v.sections,y=v.showData,ge=structuredClone(ue),he=l(()=>structuredClone(ge),"getConfig"),me=l(()=>{h=new Map,y=v.showData,de()},"clear"),fe=l(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);h.has(e)||(h.set(e,a),$.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),xe=l(()=>h,"getSections"),we=l(e=>{y=e},"setShowData"),Se=l(()=>y,"getShowData"),P={getConfig:he,clear:me,setDiagramTitle:ae,getDiagramTitle:te,setAccTitle:ee,getAccTitle:_,setAccDescription:Z,getAccDescription:X,addSection:fe,getSections:xe,setShowData:we,getShowData:Se},$e=l((e,a)=>{Q(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),ve={parse:l(async e=>{let a=await U("pie",e);$.debug(a),$e(a,P)},"parse")},ye=l(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),Te=ye,Ce=l(e=>{let a=[...e.values()].reduce((r,s)=>r+s,0),T=[...e.entries()].map(([r,s])=>({label:r,value:s})).filter(r=>r.value/a*100>=1);return pe().value(r=>r.value).sort(null)(T)},"createPieArcs"),De=l((e,a,T,r)=>{$.debug(`rendering pie chart
`+e);let s=r.db,C=ie(),D=le(s.getConfig(),C.pie),b=40,o=18,c=4,d=450,p=d,m=re(a),n=m.append("g");n.attr("transform","translate("+p/2+","+d/2+")");let{themeVariables:i}=C,[k]=se(i.pieOuterStrokeWidth);k??=2;let A=D.textPosition,u=Math.min(p,d)/2-b,E=W().innerRadius(0).outerRadius(u),L=W().innerRadius(u*A).outerRadius(u*A);n.append("circle").attr("cx",0).attr("cy",0).attr("r",u+k/2).attr("class","pieOuterCircle");let g=s.getSections(),j=Ce(g),q=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12],f=0;g.forEach(t=>{f+=t});let z=j.filter(t=>(t.data.value/f*100).toFixed(0)!=="0"),x=oe(q).domain([...g.keys()]);n.selectAll("mySlices").data(z).enter().append("path").attr("d",E).attr("fill",t=>x(t.data.label)).attr("class","pieCircle"),n.selectAll("mySlices").data(z).enter().append("text").text(t=>(t.data.value/f*100).toFixed(0)+"%").attr("transform",t=>"translate("+L.centroid(t)+")").style("text-anchor","middle").attr("class","slice");let H=n.append("text").text(s.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText"),M=[...g.entries()].map(([t,S])=>({label:t,value:S})),w=n.selectAll(".legend").data(M).enter().append("g").attr("class","legend").attr("transform",(t,S)=>{let B=o+c,Y=B*M.length/2,J=12*o,K=S*B-Y;return"translate("+J+","+K+")"});w.append("rect").attr("width",o).attr("height",o).style("fill",t=>x(t.label)).style("stroke",t=>x(t.label)),w.append("text").attr("x",o+c).attr("y",o-c).text(t=>s.getShowData()?`${t.label} [${t.value}]`:t.label);let N=Math.max(...w.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),G=p+b+o+c+N,O=H.node()?.getBoundingClientRect().width??0,I=p/2-O/2,V=p/2+O/2,R=Math.min(0,I),F=Math.max(G,V)-R;m.attr("viewBox",`${R} 0 ${F} ${d}`),ne(m,d,F,D.useMaxWidth)},"draw"),be={draw:De},Oe={parser:ve,db:P,renderer:be,styles:Te};export{Oe as diagram};
