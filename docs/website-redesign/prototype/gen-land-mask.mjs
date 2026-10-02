import fs from 'fs';
import {feature} from 'topojson-client';
import {geoContains} from 'd3-geo';
const topo=JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json','utf8'));
const land=feature(topo,topo.objects.land);
const W=360,H=180;const bytes=new Uint8Array(Math.ceil(W*H/8));
let on=0;
for(let j=0;j<H;j++)for(let i=0;i<W;i++){
  const lon=-180+i+.5,lat=90-j-.5;
  if(geoContains(land,[lon,lat])){const b=j*W+i;bytes[b>>3]|=1<<(b&7);on++}
}
fs.writeFileSync('mask.b64',Buffer.from(bytes).toString('base64'));
console.log('land cells',on,'of',W*H,'b64 len',Buffer.from(bytes).toString('base64').length);
