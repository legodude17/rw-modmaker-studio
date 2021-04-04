/* eslint-disable */
import { promises as fs } from 'fs';
import path from 'path';

const allFilesRecusive=z=>fs.readdir(z).then(y=>y.reduce((p,f,x)=>p.then(async a=>a.concat(await((await fs.stat(x=path.join(z,f))).isDirectory()?allFilesRecusive(x):x))),(async()=>[])()))


const allFilesRecusive4=((I=z=>fs.readdir(z).then(y=>y.reduce((p,f,x)=>p.then(async a=>a.concat(await((await fs.stat(x=path.join(z,f))).isDirectory()?I(x):x))),(async()=>[])())))=>I)()


const allFilesRecusive2=z=>fs.readdir(z).then(y=>y.reduce((p,f,x)=>p.then(a=>fs.stat(x=path.join(z,f)).then(s=>s.isDirectory()?allFilesRecusive(x):x).then(b=>a.concat(b))),(async()=>[])()))


const allFilesRecusive3=((I=z=>fs.readdir(z,{withFileTypes:1}).then(y=>y.reduce((p,f)=>p.then(async a=>a.concat(await(f.isDirectory(f=z+'/'+f.name)?I(f):f))),(async()=>[])())))=>I)()


const walk_dir_rec=((I=f=>fs.readdir(f,{withFileTypes:1}).then(D=>Promise.all(D.map(d=>d.isDirectory(D=f+'/'+d.name)?I(D):D))).then(q=>q.flat()))=>I)()


allFilesRecusive(path.join(process.cwd(), 'src'))
  .then(console.log)
  .catch(console.error);

allFilesRecusive2(path.join(process.cwd(), 'src'))
    .then(console.log)
    .catch(console.error);

allFilesRecusive3(path.join(process.cwd(), 'src'))
    .then(console.log)
    .catch(console.error);

allFilesRecusive4(path.join(process.cwd(), 'src'))
    .then(console.log)
    .catch(console.error);

walk_dir_rec(path.join(process.cwd(), 'src'))
    .then(console.log)
    .catch(console.error);
