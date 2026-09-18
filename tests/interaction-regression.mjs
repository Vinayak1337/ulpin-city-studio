import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('qa/improvements-20260918',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1672,height:941},hasTouch:true});
const page=await context.newPage();page.setDefaultTimeout(30000);
const errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const cdp=await context.newCDPSession(page);
const debug=()=>page.evaluate(()=>structuredClone(window.__CITY_DEBUG__));
const distance=(a,b)=>Math.hypot(...a.target.map((x,i)=>x-b.target[i]));
const fresh=async()=>{await page.goto('http://127.0.0.1:5175');await page.waitForFunction(()=>window.__CITY_DEBUG__?.controlConnected);await page.waitForTimeout(2200);};
const point=async()=>{const r=await page.locator('.map-viewport canvas').boundingBox();return {x:r.x+r.width*.3,y:r.y+r.height*.38};};
const gesture=async(name,fn)=>{await fresh();const before=await debug();await fn();await page.waitForTimeout(650);const after=await debug();results.push({name,before,after,targetDistance:distance(before,after),zoomDelta:after.zoom-before.zoom,passed:true});console.log('PASS',name);};
async function mouseDrag(button='left',hold=650){const a=await point();await page.mouse.move(a.x,a.y);await page.mouse.down({button});await page.waitForTimeout(hold);for(let i=1;i<=24;i++){await page.mouse.move(a.x+i*6,a.y+i*2.6);await page.waitForTimeout(20);}await page.mouse.up({button});}
async function touchPan(cancel=false){const a=await point();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...a}]});await page.waitForTimeout(650);for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:a.x+i*7,y:a.y+i*3}]});await page.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});}
try{
  await gesture('Held left drag continues through React updates',async()=>{const a=await debug();await mouseDrag();await page.waitForTimeout(400);const b=await debug();expect(distance(a,b)).toBeGreaterThan(10);expect(b.selected).toBe(a.selected);});
  await gesture('Repeated mouse drags and subsequent wheel zoom',async()=>{await mouseDrag();const a=await debug();await mouseDrag();await page.waitForTimeout(400);const b=await debug();expect(distance(a,b)).toBeGreaterThan(10);await page.mouse.wheel(0,-240);await page.waitForTimeout(500);expect((await debug()).zoom).toBeGreaterThan(b.zoom+.2);});
  await gesture('Held right drag orbits continuously',async()=>{const a=await debug();await mouseDrag('right');await page.waitForTimeout(500);const b=await debug();expect(Math.abs(b.azimuth-a.azimuth)).toBeGreaterThan(.2);expect(b.selected).toBe(a.selected);});
  await gesture('One-finger held pan',async()=>{const a=await debug();await touchPan();await page.waitForTimeout(500);expect(distance(a,await debug())).toBeGreaterThan(6);});
  await gesture('Two-finger held pinch zooms',async()=>{const a=await point(),before=await debug();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:a.x-34,y:a.y},{id:2,x:a.x+34,y:a.y}]});await page.waitForTimeout(650);for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:a.x-34-i*2.7,y:a.y},{id:2,x:a.x+34+i*2.7,y:a.y}]});await page.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);expect((await debug()).zoom).toBeGreaterThan(before.zoom+1);});
  await gesture('Cancellation followed by a fresh touch gesture',async()=>{await touchPan(true);const a=await debug();await touchPan();await page.waitForTimeout(500);expect(distance(a,await debug())).toBeGreaterThan(6);});
  await gesture('Window blur cancels a held gesture without locking navigation',async()=>{const a=await point();await page.mouse.move(a.x,a.y);await page.mouse.down();await page.waitForTimeout(650);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();const old=await debug();await mouseDrag();await page.waitForTimeout(500);expect(distance(old,await debug())).toBeGreaterThan(6);});
  await gesture('2D remains a top-down plan after property selection',async()=>{await page.getByRole('button',{name:'2D',exact:true}).click();await page.waitForTimeout(1700);await page.locator('.property-row').nth(1).click();await page.waitForTimeout(1700);const b=await debug();expect(b.mode).toBe('2d');expect(b.polar).toBeLessThan(.001);await page.getByRole('button',{name:'Fit block',exact:true}).click();await page.waitForTimeout(1500);expect((await debug()).polar).toBeLessThan(.001);});
  await gesture('Scale bar represents its labelled distance at multiple zooms',async()=>{await page.getByRole('button',{name:'2D',exact:true}).click();await page.waitForTimeout(1500);for(let i=0;i<3;i++){await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(1300);const measured=await page.evaluate(()=>{const bar=document.querySelector('.scale>span');return {metres:Number(bar.dataset.metres),pixels:bar.getBoundingClientRect().width,zoom:window.__CITY_DEBUG__.zoom};});expect(Math.abs(measured.pixels/measured.zoom-measured.metres)).toBeLessThan(.02);}});
  await fresh();await page.screenshot({path:'qa/improvements-20260918/desktop-map.png'});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(900);
  const mobile=await page.evaluate(()=>{const target=document.querySelector('[title="Zoom in"]'),r=target.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {inspectorHeight:document.querySelector('.inspector').getBoundingClientRect().height,zoomAccessible:target.contains(top),documentWidth:document.documentElement.scrollWidth};});
  expect(mobile.inspectorHeight).toBeLessThan(95);expect(mobile.zoomAccessible).toBe(true);expect(mobile.documentWidth).toBe(390);
  await page.getByRole('button',{name:'Layers',exact:true}).click();await expect(page.locator('.sidebar.mobile-open')).toBeVisible();await page.getByRole('switch',{name:'Water pipeline',exact:true}).click();await page.getByRole('button',{name:'Close layers',exact:true}).click();
  await page.getByRole('button',{name:'Expand property details',exact:true}).click();await expect(page.locator('.inspector.mobile-expanded')).toBeVisible();await page.getByRole('button',{name:'Collapse property details',exact:true}).click();
  await page.screenshot({path:'qa/improvements-20260918/mobile-map.png'});
  results.push({name:'Mobile layer menu, unobstructed zoom, compact/expanded property sheet',mobile,passed:true});
  expect(errors).toEqual([]);
  fs.writeFileSync('qa/improvements-20260918/interaction-results.json',JSON.stringify({at:new Date().toISOString(),touchMethod:'Chrome CDP emulation; not a physical phone',results,errors},null,2));
  console.log(JSON.stringify({passed:results.length,errors}));
}catch(error){await page.screenshot({path:'qa/improvements-20260918/interaction-failure.png'}).catch(()=>{});fs.writeFileSync('qa/improvements-20260918/interaction-results.json',JSON.stringify({results,errors,failure:String(error)},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
