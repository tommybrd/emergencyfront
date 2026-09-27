// Both the background timer and animation frame share one clock, so time is
// never counted twice. Small batches also keep long-tab resumes responsive.
export function simulationClock({now=()=>performance.now(),paused,advance}){
 let last=now(),debt=0;
 return {tick(at=now()){const seconds=Math.max(0,(at-last)/1000);last=Math.max(last,at);if(paused()){debt=0;return;}debt+=seconds;const step=Math.min(60,debt);debt-=step;if(step>0)advance(step);},pending:()=>debt};
}

// The automatic clock slows during calls; road motion keeps the 24-minute pace.
// Manual speed selections still scale both clock and vehicles.
export function adaptSimulationSpeed(state,seconds){
 if(state.speedMode!=='auto')return state.speed;
 const active=state.incoming?.length||state.calls.some(c=>c.status!=='closed'&&!c.noDispatch);
 const target=active?13:90;
 state.speed=target<state.speed?target:Math.min(target,state.speed+Math.max(0,seconds)*8);
 return state.speed;
}

export function vehicleTimeScale(state){return (state.speedMode==='auto'?60:state.speed)/60;}
