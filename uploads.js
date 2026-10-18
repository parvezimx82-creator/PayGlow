import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../lib/errors.js';
const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(_req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
const root=path.resolve(process.env.PRIVATE_UPLOAD_DIR||'./private-uploads');
function sniff(buf){if(buf.length>=3&&buf[0]===0xff&&buf[1]===0xd8&&buf[2]===0xff)return ['jpg','image/jpeg'];if(buf.length>=8&&buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return ['png','image/png'];if(buf.length>=12&&buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP')return ['webp','image/webp'];return null;}
router.post('/proof',requireAuth,upload.single('file'),asyncHandler(async(req,res)=>{if(!req.file)throw new HttpError(400,'Select a JPG, PNG, or WebP image (maximum 5 MB)');const type=sniff(req.file.buffer);if(!type)throw new HttpError(400,'File content is not a supported image');await fs.mkdir(root,{recursive:true,mode:0o700});const name=`${req.user.id}-${crypto.randomUUID()}.${type[0]}`;await fs.writeFile(path.join(root,name),req.file.buffer,{flag:'wx',mode:0o600});res.status(201).json({url:`/api/uploads/proof/${name}`});}));
router.get('/proof/:name',requireAuth,asyncHandler(async(req,res)=>{const name=path.basename(req.params.name);if(name!==req.params.name||!/^[0-9]+-[a-f0-9-]+\.(jpg|png|webp)$/.test(name))throw new HttpError(404,'File not found');const owner=Number(name.split('-')[0]);if(owner!==Number(req.user.id)&&req.user.role!=='admin')throw new HttpError(403,'Access denied');const file=path.join(root,name);let data;try{data=await fs.readFile(file)}catch{throw new HttpError(404,'File not found')}const type=sniff(data);if(!type)throw new HttpError(404,'File not found');res.setHeader('Content-Type',type[1]);res.setHeader('Content-Disposition','inline');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');res.send(data);}));
export default router;
