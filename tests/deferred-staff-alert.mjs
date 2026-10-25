import assert from 'node:assert/strict';
import {createDeferredStaffAlert,STAFF_ALERT_DELAY} from '../dist/deferred-staff-alert.js';
let now=0;const delivered=[],alerts=createDeferredStaffAlert({now:()=>now,deliver:a=>delivered.push(a)});
alerts.queue({message:'2 disponibles'});alerts.tick();assert.equal(delivered.length,0);now=STAFF_ALERT_DELAY-1;alerts.tick();assert.equal(delivered.length,0);
alerts.postpone();now+=STAFF_ALERT_DELAY-1;alerts.tick();assert.equal(delivered.length,0,'Last dispatch restarts the quiet interval');
alerts.queue({message:'1 disponible'});now+=STAFF_ALERT_DELAY;alerts.tick();assert.equal(delivered.length,1);assert.equal(delivered[0].message,'1 disponible','Only the latest staffing alert is delivered');alerts.tick();assert.equal(delivered.length,1);
alerts.queue({message:'obsolete'});alerts.clear();now+=STAFF_ALERT_DELAY;alerts.tick();assert.equal(delivered.length,1);
console.log('PASS real-time delayed staffing alert, quiet interval after dispatch, latest count, single delivery and cancellation');
