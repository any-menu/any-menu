import{c as v}from"./chunk-JQRUD6KW-Cl33Ksda.js";import{d as C}from"./wardley-L42UT6IY-5TKZOOLJ-CilSdGDV.js";import{aC as f,q as m,af as P,at as z,aP as w,am as F,aW as S,ar as W,aI as D,a7 as E,aB as T,I as A,ak as I,aN as L}from"./mermaid.esm.min-DLseQRMG.js";import"./app-BZa0SVVg.js";var R=I.packet,u,y=(u=class{constructor(){this.packet=[],this.setAccTitle=F,this.getAccTitle=S,this.setDiagramTitle=W,this.getDiagramTitle=D,this.getAccDescription=E,this.setAccDescription=T}getConfig(){let t=m({...R,...A().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){L(),this.packet=[]}},f(u,"PacketDB"),u),M=1e4,N=f((e,t)=>{v(e,t);let r=-1,s=[],l=1,{bitsPerRow:n}=t.getConfig();for(let{start:a,end:o,bits:c,label:d}of e.blocks){if(a!==void 0&&o!==void 0&&o<a)throw new Error(`Packet block ${a} - ${o} is invalid. End must be greater than start.`);if(a??=r+1,a!==r+1)throw new Error(`Packet block ${a} - ${o??a} is not contiguous. It should start from ${r+1}.`);if(c===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(o??=a+(c??1)-1,c??=o-a+1,r=o,w.debug(`Packet block ${a} - ${r} with label ${d}`);s.length<=n+1&&t.getPacket().length<M;){let[p,i]=Y({start:a,end:o,bits:c,label:d},l,n);if(s.push(p),p.end+1===l*n&&(t.pushWord(s),s=[],l++),!i)break;({start:a,end:o,bits:c,label:d}=i)}}t.pushWord(s)},"populate"),Y=f((e,t,r)=>{if(e.start===void 0)throw new Error("start should have been set during first phase");if(e.end===void 0)throw new Error("end should have been set during first phase");if(e.start>e.end)throw new Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*r)return[e,void 0];let s=t*r-1,l=t*r;return[{start:e.start,end:s,label:e.label,bits:s-e.start},{start:l,end:e.end,label:e.label,bits:e.end-l}]},"getNextFittingBlock"),$={parser:{yy:void 0},parse:f(async e=>{let t=await C("packet",e),r=$.parser?.yy;if(!(r instanceof y))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");w.debug(t),N(t,r)},"parse")},q=f((e,t,r,s)=>{let l=s.db,n=l.getConfig(),{rowHeight:a,paddingY:o,bitWidth:c,bitsPerRow:d}=n,p=l.getPacket(),i=l.getDiagramTitle(),b=a+o,h=b*(p.length+1)-(i?0:a),k=c*d+2,g=P(t);g.attr("viewBox",`0 0 ${k} ${h}`),z(g,h,k,n.useMaxWidth);for(let[x,B]of p.entries())H(g,B,x,n);g.append("text").text(i).attr("x",k/2).attr("y",h-b/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),H=f((e,t,r,{rowHeight:s,paddingX:l,paddingY:n,bitWidth:a,bitsPerRow:o,showBits:c})=>{let d=e.append("g"),p=r*(s+n)+n;for(let i of t){let b=i.start%o*a+1,h=(i.end-i.start+1)*a-l;if(d.append("rect").attr("x",b).attr("y",p).attr("width",h).attr("height",s).attr("class","packetBlock"),d.append("text").attr("x",b+h/2).attr("y",p+s/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(i.label),!c)continue;let k=i.end===i.start,g=p-2;d.append("text").attr("x",b+(k?h/2:0)).attr("y",g).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",k?"middle":"start").text(i.start),k||d.append("text").attr("x",b+h).attr("y",g).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(i.end)}},"drawWord"),j={draw:q},G={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},O=f(({packet:e}={})=>{let t=m(G,e);return`
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
	`},"styles"),K={parser:$,get db(){return new y},renderer:j,styles:O};export{K as diagram};
