import{b as s}from"./index-B-BtorH7.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]],d=s("chart-no-axes-column",g);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]],u=s("message-square",l),r="daytrack_feedbacks";function c(){try{const t=localStorage.getItem(r);if(t){const e=JSON.parse(t);if(Array.isArray(e))return e}}catch{}return[]}function f(t){const e=c(),a={...t,id:Date.now().toString()+Math.random().toString(36).slice(2),createdAt:new Date().toISOString()};return e.unshift(a),localStorage.setItem(r,JSON.stringify(e)),a}function S(t){const e=c().filter(a=>a.id!==t);localStorage.setItem(r,JSON.stringify(e))}function h(t){if(t.length===0)return{avgRating:0,total:0,byCategory:{},byRating:{}};const e=t.reduce((n,i)=>n+i.rating,0)/t.length,a={},o={1:0,2:0,3:0,4:0,5:0};for(const n of t)a[n.category]=(a[n.category]||0)+1,o[n.rating]=(o[n.rating]||0)+1;return{avgRating:e,total:t.length,byCategory:a,byRating:o}}export{d as C,u as M,h as a,S as d,c as g,f as s};
