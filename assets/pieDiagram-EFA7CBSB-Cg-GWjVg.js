import{c as ee}from"./chunk-JQRUD6KW-DNssddj8.js";import{l as te}from"./cynefin-OW5HDTMX-6OCTWOGG-Dx_YJc3y.js";import{o as ae,r as le,i as re,t as ie,s as se,g as oe,m as o,p as R,a as ne,L as de,a3 as pe,a4 as ce,a5 as j,a6 as he,Z as ge,Q as ue,a7 as me,w as fe}from"./mermaid.esm.min-B4Zb8zQW.js";import"./app-DF1T71gO.js";var we=fe.pie,z={sections:new Map,showData:!1},T=z.sections,H=z.showData,xe=structuredClone(we),$e=o(()=>structuredClone(xe),"getConfig"),ve=o(()=>{T=new Map,H=z.showData,ue()},"clear"),Se=o(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);T.has(e)||(T.set(e,a),R.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),be=o(()=>T,"getSections"),ye=o(e=>{H=e},"setShowData"),Ce=o(()=>H,"getShowData"),G={getConfig:$e,clear:ve,setDiagramTitle:oe,getDiagramTitle:se,setAccTitle:ie,getAccTitle:re,setAccDescription:le,getAccDescription:ae,addSection:Se,getSections:be,setShowData:ye,getShowData:Ce},Te=o((e,a)=>{ee(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),ke={parse:o(async e=>{let a=await te("pie",e);R.debug(a),Te(a,G)},"parse")},De=o(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieCircle.highlighted{
    scale: 1.05;
    opacity: 1;
  }
  .pieCircle.highlightedOnHover:hover{
    transition-duration: 250ms;
    scale: 1.05;
    opacity: 1;
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
`,"getStyles"),Ae=De,Me=o(e=>{let a=[...e.values()].reduce((d,g)=>d+g,0),B=[...e.entries()].map(([d,g])=>({label:d,value:g})).filter(d=>d.value/a*100>=1);return me().value(d=>d.value).sort(null)(B)},"createPieArcs"),Oe=o((e,a,B,d)=>{R.debug(`rendering pie chart
`+e);let g=d.db,F=ne(),u=de(g.getConfig(),F.pie),L=40,r=18,n=4,S=450,x=S,k=pe(a),b=k.append("g");b.attr("transform","translate("+x/2+","+S/2+")");let{themeVariables:i}=F,[P]=ce(i.pieOuterStrokeWidth);P??=2;let I=u.legendPosition,W=u.textPosition,V=u.donutHole>0&&u.donutHole<=.9?u.donutHole:0,m=Math.min(x,S)/2-L,_=j().innerRadius(V*m).outerRadius(m),q=j().innerRadius(m*W).outerRadius(m*W),$=b.append("g");$.append("circle").attr("cx",0).attr("cy",0).attr("r",m+P/2).attr("class","pieOuterCircle");let y=g.getSections(),J=Me(y),K=[i.pie1,i.pie2,i.pie3,i.pie4,i.pie5,i.pie6,i.pie7,i.pie8,i.pie9,i.pie10,i.pie11,i.pie12],D=0;y.forEach(t=>{D+=t});let E=J.filter(t=>(t.data.value/D*100).toFixed(0)!=="0"),A=he(K).domain([...y.keys()]);$.selectAll("mySlices").data(E).enter().append("path").attr("d",_).attr("fill",t=>A(t.data.label)).attr("class",t=>{let l="pieCircle";return u.highlightSlice==="hover"?l+=" highlightedOnHover":u.highlightSlice===t.data.label&&(l+=" highlighted"),l}),$.selectAll("mySlices").data(E).enter().append("text").text(t=>(t.data.value/D*100).toFixed(0)+"%").attr("transform",t=>"translate("+q.centroid(t)+")").style("text-anchor","middle").attr("class","slice");let U=b.append("text").text(g.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText"),v=[...y.entries()].map(([t,l])=>({label:t,value:l})),f=b.selectAll(".legend").data(v).enter().append("g").attr("class","legend");f.append("rect").attr("width",r).attr("height",r).style("fill",t=>A(t.label)).style("stroke",t=>A(t.label)),f.append("text").attr("x",r+n).attr("y",r-n).text(t=>g.getShowData()?`${t.label} [${t.value}]`:t.label);let w=Math.max(...f.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),C=S,M=x+L,s=r+n,O=v.length*s;switch(I){case"center":f.attr("transform",(t,l)=>{let p=s*v.length/2,c=-w/2-(r+n),h=l*s-p;return"translate("+c+","+h+")"});break;case"top":C+=O,f.attr("transform",(t,l)=>{let p=m,c=-w/2-(r+n),h=l*s-p;return`translate(${c}, ${h})`}),$.attr("transform",()=>`translate(0, ${O+s})`);break;case"bottom":C+=O,f.attr("transform",(t,l)=>{let p=-m-s,c=-w/2-(r+n),h=l*s-p;return"translate("+c+","+h+")"});break;case"left":M+=r+n+w,f.attr("transform",(t,l)=>{let p=s*v.length/2,c=-m-(r+n),h=l*s-p;return"translate("+c+","+h+")"}),$.attr("transform",()=>`translate(${w+r+n}, 0)`);break;case"right":default:M+=r+n+w,f.attr("transform",(t,l)=>{let p=s*v.length/2,c=12*r,h=l*s-p;return"translate("+c+","+h+")"});break}let N=U.node()?.getBoundingClientRect().width??0,X=x/2-N/2,Y=x/2+N/2,Q=Math.min(0,X),Z=Math.max(M,Y)-Q;k.attr("viewBox",`${Q} 0 ${Z} ${C}`),ge(k,C,Z,u.useMaxWidth)},"draw"),Re={draw:Oe},Le={parser:ke,db:G,renderer:Re,styles:Ae};export{Le as diagram};
