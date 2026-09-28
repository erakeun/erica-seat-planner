// Run with PLAYWRIGHT_MODULE=/path/to/playwright MACH_TEST_ORIGIN=http://127.0.0.1:4177 node tests/browser-mach.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const wire=(id,extra={})=>({participantId:id,name:`가상 참석자 ${id}`,organization:'가상 검증 기관',position:'가상 긴 직책',status:'attending',replacesParticipantId:'',...extra});
const packet=(participants,revision=1)=>({schemaVersion:1,kind:'roster',eventId:'synthetic-browser-prime',eventName:'가상 브라우저 검증 행사',revision,baseRevision:revision-1,transferId:`synthetic-transfer-${revision}`,participants});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext();const page=await context.newPage();const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
 const origin=process.env.MACH_TEST_ORIGIN||'http://127.0.0.1:4177';await page.goto(origin+'/erica-seat-planner/');
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('erica-seat-planner:v1')));
 const load=async data=>{await page.locator('#mach-file-input').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.locator('#mach-dialog').waitFor({state:'visible'});};
 await load(packet([wire('a'),wire('b'),wire('c')]));assert.equal((await state()).attendees.length,0);
 await page.locator('#mach-link-confirm').check();await page.locator('#mach-all').click();await page.locator('#mach-apply').click();await page.locator('#mach-dialog').waitFor({state:'hidden'});assert.equal((await state()).attendees.length,3);
 // Real existing attendee editing UI assigns one locked and one regular seat.
 await page.locator('[data-edit-attendee="a"]').click();await page.locator('#attendee-fixed-seat').fill('MAIN-L-01');await page.locator('#attendee-locked').check();await page.locator('#save-attendee-button').click();
 await page.locator('[data-edit-attendee="b"]').click();await page.locator('#attendee-fixed-seat').fill('MAIN-L-02');await page.locator('#attendee-locked').check();await page.locator('#save-attendee-button').click();
 await page.locator('[data-filter="all"]').click();await page.locator('[data-edit-attendee="b"]').click();await page.locator('#attendee-locked').uncheck();await page.locator('#save-attendee-button').click();
 const before=await state();assert.deepEqual(before.assignments,{'MAIN-L-01':'a','MAIN-L-02':'b'});
 const changed=packet([wire('a',{position:'가상 정정 직책'}),wire('b',{status:'absent'}),wire('proxy',{replacesParticipantId:'c'}),wire('added')],2);
 await load(changed);assert.deepEqual((await state()).assignments,before.assignments);
 await page.locator('[data-mach-row="0"] [data-mach-select]').check();await page.locator('#mach-apply').click();
 const partial=await state();assert.equal(partial.attendees.find(p=>p.id==='a').title,'가상 정정 직책');assert.deepEqual(partial.assignments,before.assignments);assert.equal(partial.attendees.find(p=>p.id==='a').seatLocked,true);assert.equal(partial.attendees.find(p=>p.id==='b').status,'attending');assert.equal(partial.attendees.length,3);
 await page.locator('#mach-all').click();await page.locator('[data-mach-seat-mode]').selectOption('unassigned');await page.locator('#mach-apply').click();await page.locator('#mach-dialog').waitFor({state:'hidden'});
 const final=await state();assert.deepEqual(final.assignments,{'MAIN-L-01':'a'});assert.equal(final.attendees.find(p=>p.id==='b').status,'absent');assert.equal(final.attendees.find(p=>p.id==='c').status,'replaced');assert.equal(final.attendees.length,5);assert.equal(await page.locator('#total-count').textContent(),'3');
 await page.reload();assert.deepEqual(await state(),final);
 // Native full JSON download -> reset -> restore round-trip preserves linked metadata and geometry assignments.
 await page.locator('#data-menu-button').click();const downloaded=page.waitForEvent('download');await page.locator('[data-action="json-export"]').click();const download=await downloaded;const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);const savedFile=Buffer.concat(chunks);
 await page.locator('#new-button').click();await page.locator('#confirm-reset-button').click();assert.equal((await state()).attendees.length,0);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#json-file-input').setInputFiles({name:'synthetic-backup.json',mimeType:'application/json',buffer:savedFile});await page.waitForTimeout(100);assert.deepEqual(await state(),final);
 for(const width of [390,412]){await page.setViewportSize({width,height:844});await page.locator('#mach-show-changes').scrollIntoViewIfNeeded();assert.equal(await page.locator('#mach-show-changes').isVisible(),true);assert.equal(await page.locator('#mach-results-send').isVisible(),true);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`horizontal overflow ${width}`);}
 assert.deepEqual(errors,[]);assert.equal(requests.filter(r=>r.method!=='GET'||r.body).length,0);assert.equal(requests.some(r=>r.url.includes('가상')||r.url.includes('synthetic-browser')),false);
 console.log(JSON.stringify({result:'passed',preview:true,partial:true,locks:true,absence:true,replacement:true,addition:true,reload:true,fileResetRestore:true,mobile:[390,412],pageErrors:errors.length,nonGetRequests:0,externalRequests:requests.filter(r=>!r.url.startsWith(origin)).length}));await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
