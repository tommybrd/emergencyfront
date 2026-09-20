// Both the background timer and animation frame share one clock, so time is
// never counted twice. Small batches also keep long-tab resumes responsive.
export function simulationClock({now=()=>performance.now(),paused,advance}){
 let last=now(),debt=0;
 return {tick(at=now()){const seconds=Math.max(0,(at-last)/1000);last=Math.max(last,at);if(paused()){debt=0;return;}debt+=seconds;const step=Math.min(60,debt);debt-=step;if(step>0)advance(step);},pending:()=>debt};
}
