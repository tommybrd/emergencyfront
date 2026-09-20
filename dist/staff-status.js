export const staffLevel=count=>count<=3?2:count<=6?1:0;
export function staffBadge(count){const level=staffLevel(count);return `<span class="staffAvailability staffLevel${level}" role="status"><b>${count}</b><span>ÉQUIPIERS DISPONIBLES<small>${level===2?'⚠ Effectif critique':level===1?'⚠ Effectif réduit':'✓ Effectif disponible'}</small></span></span>`;}
