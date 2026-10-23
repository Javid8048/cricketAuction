import{E as u}from"./index-Qz36NBIf.js";/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=u("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);function h(o,n,r){const s=e=>e==null?'""':`"${String(e).replace(/"/g,'""')}"`,i=[n.map(s).join(","),...r.map(e=>e.map(s).join(","))].join(`\r
`),d=new Blob(["\uFEFF"+i],{type:"text/csv;charset=utf-8;"}),c=URL.createObjectURL(d),t=document.createElement("a");t.setAttribute("href",c),t.setAttribute("download",o.endsWith(".csv")?o:`${o}.csv`),document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(c)}export{b as P,h as e};
