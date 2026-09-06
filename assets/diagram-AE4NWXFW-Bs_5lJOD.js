import{c as v}from"./chunk-JQRUD6KW-Cv0boemF.js";import{l as C}from"./cynefin-OW5HDTMX-6OCTWOGG-bxOH7wEV.js";import{m as f,L as m,a3 as P,Z as z,p as w,t as F,i as S,g as T,s as W,o as D,r as E,K as L,w as A,Q as R}from"./mermaid.esm.min-ZEJ9hRKt.js";import"./app-CnH3ALE1.js";var M=A.packet,u,y=(u=class{constructor(){this.packet=[],this.setAccTitle=F,this.getAccTitle=S,this.setDiagramTitle=T,this.getDiagramTitle=W,this.getAccDescription=D,this.setAccDescription=E}getConfig(){let t=m({...M,...L().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){R(),this.packet=[]}},f(u,"PacketDB"),u),Y=1e4,H=f((e,t)=>{v(e,t);let r=-1,i=[],l=1,{bitsPerRow:n}=t.getConfig();for(let{start:a,end:o,bits:c,label:d}of e.blocks){if(a!==void 0&&o!==void 0&&o<a)throw new Error(`Packet block ${a} - ${o} is invalid. End must be greater than start.`);if(a??=r+1,a!==r+1)throw new Error(`Packet block ${a} - ${o??a} is not contiguous. It should start from ${r+1}.`);if(c===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(o??=a+(c??1)-1,c??=o-a+1,r=o,w.debug(`Packet block ${a} - ${r} with label ${d}`);i.length<=n+1&&t.getPacket().length<Y;){let[p,s]=K({start:a,end:o,bits:c,label:d},l,n);if(i.push(p),p.end+1===l*n&&(t.pushWord(i),i=[],l++),!s)break;({start:a,end:o,bits:c,label:d}=s)}}t.pushWord(i)},"populate"),K=f((e,t,r)=>{if(e.start===void 0)throw new Error("start should have been set during first phase");if(e.end===void 0)throw new Error("end should have been set during first phase");if(e.start>e.end)throw new Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*r)return[e,void 0];let i=t*r-1,l=t*r;return[{start:e.start,end:i,label:e.label,bits:i-e.start},{start:l,end:e.end,label:e.label,bits:e.end-l}]},"getNextFittingBlock"),$={parser:{yy:void 0},parse:f(async e=>{let t=await C("packet",e),r=$.parser?.yy;if(!(r instanceof y))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");w.debug(t),H(t,r)},"parse")},N=f((e,t,r,i)=>{let l=i.db,n=l.getConfig(),{rowHeight:a,paddingY:o,bitWidth:c,bitsPerRow:d}=n,p=l.getPacket(),s=l.getDiagramTitle(),b=a+o,h=b*(p.length+1)-(s?0:a),k=c*d+2,g=P(t);g.attr("viewBox",`0 0 ${k} ${h}`),z(g,h,k,n.useMaxWidth);for(let[x,B]of p.entries())Q(g,B,x,n);g.append("text").text(s).attr("x",k/2).attr("y",h-b/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),Q=f((e,t,r,{rowHeight:i,paddingX:l,paddingY:n,bitWidth:a,bitsPerRow:o,showBits:c})=>{let d=e.append("g"),p=r*(i+n)+n;for(let s of t){let b=s.start%o*a+1,h=(s.end-s.start+1)*a-l;if(d.append("rect").attr("x",b).attr("y",p).attr("width",h).attr("height",i).attr("class","packetBlock"),d.append("text").attr("x",b+h/2).attr("y",p+i/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(s.label),!c)continue;let k=s.end===s.start,g=p-2;d.append("text").attr("x",b+(k?h/2:0)).attr("y",g).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",k?"middle":"start").text(s.start),k||d.append("text").attr("x",b+h).attr("y",g).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(s.end)}},"drawWord"),Z={draw:N},j={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},q=f(({packet:e}={})=>{let t=m(j,e);return`
	.packetByte {
		font-size: ${t.byteFontSize};
	}
	.packetByte.start {
		fill: ${t.startByteColor};
	}
	.packetByte.end {
		fill: ${t.endByteColor};
	}
	.packetLabel {
		fill: ${t.labelColor};
		font-size: ${t.labelFontSize};
	}
	.packetTitle {
		fill: ${t.titleColor};
		font-size: ${t.titleFontSize};
	}
	.packetBlock {
		stroke: ${t.blockStrokeColor};
		stroke-width: ${t.blockStrokeWidth};
		fill: ${t.blockFillColor};
	}
	`},"styles"),X={parser:$,get db(){return new y},renderer:Z,styles:q};export{X as diagram};
