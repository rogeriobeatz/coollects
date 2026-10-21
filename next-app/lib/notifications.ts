/** When the collector last opened Notifications, kept on this device only. */
const KEY='coollects-activity-seen'
export const ACTIVITY_SEEN_EVENT='coollects-activity-seen'

export function hasUnread(latest:string|null|undefined,seen:string|null|undefined){
 if(!latest)return false
 const latestTime=Date.parse(latest)
 if(!Number.isFinite(latestTime))return false
 const seenTime=seen?Date.parse(seen):Number.NaN
 return !Number.isFinite(seenTime)||latestTime>seenTime
}

export function lastSeenActivity(userId:string):string|null{
 try{return localStorage.getItem(KEY+':'+userId)}catch{return null}
}

export function markActivitySeen(userId:string,at:string){
 if(!Number.isFinite(Date.parse(at)))return
 const previous=lastSeenActivity(userId)
 if(previous&&!hasUnread(at,previous))return
 try{localStorage.setItem(KEY+':'+userId,at)}catch{/* Private mode: the dot simply returns next visit. */}
 try{window.dispatchEvent(new CustomEvent(ACTIVITY_SEEN_EVENT,{detail:userId}))}catch{/* no window */}
}
