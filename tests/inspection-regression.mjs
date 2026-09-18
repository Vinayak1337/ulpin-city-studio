import { chromium,expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const dir='qa/improvements-20260918';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1672,height:941},acceptDownloads:true});page.setDefaultTimeout(30000);
const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const shot=n=>page.screenshot({path:`${dir}/${n}.png`,timeout:60000});
const step=async(name,fn)=>{await fn();results.push({name,passed:true});console.log('PASS',name);};
const close=async()=>{await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await page.waitForTimeout(400);};
const download=async(button,file)=>{const wait=page.waitForEvent('download');await button.click();const d=await wait;await d.saveAs(path.resolve(dir,file));return fs.readFileSync(path.resolve(dir,file));};
const inspector=page.locator('.inspector');
try{
  await page.goto('http://127.0.0.1:5175');await page.waitForFunction(()=>window.__CITY_DEBUG__?.controlConnected);await page.waitForTimeout(3000);
  await shot('01-map-refined');
  await step('Direct canvas selection and full identifier search agree',async()=>{
    const point=await page.evaluate(()=>window.__CITY_PROJECT__('BLD-0414'));
    await page.mouse.click(point.x,point.y);await page.waitForTimeout(350);
    await expect(page.getByTestId('selected-ulpin')).toHaveText('11007510000414');
    const search=page.getByRole('textbox',{name:'Search ULPIN, property or owner',exact:true});
    await search.fill('11007500003527');await search.press('Enter');await page.waitForTimeout(1600);
    await expect(page.getByTestId('selected-ulpin')).toHaveText('11007500003527');
    await search.fill('');await search.press('Escape');
  });
  await step('Computed checks, finding filter and search recovery work',async()=>{
    await page.locator('.header-actions').getByRole('button',{name:'Check',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Checked 944 footprints');
    await page.locator('.sidebar-tabs').getByRole('button',{name:'Findings',exact:true}).click();
    await page.locator('.finding-filters').getByRole('button',{name:'Road',exact:true}).click();
    await expect(page.locator('.findings-list>button')).toHaveCount(4);
    await page.locator('.sidebar-tabs').getByRole('button',{name:'Layers',exact:true}).click();
    const input=page.getByRole('textbox',{name:'Search properties in district',exact:true});
    await input.fill('nothing-matches-this-734');await expect(page.locator('.empty-message')).toBeVisible();
    await input.fill('11007500003527');await expect(page.locator('.property-row')).toHaveCount(1);await input.fill('');
    await page.getByRole('button',{name:'Dismiss notification',exact:true}).click().catch(()=>{});
  });
  await step('Evidence Floor plans opens the requested floor plan',async()=>{
    await inspector.getByRole('button',{name:'Evidence',exact:true}).click();
    await inspector.getByRole('button',{name:/^Floor plans/}).click();
    await expect(page.locator('.rec-doc-tabs>.active')).toHaveText('Floor plan');
    await expect(page.locator('.rec-document h3')).toHaveText('Floor plan & unit schedule');
    await page.getByLabel('Floor',{exact:true}).selectOption('3');
    await expect(page.locator('.rec-document [data-room-kind="bedroom"]')).toHaveCount(4);
    await shot('02-shared-floor-plan');
    const bytes=await download(page.getByRole('button',{name:'PDF',exact:true}),'demo-floor-plan.pdf');expect(bytes.subarray(0,5).toString()).toBe('%PDF-');await close();
  });
  await step('Clicking Unit 101 opens its exact linked occupancy record',async()=>{
    await inspector.getByRole('button',{name:'Floors',exact:true}).click();
    await inspector.locator('.ins-unit').filter({hasText:'Unit 101'}).click();
    await expect(page.locator('.rec-doc-tabs>.active')).toHaveText('Occupancy record');
    await expect(page.getByLabel('Unit and occupant',{exact:true})).toHaveValue('BLD-0413/F1/U1');
    await expect(page.locator('.rec-document')).toContainText('BLD-0413/F1/U1');
    await shot('03-unit-101-record');
    const bytes=await download(page.getByRole('button',{name:'PDF',exact:true}),'demo-rent-agreement.pdf');expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  });
  await step('Register preserves selected unit and links model, plan and table',async()=>{
    await page.getByRole('button',{name:'Floor & occupancy schedule',exact:true}).click();await page.waitForTimeout(2200);
    await expect(page.locator('.register-selection')).toHaveAttribute('data-selected-unit','BLD-0413/F1/U1');
    await expect(page.locator('.register-unit-row.active')).toContainText('Unit 101');
    await expect(page.locator('.register-model canvas')).toBeVisible();
    await shot('04-register-workspace');
    await page.locator('.register-unit-row').filter({hasText:'Unit 102'}).click();
    await expect(page.locator('.register-selection')).toHaveAttribute('data-selected-unit','BLD-0413/F1/U2');
    await page.locator('.register-view-switch').getByRole('button',{name:'Floor plan',exact:true}).click();
    await expect(page.locator('.register-model [data-room-kind="bedroom"]')).toHaveCount(4);
    await shot('05-register-plan');
    await page.getByRole('button',{name:'Inspect record',exact:true}).click();
    await expect(page.getByLabel('Unit and occupant',{exact:true})).toHaveValue('BLD-0413/F1/U2');
    const bytes=await download(page.getByRole('button',{name:'Download complete register',exact:true}),'demo-building-register.pdf');expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  });
  await step('Modal focus stays inside, wraps and returns to its opener',async()=>{
    expect(await page.evaluate(()=>document.querySelector('[role="dialog"]').contains(document.activeElement))).toBe(true);
    for(let i=0;i<32;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.querySelector('[role="dialog"]').contains(document.activeElement))).toBe(true);}
    await page.keyboard.press('Shift+Tab');expect(await page.evaluate(()=>document.querySelector('[role="dialog"]').contains(document.activeElement))).toBe(true);
    await close();expect(await page.evaluate(()=>document.activeElement?.classList.contains('ins-unit'))).toBe(true);
  });
  await step('Map resumes working after closing its register',async()=>{
    const before=await page.evaluate(()=>window.__CITY_DEBUG__.zoom);await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(1300);expect(await page.evaluate(()=>window.__CITY_DEBUG__.zoom)).toBeGreaterThan(before+.5);
    await page.getByRole('button',{name:'Fit block',exact:true}).click();await page.waitForTimeout(1200);
  });
  await step('Utility overlay distinguishes horizontal clearance and burial depth',async()=>{
    await inspector.getByRole('button',{name:'Utilities',exact:true}).click();
    await expect(page.getByRole('region',{name:'Utility section overlay'})).toBeVisible();
    await expect(page.locator('.map-section-card')).toContainText('1.8 m');
    await expect(page.locator('.map-section-card')).toContainText('2.6 m');
    await shot('06-utility-section');
    await page.getByRole('button',{name:'Underground',exact:true}).click();await page.getByRole('switch',{name:'Sewer network',exact:true}).click();await page.getByRole('switch',{name:'Electric cables',exact:true}).click();await page.waitForTimeout(900);await shot('07-underground-networks');
    await page.getByRole('button',{name:'Underground',exact:true}).click();await page.getByRole('switch',{name:'Sewer network',exact:true}).click();await page.getByRole('switch',{name:'Electric cables',exact:true}).click();
    await page.getByRole('button',{name:'Close utility section',exact:true}).click();
  });
  await step('Aerial sheet and complete linked exports remain functional',async()=>{
    await page.locator('.header-actions').getByRole('button',{name:'Overview',exact:true}).click();await shot('08-aerial-sheet');
    let bytes=await download(page.getByRole('button',{name:'Download overview PDF',exact:true}),'demo-aerial-overview.pdf');expect(bytes.subarray(0,5).toString()).toBe('%PDF-');await close();
    await page.locator('.header-actions').getByRole('button',{name:'Export',exact:true}).click();
    expect(await page.evaluate(()=>document.querySelector('[role="dialog"]').contains(document.activeElement))).toBe(true);
    const data=JSON.parse((await download(page.getByRole('button',{name:/Complete linked dataset/}),'demo-district.json')).toString());expect(data.buildings.length).toBe(944);expect(data.buildings.reduce((n,b)=>n+b.units.length,0)).toBe(8454);expect(data.findings.length).toBe(24);
    const geo=JSON.parse((await download(page.getByRole('button',{name:/2D parcel GeoJSON/}),'demo-parcels.geojson')).toString());expect(geo.features.length).toBe(944);
    bytes=await download(page.getByRole('button',{name:/Current map as PNG/}),'demo-map.png');expect(bytes.subarray(1,4).toString()).toBe('PNG');await close();
  });
  await step('All-district view, close-up floor geometry and 1280px layout',async()=>{
    await page.getByTestId('fit-district').click();await page.waitForTimeout(1800);await shot('09-entire-district');await page.getByRole('button',{name:'Fit block',exact:true}).click();
    await inspector.getByRole('button',{name:'Floors',exact:true}).click();await inspector.getByRole('button',{name:'Explode floors',exact:true}).click();await inspector.getByRole('button',{name:'Focus selected building',exact:true}).click();await page.waitForTimeout(1700);await shot('10-exploded-shared-rooms');await page.getByRole('button',{name:'Return to full building',exact:true}).click();
    await page.setViewportSize({width:1280,height:800});await inspector.getByRole('button',{name:'Overview',exact:true}).click();await page.waitForTimeout(1000);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(1280);await shot('11-desktop-1280');
  });
  await step('Mobile inspection and document entry points remain accessible',async()=>{
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1200);await shot('12-mobile-map');
    await page.getByRole('button',{name:'Expand property details',exact:true}).click();await inspector.getByRole('button',{name:'Evidence',exact:true}).click();await inspector.getByRole('button',{name:/^Floor plans/}).click();await expect(page.locator('.rec-doc-tabs>.active')).toHaveText('Floor plan');await shot('13-mobile-document');await close();
    await inspector.getByRole('button',{name:'Open register',exact:true}).click();await page.waitForTimeout(1400);await expect(page.locator('.register-model canvas')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await shot('14-mobile-register');await close();
  });
  expect(errors).toEqual([]);
  fs.writeFileSync(`${dir}/inspection-results.json`,JSON.stringify({at:new Date().toISOString(),results,errors},null,2));console.log(JSON.stringify({passed:results.length,errors}));
}catch(error){await shot('inspection-failure').catch(()=>{});fs.writeFileSync(`${dir}/inspection-results.json`,JSON.stringify({results,errors,failure:String(error)},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
