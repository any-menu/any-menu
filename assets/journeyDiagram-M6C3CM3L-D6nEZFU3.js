import{o as mt}from"./chunk-AZZRMDJM-BwgQ5yOa.js";import{g as xt,u as ot,f as kt,x as _t}from"./chunk-LII3EMHJ-DMUz_UkC.js";import{a7 as bt,aB as wt,aW as $t,am as vt,aI as St,ar as Mt,aC as r,aT as L,as as U,at as Tt,aN as Ct,az as it}from"./mermaid.esm.min-DUbmlQL1.js";import"./app-dtjr60ua.js";var Z=(function(){var e=r(function(d,i,n,y){for(n=n||{},y=d.length;y--;n[d[y]]=i);return n},"o"),t=[6,8,10,11,12,14,16,17,18],o=[1,9],p=[1,10],a=[1,11],l=[1,12],c=[1,13],h=[1,14],f={trace:r(function(){},"trace"),yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:r(function(d,i,n,y,u,s,k){var x=s.length-1;switch(u){case 1:return s[x-1];case 2:this.$=[];break;case 3:s[x-1].push(s[x]),this.$=s[x-1];break;case 4:case 5:this.$=s[x];break;case 6:case 7:this.$=[];break;case 8:y.setDiagramTitle(s[x].substr(6)),this.$=s[x].substr(6);break;case 9:this.$=s[x].trim(),y.setAccTitle(this.$);break;case 10:case 11:this.$=s[x].trim(),y.setAccDescription(this.$);break;case 12:y.addSection(s[x].substr(8)),this.$=s[x].substr(8);break;case 13:y.addTask(s[x-1],s[x]),this.$="task";break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},e(t,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:o,12:p,14:a,16:l,17:c,18:h},e(t,[2,7],{1:[2,1]}),e(t,[2,3]),{9:15,11:o,12:p,14:a,16:l,17:c,18:h},e(t,[2,5]),e(t,[2,6]),e(t,[2,8]),{13:[1,16]},{15:[1,17]},e(t,[2,11]),e(t,[2,12]),{19:[1,18]},e(t,[2,4]),e(t,[2,9]),e(t,[2,10]),e(t,[2,13])],defaultActions:{},parseError:r(function(d,i){if(i.recoverable)this.trace(d);else{var n=new Error(d);throw n.hash=i,n}},"parseError"),parse:r(function(d){var i=this,n=[0],y=[],u=[null],s=[],k=this.table,x="",E=0,P=0,pt=0,yt=2,H=1,dt=s.slice.call(arguments,1),_=Object.create(this.lexer),I={yy:{}};for(var z in this.yy)Object.prototype.hasOwnProperty.call(this.yy,z)&&(I.yy[z]=this.yy[z]);_.setInput(d,I.yy),I.yy.lexer=_,I.yy.parser=this,typeof _.yylloc>"u"&&(_.yylloc={});var q=_.yylloc;s.push(q);var ft=_.options&&_.options.ranges;typeof I.yy.parseError=="function"?this.parseError=I.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function gt(w){n.length=n.length-2*w,u.length=u.length-w,s.length=s.length-w}r(gt,"popStack");function tt(){var w;return w=y.pop()||_.lex()||H,typeof w!="number"&&(w instanceof Array&&(y=w,w=y.pop()),w=i.symbols_[w]||w),w}r(tt,"lex");for(var b,Y,A,$,Zt,G,j={},N,M,et,V;;){if(A=n[n.length-1],this.defaultActions[A]?$=this.defaultActions[A]:((b===null||typeof b>"u")&&(b=tt()),$=k[A]&&k[A][b]),typeof $>"u"||!$.length||!$[0]){var W="";V=[];for(N in k[A])this.terminals_[N]&&N>yt&&V.push("'"+this.terminals_[N]+"'");_.showPosition?W="Parse error on line "+(E+1)+`:
`+_.showPosition()+`
Expecting `+V.join(", ")+", got '"+(this.terminals_[b]||b)+"'":W="Parse error on line "+(E+1)+": Unexpected "+(b==H?"end of input":"'"+(this.terminals_[b]||b)+"'"),this.parseError(W,{text:_.match,token:this.terminals_[b]||b,line:_.yylineno,loc:q,expected:V})}if($[0]instanceof Array&&$.length>1)throw new Error("Parse Error: multiple actions possible at state: "+A+", token: "+b);switch($[0]){case 1:n.push(b),u.push(_.yytext),s.push(_.yylloc),n.push($[1]),b=null,Y?(b=Y,Y=null):(P=_.yyleng,x=_.yytext,E=_.yylineno,q=_.yylloc,pt>0);break;case 2:if(M=this.productions_[$[1]][1],j.$=u[u.length-M],j._$={first_line:s[s.length-(M||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(M||1)].first_column,last_column:s[s.length-1].last_column},ft&&(j._$.range=[s[s.length-(M||1)].range[0],s[s.length-1].range[1]]),G=this.performAction.apply(j,[x,P,E,I.yy,$[1],u,s].concat(dt)),typeof G<"u")return G;M&&(n=n.slice(0,-1*M*2),u=u.slice(0,-1*M),s=s.slice(0,-1*M)),n.push(this.productions_[$[1]][0]),u.push(j.$),s.push(j._$),et=k[n[n.length-2]][n[n.length-1]],n.push(et);break;case 3:return!0}}return!0},"parse")},m=(function(){var d={EOF:1,parseError:r(function(i,n){if(this.yy.parser)this.yy.parser.parseError(i,n);else throw new Error(i)},"parseError"),setInput:r(function(i,n){return this.yy=n||this.yy||{},this._input=i,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:r(function(){var i=this._input[0];this.yytext+=i,this.yyleng++,this.offset++,this.match+=i,this.matched+=i;var n=i.match(/(?:\r\n?|\n).*/g);return n?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),i},"input"),unput:r(function(i){var n=i.length,y=i.split(/(?:\r\n?|\n)/g);this._input=i+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-n),this.offset-=n;var u=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),y.length-1&&(this.yylineno-=y.length-1);var s=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:y?(y.length===u.length?this.yylloc.first_column:0)+u[u.length-y.length].length-y[0].length:this.yylloc.first_column-n},this.options.ranges&&(this.yylloc.range=[s[0],s[0]+this.yyleng-n]),this.yyleng=this.yytext.length,this},"unput"),more:r(function(){return this._more=!0,this},"more"),reject:r(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:r(function(i){this.unput(this.match.slice(i))},"less"),pastInput:r(function(){var i=this.matched.substr(0,this.matched.length-this.match.length);return(i.length>20?"...":"")+i.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:r(function(){var i=this.match;return i.length<20&&(i+=this._input.substr(0,20-i.length)),(i.substr(0,20)+(i.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:r(function(){var i=this.pastInput(),n=new Array(i.length+1).join("-");return i+this.upcomingInput()+`
`+n+"^"},"showPosition"),test_match:r(function(i,n){var y,u,s;if(this.options.backtrack_lexer&&(s={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(s.yylloc.range=this.yylloc.range.slice(0))),u=i[0].match(/(?:\r\n?|\n).*/g),u&&(this.yylineno+=u.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:u?u[u.length-1].length-u[u.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+i[0].length},this.yytext+=i[0],this.match+=i[0],this.matches=i,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(i[0].length),this.matched+=i[0],y=this.performAction.call(this,this.yy,this,n,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),y)return y;if(this._backtrack){for(var k in s)this[k]=s[k];return!1}return!1},"test_match"),next:r(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var i,n,y,u;this._more||(this.yytext="",this.match="");for(var s=this._currentRules(),k=0;k<s.length;k++)if(y=this._input.match(this.rules[s[k]]),y&&(!n||y[0].length>n[0].length)){if(n=y,u=k,this.options.backtrack_lexer){if(i=this.test_match(y,s[k]),i!==!1)return i;if(this._backtrack){n=!1;continue}else return!1}else if(!this.options.flex)break}return n?(i=this.test_match(n,s[u]),i!==!1?i:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:r(function(){var i=this.next();return i||this.lex()},"lex"),begin:r(function(i){this.conditionStack.push(i)},"begin"),popState:r(function(){var i=this.conditionStack.length-1;return i>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:r(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:r(function(i){return i=this.conditionStack.length-1-Math.abs(i||0),i>=0?this.conditionStack[i]:"INITIAL"},"topState"),pushState:r(function(i){this.begin(i)},"pushState"),stateStackSize:r(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:r(function(i,n,y,u){switch(y){case 0:break;case 1:break;case 2:return 10;case 3:break;case 4:break;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;case 8:return this.popState(),"acc_title_value";case 9:return this.begin("acc_descr"),14;case 10:return this.popState(),"acc_descr_value";case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}};return d})();f.lexer=m;function g(){this.yy={}}return r(g,"Parser"),g.prototype=f,f.Parser=g,new g})();Z.parser=Z;var Et=Z,B="",K=[],R=[],O=[],It=r(function(){K.length=0,R.length=0,B="",O.length=0,Ct()},"clear"),At=r(function(e){B=e,K.push(e)},"addSection"),Pt=r(function(){return K},"getSections"),jt=r(function(){let e=nt(),t=100,o=0;for(;!e&&o<t;)e=nt(),o++;return R.push(...O),R},"getTasks"),Bt=r(function(){let e=[];return R.forEach(t=>{t.people&&e.push(...t.people)}),[...new Set(e)].sort()},"updateActors"),Lt=r(function(e,t){let o=t.substr(1).split(":"),p=0,a=[];o.length===1?(p=Number(o[0]),a=[]):(p=Number(o[0]),a=o[1].split(","));let l=a.map(h=>h.trim()),c={section:B,type:B,people:l,task:e,score:p};O.push(c)},"addTask"),Rt=r(function(e){let t={section:B,type:B,description:e,task:e,classes:[]};R.push(t)},"addTaskOrg"),nt=r(function(){let e=r(function(o){return O[o].processed},"compileTask"),t=!0;for(let[o,p]of O.entries())e(o),t=t&&p.processed;return t},"compileTasks"),Ot=r(function(){return Bt()},"getActors"),at={getConfig:r(()=>L().journey,"getConfig"),clear:It,setDiagramTitle:Mt,getDiagramTitle:St,setAccTitle:vt,getAccTitle:$t,setAccDescription:wt,getAccDescription:bt,addSection:At,getSections:Pt,getTasks:jt,addTask:Lt,addTaskOrg:Rt,getActors:Ot},Ft=r(e=>`.label {
    font-family: ${e.fontFamily};
    color: ${e.textColor};
  }
  .mouth {
    stroke: #666;
  }

  line {
    stroke: ${e.textColor}
  }

  .legend {
    fill: ${e.textColor};
    font-family: ${e.fontFamily};
  }

  .label text {
    fill: #333;
  }
  .label {
    color: ${e.textColor}
  }

  .face {
    ${e.faceColor?`fill: ${e.faceColor}`:"fill: #FFF8DC"};
    stroke: #999;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${e.mainBkg};
    stroke: ${e.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${e.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${e.lineColor};
    stroke-width: 1.5px;
  }

  .flowchart-link {
    stroke: ${e.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${e.edgeLabelBackground};
    rect {
      opacity: 0.5;
    }
    text-align: center;
  }

  .cluster rect {
  }

  .cluster text {
    fill: ${e.titleColor};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${e.fontFamily};
    font-size: 12px;
    background: ${e.tertiaryColor};
    border: 1px solid ${e.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .task-type-0, .section-type-0  {
    ${e.fillType0?`fill: ${e.fillType0}`:""};
  }
  .task-type-1, .section-type-1  {
    ${e.fillType0?`fill: ${e.fillType1}`:""};
  }
  .task-type-2, .section-type-2  {
    ${e.fillType0?`fill: ${e.fillType2}`:""};
  }
  .task-type-3, .section-type-3  {
    ${e.fillType0?`fill: ${e.fillType3}`:""};
  }
  .task-type-4, .section-type-4  {
    ${e.fillType0?`fill: ${e.fillType4}`:""};
  }
  .task-type-5, .section-type-5  {
    ${e.fillType0?`fill: ${e.fillType5}`:""};
  }
  .task-type-6, .section-type-6  {
    ${e.fillType0?`fill: ${e.fillType6}`:""};
  }
  .task-type-7, .section-type-7  {
    ${e.fillType0?`fill: ${e.fillType7}`:""};
  }

  .actor-0 {
    ${e.actor0?`fill: ${e.actor0}`:""};
  }
  .actor-1 {
    ${e.actor1?`fill: ${e.actor1}`:""};
  }
  .actor-2 {
    ${e.actor2?`fill: ${e.actor2}`:""};
  }
  .actor-3 {
    ${e.actor3?`fill: ${e.actor3}`:""};
  }
  .actor-4 {
    ${e.actor4?`fill: ${e.actor4}`:""};
  }
  .actor-5 {
    ${e.actor5?`fill: ${e.actor5}`:""};
  }
  ${mt()}
`,"getStyles"),Nt=Ft,Q=r(function(e,t){return _t(e,t)},"drawRect"),Vt=r(function(e,t){let o=e.append("circle").attr("cx",t.cx).attr("cy",t.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),p=e.append("g");p.append("circle").attr("cx",t.cx-15/3).attr("cy",t.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),p.append("circle").attr("cx",t.cx+15/3).attr("cy",t.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666");function a(h){let f=it().startAngle(Math.PI/2).endAngle(3*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);h.append("path").attr("class","mouth").attr("d",f).attr("transform","translate("+t.cx+","+(t.cy+2)+")")}r(a,"smile");function l(h){let f=it().startAngle(3*Math.PI/2).endAngle(5*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);h.append("path").attr("class","mouth").attr("d",f).attr("transform","translate("+t.cx+","+(t.cy+7)+")")}r(l,"sad");function c(h){h.append("line").attr("class","mouth").attr("stroke",2).attr("x1",t.cx-5).attr("y1",t.cy+7).attr("x2",t.cx+5).attr("y2",t.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}return r(c,"ambivalent"),t.score>3?a(p):t.score<3?l(p):c(p),o},"drawFace"),lt=r(function(e,t){let o=e.append("circle");return o.attr("cx",t.cx),o.attr("cy",t.cy),o.attr("class","actor-"+t.pos),o.attr("fill",t.fill),o.attr("stroke",t.stroke),o.attr("r",t.r),o.class!==void 0&&o.attr("class",o.class),t.title!==void 0&&o.append("title").text(t.title),o},"drawCircle"),ct=r(function(e,t){return kt(e,t)},"drawText"),Dt=r(function(e,t){function o(a,l,c,h,f){return a+","+l+" "+(a+c)+","+l+" "+(a+c)+","+(l+h-f)+" "+(a+c-f*1.2)+","+(l+h)+" "+a+","+(l+h)}r(o,"genPoints");let p=e.append("polygon");p.attr("points",o(t.x,t.y,50,20,7)),p.attr("class","labelBox"),t.y=t.y+t.labelMargin,t.x=t.x+.5*t.labelMargin,ct(e,t)},"drawLabel"),zt=r(function(e,t,o){let p=e.append("g"),a=ot();a.x=t.x,a.y=t.y,a.fill=t.fill,a.width=o.width*t.taskCount+o.diagramMarginX*(t.taskCount-1),a.height=o.height,a.class="journey-section section-type-"+t.num,a.rx=3,a.ry=3,Q(p,a),ht(o)(t.text,p,a.x,a.y,a.width,a.height,{class:"journey-section section-type-"+t.num},o,t.colour)},"drawSection"),J=-1,qt=r(function(e,t,o,p){let a=t.x+o.width/2,l=e.append("g");J++,l.append("line").attr("id",p+"-task"+J).attr("x1",a).attr("y1",t.y).attr("x2",a).attr("y2",450).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),Vt(l,{cx:a,cy:300+(5-t.score)*30,score:t.score});let c=ot();c.x=t.x,c.y=t.y,c.fill=t.fill,c.width=o.width,c.height=o.height,c.class="task task-type-"+t.num,c.rx=3,c.ry=3,Q(l,c);let h=t.x+14;t.people.forEach(f=>{let m=t.actors[f].color,g={cx:h,cy:t.y,r:7,fill:m,stroke:"#000",title:f,pos:t.actors[f].position};lt(l,g),h+=10}),ht(o)(t.task,l,c.x,c.y,c.width,c.height,{class:"task"},o,t.colour)},"drawTask"),Yt=r(function(e,t){xt(e,t)},"drawBackgroundRect"),ht=(function(){function e(a,l,c,h,f,m,g,d){let i=l.append("text").attr("x",c+f/2).attr("y",h+m/2+5).style("font-color",d).style("text-anchor","middle").text(a);p(i,g)}r(e,"byText");function t(a,l,c,h,f,m,g,d,i){let{taskFontSize:n,taskFontFamily:y}=d,u=a.split(/<br\s*\/?>/gi);for(let s=0;s<u.length;s++){let k=s*n-n*(u.length-1)/2,x=l.append("text").attr("x",c+f/2).attr("y",h).attr("fill",i).style("text-anchor","middle").style("font-size",n).style("font-family",y);x.append("tspan").attr("x",c+f/2).attr("dy",k).text(u[s]),x.attr("y",h+m/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),p(x,g)}}r(t,"byTspan");function o(a,l,c,h,f,m,g,d){let i=l.append("switch"),n=i.append("foreignObject").attr("x",c).attr("y",h).attr("width",f).attr("height",m).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");n.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(a),t(a,i,c,h,f,m,g,d),p(n,g)}r(o,"byFo");function p(a,l){for(let c in l)c in l&&a.attr(c,l[c])}return r(p,"_setTextAttrs"),function(a){return a.textPlacement==="fo"?o:a.textPlacement==="old"?e:t}})(),Gt=r(function(e,t){J=-1,e.append("defs").append("marker").attr("id",t+"-arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics"),F={drawRect:Q,drawCircle:lt,drawSection:zt,drawText:ct,drawLabel:Dt,drawTask:qt,drawBackgroundRect:Yt,initGraphics:Gt},Wt=r(function(e){Object.keys(e).forEach(function(t){S[t]=e[t]})},"setConf"),T={},D=0;function ut(e){let t=L().journey,o=t.maxLabelWidth;D=0;let p=60;Object.keys(T).forEach(a=>{let l=T[a].color,c={cx:20,cy:p,r:7,fill:l,stroke:"#000",pos:T[a].position};F.drawCircle(e,c);let h=e.append("text").attr("visibility","hidden").text(a),f=h.node().getBoundingClientRect().width;h.remove();let m=[];if(f<=o)m=[a];else{let g=a.split(" "),d="";h=e.append("text").attr("visibility","hidden"),g.forEach(i=>{let n=d?`${d} ${i}`:i;if(h.text(n),h.node().getBoundingClientRect().width>o){if(d&&m.push(d),d=i,h.text(i),h.node().getBoundingClientRect().width>o){let y="";for(let u of i)y+=u,h.text(y+"-"),h.node().getBoundingClientRect().width>o&&(m.push(y.slice(0,-1)+"-"),y=u);d=y}}else d=n}),d&&m.push(d),h.remove()}m.forEach((g,d)=>{let i={x:40,y:p+7+d*20,fill:"#666",text:g,textMargin:t.boxTextMargin??5},n=F.drawText(e,i).node().getBoundingClientRect().width;n>D&&n>t.leftMargin-n&&(D=n)}),p+=Math.max(20,m.length*20)})}r(ut,"drawActorLegend");var S=L().journey,C=0,Ut=r(function(e,t,o,p){let a=L(),l=a.journey.titleColor,c=a.journey.titleFontSize,h=a.journey.titleFontFamily,f=a.securityLevel,m;f==="sandbox"&&(m=U("#i"+t));let g=f==="sandbox"?U(m.nodes()[0].contentDocument.body):U("body");v.init();let d=g.select("#"+t);F.initGraphics(d,t);let i=p.db.getTasks(),n=p.db.getDiagramTitle(),y=p.db.getActors();for(let P in T)delete T[P];let u=0;y.forEach(P=>{T[P]={color:S.actorColours[u%S.actorColours.length],position:u},u++}),ut(d),C=S.leftMargin+D,v.insert(0,0,C,Object.keys(T).length*50),Xt(d,i,0,t);let s=v.getBounds();n&&d.append("text").text(n).attr("x",C).attr("font-size",c).attr("font-weight","bold").attr("y",25).attr("fill",l).attr("font-family",h);let k=s.stopy-s.starty+2*S.diagramMarginY,x=C+s.stopx+2*S.diagramMarginX;Tt(d,k,x,S.useMaxWidth),d.append("line").attr("x1",C).attr("y1",S.height*4).attr("x2",x-C-4).attr("y2",S.height*4).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#"+t+"-arrowhead)");let E=n?70:0;d.attr("viewBox",`${s.startx} -25 ${x} ${k+E}`),d.attr("preserveAspectRatio","xMinYMin meet"),d.attr("height",k+E+25)},"draw"),v={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:r(function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0},"init"),updateVal:r(function(e,t,o,p){e[t]===void 0?e[t]=o:e[t]=p(o,e[t])},"updateVal"),updateBounds:r(function(e,t,o,p){let a=L().journey,l=this,c=0;function h(f){return r(function(m){c++;let g=l.sequenceItems.length-c+1;l.updateVal(m,"starty",t-g*a.boxMargin,Math.min),l.updateVal(m,"stopy",p+g*a.boxMargin,Math.max),l.updateVal(v.data,"startx",e-g*a.boxMargin,Math.min),l.updateVal(v.data,"stopx",o+g*a.boxMargin,Math.max),f!=="activation"&&(l.updateVal(m,"startx",e-g*a.boxMargin,Math.min),l.updateVal(m,"stopx",o+g*a.boxMargin,Math.max),l.updateVal(v.data,"starty",t-g*a.boxMargin,Math.min),l.updateVal(v.data,"stopy",p+g*a.boxMargin,Math.max))},"updateItemBounds")}r(h,"updateFn"),this.sequenceItems.forEach(h())},"updateBounds"),insert:r(function(e,t,o,p){let a=Math.min(e,o),l=Math.max(e,o),c=Math.min(t,p),h=Math.max(t,p);this.updateVal(v.data,"startx",a,Math.min),this.updateVal(v.data,"starty",c,Math.min),this.updateVal(v.data,"stopx",l,Math.max),this.updateVal(v.data,"stopy",h,Math.max),this.updateBounds(a,c,l,h)},"insert"),bumpVerticalPos:r(function(e){this.verticalPos=this.verticalPos+e,this.data.stopy=this.verticalPos},"bumpVerticalPos"),getVerticalPos:r(function(){return this.verticalPos},"getVerticalPos"),getBounds:r(function(){return this.data},"getBounds")},X=S.sectionFills,rt=S.sectionColours,Xt=r(function(e,t,o,p){let a=L().journey,l="",c=a.height*2+a.diagramMarginY,h=o+c,f=0,m="#CCC",g="black",d=0;for(let[i,n]of t.entries()){if(l!==n.section){m=X[f%X.length],d=f%X.length,g=rt[f%rt.length];let u=0,s=n.section;for(let x=i;x<t.length&&t[x].section==s;x++)u=u+1;let k={x:i*a.taskMargin+i*a.width+C,y:50,text:n.section,fill:m,num:d,colour:g,taskCount:u};F.drawSection(e,k,a),l=n.section,f++}let y=n.people.reduce((u,s)=>(T[s]&&(u[s]=T[s]),u),{});n.x=i*a.taskMargin+i*a.width+C,n.y=h,n.width=a.diagramMarginX,n.height=a.diagramMarginY,n.colour=g,n.fill=m,n.num=d,n.actors=y,F.drawTask(e,n,a,p),v.insert(n.x,n.y,n.x+n.width+a.taskMargin,450)}},"drawTasks"),st={setConf:Wt,draw:Ut},te={parser:Et,db:at,renderer:st,styles:Nt,init:r(e=>{st.setConf(e.journey),at.clear()},"init")};export{te as diagram};
