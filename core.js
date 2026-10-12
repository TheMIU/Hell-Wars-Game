(function(root){
 'use strict';
 const WORLD=56,N=168,CELL=WORLD/N,MATCH_SECONDS=180;
 const LEVEL_AREAS=[0,24,65,130,220,340,500,700];
 const idx=(x,z)=>z*N+x;
 const cellAt=(x,z)=>idx(Math.max(0,Math.min(N-1,Math.floor(x/CELL))),Math.max(0,Math.min(N-1,Math.floor(z/CELL))));
 const cellCenter=i=>({x:(i%N+.5)*CELL,z:(Math.floor(i/N)+.5)*CELL});
 function capture(grid,trail,id){
  const blocked=new Uint8Array(N*N),seen=new Uint8Array(N*N),queue=[];
  for(let i=0;i<grid.length;i++)blocked[i]=grid[i]===id?1:0;
  for(const i of trail)blocked[i]=1;
  function add(i){if(!blocked[i]&&!seen[i]){seen[i]=1;queue.push(i)}}
  for(let k=0;k<N;k++){add(idx(k,0));add(idx(k,N-1));add(idx(0,k));add(idx(N-1,k))}
  for(let p=0;p<queue.length;p++){const i=queue[p],x=i%N,z=Math.floor(i/N);if(x>0)add(i-1);if(x<N-1)add(i+1);if(z>0)add(i-N);if(z<N-1)add(i+N)}
  const changes=[];for(let i=0;i<grid.length;i++)if((blocked[i]||!seen[i])&&grid[i]!==id){grid[i]=id;changes.push(i)}
  return changes;
 }
 function seed(grid,id){const cornerX=Math.round((id===0?2:WORLD-7)/CELL),cornerZ=Math.round((id===0?WORLD-7:2)/CELL),size=Math.round(5/CELL);for(let z=cornerZ;z<cornerZ+size;z++)for(let x=cornerX;x<cornerX+size;x++)grid[idx(x,z)]=id}
 function respawnCell(grid,id,safe=()=>true){const target=cellAt(id===0?4.5:WORLD-4.5,id===0?WORLD-4.5:4.5);let best=-1,dist=Infinity;for(let i=0;i<grid.length;i++)if(grid[i]===id&&safe(i)){const d=(i%N-target%N)**2+(Math.floor(i/N)-Math.floor(target/N))**2;if(d<dist){dist=d;best=i}}if(best<0){seed(grid,id);return target}return best}
 function inkFailure(owner,id){return owner>=0&&owner!==id?'life':'discard'}
 function growthFor(area){let level=1;while(level<LEVEL_AREAS.length&&area>=LEVEL_AREAS[level])level++;const start=LEVEL_AREAS[level-1],next=LEVEL_AREAS[level]??null;return {level,maxInk:100+(level-1)*55,next,progress:next===null?1:Math.max(0,Math.min(1,(area-start)/(next-start)))}}
 function gainTerritory(p,cells){let count=0;for(const i of cells)if(!p.visited[i]){p.visited[i]=1;count++}p.xp+=count*CELL*CELL;const growth=growthFor(p.xp),oldMax=p.maxInk,oldLevel=p.level;p.level=growth.level;p.maxInk=growth.maxInk;p.ink=Math.min(p.maxInk,p.ink+Math.max(0,p.maxInk-oldMax));return {area:count*CELL*CELL,leveled:p.level>oldLevel}}
 function fullOwner(grid,cells){if(!cells.length)return -1;const owner=grid[cells[0]];if(owner<0)return -1;for(const i of cells)if(grid[i]!==owner)return -1;return owner}
 function beginDeath(p){if(p.protection>0||p.lives<=0||p.deathTimer>0)return false;p.lives--;p.deathTimer=.85;p.deathOrigin={x:p.x,z:p.z};p.dry=false;p.ink=0;return true}
 function stepDeath(p,dt){if(!(p.deathTimer>0))return false;p.deathTimer=Math.max(0,p.deathTimer-dt);return p.deathTimer===0}
 function awardHuman(p,npc){if(npc.rewarded)return false;npc.rewarded=true;p.bonus=(p.bonus||0)+50;p.humans=(p.humans||0)+1;return true}
 function winnerFor(players,scores){if(players[0].lives===0&&players[1].lives===0)return -1;if(players[0].lives===0)return 1;if(players[1].lives===0)return 0;return scores[0]===scores[1]?-1:scores[0]>scores[1]?0:1}
 function markTrailCell(trail,set,previous,i){const add=c=>{if(!set.has(c)){trail.push(c);set.add(c)}};if(previous!==null&&previous%N!==i%N&&Math.floor(previous/N)!==Math.floor(i/N))add(idx(i%N,Math.floor(previous/N)));add(i);return i}
 function touchesPath(x,z,path,radius=.32){const r2=radius*radius;for(let k=1;k<path.length;k++){const a=path[k-1],b=path[k],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=l2?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)):0;if((x-a.x-dx*t)**2+(z-a.z-dz*t)**2<=r2)return true}return false}
 function insideBuilding(x,z,buildings,radius=.5){return buildings.some(b=>b.active!==false&&((x-Math.max(b.minX,Math.min(b.maxX,x)))**2+(z-Math.max(b.minZ,Math.min(b.maxZ,z)))**2<radius*radius))}
 function slideBuildings(x,z,dx,dz,buildings,radius=.5){const blocked=(xx,zz)=>insideBuilding(xx,zz,buildings,radius);if(!blocked(x+dx,z+dz))return {x:x+dx,z:z+dz};if(!blocked(x+dx,z))x+=dx;if(!blocked(x,z+dz))z+=dz;return {x,z}}
 const api={N,WORLD,CELL,MATCH_SECONDS,idx,cellAt,cellCenter,capture,seed,respawnCell,inkFailure,markTrailCell,touchesPath,growthFor,gainTerritory,fullOwner,beginDeath,stepDeath,awardHuman,winnerFor,insideBuilding,slideBuildings};if(typeof module!=='undefined')module.exports=api;else root.HellCore=api;
})(globalThis);
