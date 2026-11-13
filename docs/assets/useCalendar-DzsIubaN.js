import{b as u,r,d as G}from"./index-B-BtorH7.js";import{u as H,a as J,d as y,i as U,j as W,k as X}from"./useAiPlanner-Fh_Qizdi.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=[["path",{d:"m11 17-5-5 5-5",key:"13zhaf"}],["path",{d:"m18 17-5-5 5-5",key:"h8a8et"}]],se=u("chevrons-left",Z);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["path",{d:"m6 17 5-5-5-5",key:"xnjwq"}],["path",{d:"m13 17 5-5-5-5",key:"17xmmf"}]],ae=u("chevrons-right",A);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]],ce=u("lock-open",ee);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]],re=u("pencil",te),le=["T2","T3","T4","T5","T6","T7","CN"],de={1:"Ngày Quốc tế",19:"Tết Đoan Ngọ"},he=["Thg 1","Thg 2","Thg 3","Thg 4","Thg 5","Thg 6","Thg 7","Thg 8","Thg 9","Thg 10","Thg 11","Thg 12"];function ue({onAddTasks:D}={}){const s=new Date,[n,d]=r.useState(s.getMonth()),[o,l]=r.useState(s.getFullYear()),[a,i]=r.useState(s.getDate()),[m,v]=r.useState(new Set([15,20])),[N,h]=r.useState(!1),[x,g]=r.useState(null),w=H(),L=J(),T=s.getMonth()===n&&s.getFullYear()===o,E=T?s.getDate():-1,f=new Date(o,n,1).getDay(),Y=f===0?6:f-1,_=new Date(o,n+1,0).getDate();r.useEffect(()=>{const e=new Date(o,n+1,0).getDate();a>e&&i(e)},[n,o,a]);const B=()=>{d(e=>e===0?(l(t=>t-1),11):e-1)},$=()=>{d(e=>e===11?(l(t=>t+1),0):e+1)},F=()=>{l(e=>e-1)},P=()=>{l(e=>e+1)},b=e=>{Number.isFinite(e)&&e>=1970&&e<=2100&&l(e)},q=()=>{d(s.getMonth()),l(s.getFullYear()),i(s.getDate())},p=e=>{const t=new Date(o,n,e).getDay();return G[t===0?6:t-1]},S=e=>{const t=(w[p(e)]||[]).map(k=>({...k,source:"weekday"})),c=(L[y(o,n,e)]||[]).map(k=>({...k,source:"date"}));return[...t,...c]},z=m.has(a),I=S(a),M=p(a),O=w[M]||[],j=e=>{v(t=>{const c=new Set(t);return c.has(e)?c.delete(e):c.add(e),c})},C=()=>{g(null),h(!0)},K=e=>{g(e),h(!0)},Q=()=>{h(!1),g(null)},R=e=>{const t=y(o,n,a),c={id:e.id??Date.now().toString(),title:e.name,time:`${e.timeStart} - ${e.timeEnd}`,color:e.color,tasks:e.tasks};e.id?W(t,e.id,c):X(t,c),e.tasks.length>0&&D&&D(e.tasks,e.name,`${a} tháng ${n+1}`,t)},V=e=>{U(y(o,n,a),e)};return r.useEffect(()=>{const e=()=>C();return window.addEventListener("nav:quick-action",e),()=>window.removeEventListener("nav:quick-action",e)},[]),{currentMonth:n,setCurrentMonth:d,currentYear:o,setCurrentYear:l,goToPrevMonth:B,goToNextMonth:$,goToPrevYear:F,goToNextYear:P,setYear:b,goToToday:q,selectedDay:a,setSelectedDay:i,lockedDays:m,isModalOpen:N,setIsModalOpen:h,editingBlock:x,openCreateSchedule:C,openEditSchedule:K,closeModal:Q,offset:Y,daysInMonth:_,isLocked:z,currentSchedules:I,weekdayForSelected:M,weekdaySchedule:O,getDaySchedules:S,todayDate:E,isCurrentMonth:T,toggleLock:j,handleSaveSchedule:R,handleDeleteSchedule:V}}export{se as C,ce as L,re as P,ae as a,de as h,he as m,ue as u,le as w};
