import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';

async function loadTheme(){
  try{
    const cached = JSON.parse(localStorage.getItem('pg_theme')||'{}');
    const remote = await (await fetch(API+'/settings/theme')).json();
    const t = {...cached, ...remote};
    localStorage.setItem('pg_theme', JSON.stringify(t));
    const r = document.documentElement.style;
    r.setProperty('--pg-primary', t.primaryColor||'#0e9f6e');
    r.setProperty('--pg-secondary', t.secondaryColor||'#0d9488');
    r.setProperty('--pg-grad', `linear-gradient(${t.gradientDirection||135}deg, ${t.gradientStart||'#0e9f6e'}, ${t.gradientEnd||'#0d9488'})`);
  }catch(e){}
}

/* ================= ICONS (Lucide-style inline SVG) ================= */
const I = (d, extra='') => (p) => (
  <svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.c||''} {...(extra?{...{[extra]:true}}:{})}>{d}</svg>
);
const ic = {
  home: I(<><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></>),
  grid: I(<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>),
  wallet: I(<><path d="M3 7a2 2 0 0 1 2-2h13v3"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="17" cy="14" r="1.2" fill="currentColor" stroke="none"/></>),
  plus: I(<path d="M12 5v14M5 12h14"/>),
  minus: I(<path d="M5 12h14"/>),
  history: I(<><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/></>),
  user: I(<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/></>),
  bell: I(<><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></>),
  menu: I(<path d="M4 6h16M4 12h16M4 18h16"/>),
  x: I(<path d="M6 6l12 12M18 6 6 18"/>),
  chevL: I(<path d="M15 5l-7 7 7 7"/>),
  chevR: I(<path d="M9 5l7 7-7 7"/>),
  users: I(<><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 4-5 6.5-5s5.5 1.5 6.5 5"/><path d="M16 5a3.5 3.5 0 0 1 0 6.5M18.5 15.5c1.5.8 2.7 2.2 3 4.5"/></>),
  gift: I(<><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8c-2 0-4.5-1-4.5-3S10 2.5 12 8c2-5.5 4.5-5 4.5-3S14 8 12 8z"/></>),
  trophy: I(<><path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 5H4a4 4 0 0 0 4 5M16 5h4a4 4 0 0 1-4 5M12 14v3M8 21h8M10 17h4"/></>),
  target: I(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></>),
  gem: I(<><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9.5 3 8 9l4 12M14.5 3 16 9l-4 12"/></>),
  headset: I(<><path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="2"/><rect x="17" y="13" width="4" height="6" rx="2"/><path d="M20 19a3 3 0 0 1-3 3h-3"/></>),
  shield: I(<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/></>),
  logout: I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>),
  mail: I(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>),
  megaphone: I(<><path d="M3 11v3a1 1 0 0 0 1 1h2l4 5V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M14 8a4 4 0 0 1 0 8M17 5a8 8 0 0 1 0 14"/></>),
  briefcase: I(<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></>),
  type: I(<path d="M5 7V4h14v3M12 4v16M9 20h6"/>),
  percent: I(<><path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></>),
  cart: I(<><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.5 12h11L21 8H7"/></>),
  share: I(<><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4M8 13l8 4"/></>),
  card: I(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>),
  check: I(<path d="M4 12.5 10 18 20 6"/>),
  clock: I(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  zap: I(<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>),
  clip: I(<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 6 0M9 10h6M9 14h6"/></>),
  msg: I(<><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/></>),
  gear: I(<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></>),
  edit: I(<><path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/></>),
  trash: I(<><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></>),
  eye: I(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  copy: I(<><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
  search: I(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>),
  play: I(<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>),
  send: I(<path d="M22 2 11 13M22 2 15 22l-4-9-9-4z"/>),
  fb: (p)=>(<svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="#1877F2"><path d="M13.5 21v-7h2.6l.4-3h-3V9.1c0-.9.3-1.6 1.7-1.6h1.4V4.8c-.6-.1-1.5-.2-2.4-.2-2.4 0-4 1.5-4 4.2V11H7.5v3H11v7z"/></svg>),
  ig: (p)=>(<svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75"/><stop offset=".5" stopColor="#d62976"/><stop offset="1" stopColor="#962fbf"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#igg)" strokeWidth="2"/><circle cx="12" cy="12" r="4.2" stroke="url(#igg)" strokeWidth="2"/><circle cx="17.3" cy="6.7" r="1.3" fill="#d62976"/></svg>),
  yt: (p)=>(<svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="#FF0000"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.4 12 31 31 0 0 0 22 8.2zM10 15V9l5.2 3z"/></svg>),
  tg: (p)=>(<svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="#229ED9"><path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.7L18 6.9c.4-.3-.1-.5-.6-.2L7.6 13l-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1 2.2z"/></svg>),
};

/* ================= I18N ================= */
const T = {
  bn: {
    home:'হোম', dash:'আমার ড্যাশবোর্ড', tasks:'সব টাস্ক', gmailTask:'Gmail Task', fbTask:'Facebook Task', igTask:'Instagram Task',
    adsView:'Ads View', microJob:'Micro Job', jobPost:'Job Post', refer:'Refer & Earn', target:'টার্গেট', leadership:'লিডারবোর্ড',
    membership:'মেম্বারশিপ', dailyBonus:'ডেইলি বোনাস', typing:'টাইপিং জবস', driveOffer:'ড্রাইভ অফার', shopping:'শপিং', smm:'SMM সার্ভিস',
    wallet:'আমার ওয়ালেট', deposit:'ডিপোজিট', withdraw:'উইথড্র', txHistory:'লেনদেনের ইতিহাস', notifications:'নোটিফিকেশন',
    profile:'প্রোফাইল ও সেটিংস', security:'সিকিউরিটি সেটিংস', support:'কাস্টমার সাপোর্ট', admin:'অ্যাডমিন প্যানেল', logout:'লগ আউট',
    balance:'ব্যালেন্স', startNow:'এখনই শুরু করুন', bannerT:'ছোট কাজ করুন, বড় আয় করুন!', bannerS:'প্রতিদিন নতুন টাস্ক, আকর্ষণীয় পুরস্কার',
    guide:'PayGlow ব্যবহার নির্দেশিকা', guideS:'কীভাবে কাজ করবেন ও আয় করবেন', services:'Our Services', seeAll:'সব দেখুন',
    custSupport:'Customer Support', custS:'কোনো সমস্যা? আমরা আছি আপনার সাথে', recent:'সাম্প্রতিক কার্যকলাপ',
    available:'উপলব্ধ', reward:'পুরস্কার', submit:'জমা দিন', cancel:'বাতিল', back:'ফিরে যান', submitTask:'কাজ জমা দিন',
    mySub:'আমার সাবমিশন', pending:'Pending', processing:'Processing', completed:'Completed', rejected:'Rejected',
    login:'লগইন', register:'রেজিস্টার', fullName:'পুরো নাম', username:'ইউজারনেম', email:'ইমেইল', whatsapp:'হোয়াটসঅ্যাপ নম্বর',
    password:'পাসওয়ার্ড', haveAcc:'অ্যাকাউন্ট আছে? লগইন', noAcc:'নতুন? রেজিস্টার', refCode:'রেফারেল কোড (ঐচ্ছিক)',
    copy:'কপি করুন', copied:'কপি হয়েছে!', sendReq:'রিকোয়েস্ট পাঠান', amount:'পরিমাণ', method:'মেথড', fee:'ফি', totalPay:'মোট পাঠাতে হবে',
    senderNo:'প্রেরকের নম্বর/ঠিকানা', txnId:'Transaction ID', phoneNo:'ফোন নম্বর', dest:'গন্তব্য নম্বর/ঠিকানা',
    notEnough:'পর্যাপ্ত ব্যালেন্স নেই', allTx:'সব লেনদেন', faq:'সাধারণ প্রশ্ন', contactSupport:'সাপোর্টে যোগাযোগ',
    level:'Level', tasksDone:'সম্পন্ন কাজ', totalEarn:'মোট আয়', approveOnce:'একবারই অনুমোদন হবে',
    instructions:'নির্দেশনা', deadline:'সময়সীমা', eligibility:'যোগ্যতা', search:'খুঁজুন...', noTasks:'এই মুহূর্তে কোনো টাস্ক নেই',
    step1:'ধাপ ১', step2:'ধাপ ২', step3:'ধাপ ৩', uidPh:'১৪–১৬ সংখ্যার Facebook UID লিখুন', cookiePh:'Cookies string পেস্ট করুন',
    keyPh:'2FA Secret Key লিখুন', genCode:'কোড তৈরি হচ্ছে...', yourCode:'আপনার কোড', doneAcc:'অ্যাকাউন্ট খোলা শেষ',
    wrongUid:'ভুল UID! ১৪–১৬ সংখ্যা হতে হবে', wrongCookie:'ভুল Cookies! c_user বা datr থাকতে হবে', wrongKey:'ভুল 2FA Key!',
    welcome:'স্বাগতম', myRefLink:'আপনার রেফারেল লিংক', refCount:'রেফারেল', refEarn:'রেফারেল আয়', howRef:'রেফার করে ইনকাম করুন',
    save:'সেভ করুন', saved:'সেভ হয়েছে!', themeSet:'থিম সেটিংস', primary:'Primary রং', secondary:'Secondary রং',
    gStart:'গ্রেডিয়েন্ট শুরু', gEnd:'গ্রেডিয়েন্ট শেষ', gDir:'গ্রেডিয়েন্ট দিক (ডিগ্রি)', preview:'লাইভ প্রিভিউ', reset:'ডিফল্ট করুন',
    dashboard:'ড্যাশবোর্ড', submissions:'সাবমিশনস', deposits:'ডিপোজিট রিকোয়েস্ট', withdrawals:'উইথড্র রিকোয়েস্ট', users:'ইউজারস',
    categories:'ক্যাটাগরি', newTask:'নতুন টাস্ক', review:'রিভিউ', reason:'কারণ', approve:'অনুমোদন', reject:'বাতিল',
    loading:'লোড হচ্ছে...', empty:'কিছু নেই', notePh:'প্রমাণ / নোট লিখুন', note:'নোট', status:'স্ট্যাটাস', date:'তারিখ',
    walletShort:'ওয়ালেট', historyShort:'ইতিহাস', profileShort:'প্রোফাইল', tasksShort:'টাস্ক', depositFeeNote:'ডিপোজিট ফি',
    min:'সর্বনিম্ন', max:'সর্বোচ্চ', depositNote:'যাচাই হওয়ার আগে ডিপোজিট Pending/Processing থাকবে', allRights:'সর্বস্বত্ব সংরক্ষিত',
    coming:'শীঘ্রই আসছে — ব্যাকএন্ড সেটআপ প্রয়োজন', announcements:'ঘোষণা', memberPlans:'মেম্বারশিপ প্ল্যান', currentLvl:'বর্তমান লেভেল',
    secChangePass:'পাসওয়ার্ড পরিবর্তন', session:'সেশন', language:'ভাষা', change:'পরিবর্তন', notify:'নোটিফিকেশন',
  },
  en: {
    home:'Home', dash:'My Dashboard', tasks:'All Tasks', gmailTask:'Gmail Task', fbTask:'Facebook Task', igTask:'Instagram Task',
    adsView:'Ads View', microJob:'Micro Job', jobPost:'Job Post', refer:'Refer & Earn', target:'Target', leadership:'Leadership',
    membership:'Membership', dailyBonus:'Daily Bonus', typing:'Typing Jobs', driveOffer:'Drive Offer', shopping:'Shopping', smm:'SMM Service',
    wallet:'My Wallet', deposit:'Deposit', withdraw:'Withdraw', txHistory:'Transaction History', notifications:'Notifications',
    profile:'Profile & Settings', security:'Security Settings', support:'Customer Support', admin:'Admin Panel', logout:'Logout',
    balance:'Balance', startNow:'Start Now', bannerT:'Do small tasks, earn big!', bannerS:'New tasks daily, attractive rewards',
    guide:'PayGlow User Guide', guideS:'How to work and earn', services:'Our Services', seeAll:'See all',
    custSupport:'Customer Support', custS:'Any problem? We are with you', recent:'Recent Activity',
    available:'Available', reward:'Reward', submit:'Submit', cancel:'Cancel', back:'Back', submitTask:'Submit Task',
    mySub:'My Submissions', pending:'Pending', processing:'Processing', completed:'Completed', rejected:'Rejected',
    login:'Login', register:'Register', fullName:'Full name', username:'Username', email:'Email', whatsapp:'WhatsApp number',
    password:'Password', haveAcc:'Have account? Login', noAcc:'New? Register', refCode:'Referral code (optional)',
    copy:'Copy', copied:'Copied!', sendReq:'Send Request', amount:'Amount', method:'Method', fee:'Fee', totalPay:'Total to pay',
    senderNo:'Sender number/address', txnId:'Transaction ID', phoneNo:'Phone number', dest:'Destination number/address',
    notEnough:'Insufficient balance', allTx:'All Transactions', faq:'FAQ', contactSupport:'Contact support',
    level:'Level', tasksDone:'Tasks done', totalEarn:'Total earned', approveOnce:'Approved exactly once',
    instructions:'Instructions', deadline:'Deadline', eligibility:'Eligibility', search:'Search...', noTasks:'No tasks available right now',
    step1:'Step 1', step2:'Step 2', step3:'Step 3', uidPh:'Enter 14-16 digit Facebook UID', cookiePh:'Paste cookies string',
    keyPh:'Enter 2FA Secret Key', genCode:'Generating code...', yourCode:'Your code', doneAcc:'Account creation done',
    wrongUid:'Wrong UID! Must be 14-16 digits', wrongCookie:'Wrong cookies! Must contain c_user or datr', wrongKey:'Invalid 2FA key!',
    welcome:'Welcome', myRefLink:'Your referral link', refCount:'Referrals', refEarn:'Referral earnings', howRef:'Earn by referring',
    save:'Save', saved:'Saved!', themeSet:'Theme Settings', primary:'Primary color', secondary:'Secondary color',
    gStart:'Gradient start', gEnd:'Gradient end', gDir:'Gradient direction (deg)', preview:'Live Preview', reset:'Reset',
    dashboard:'Dashboard', submissions:'Submissions', deposits:'Deposit Requests', withdrawals:'Withdrawal Requests', users:'Users',
    categories:'Categories', newTask:'New Task', review:'Review', reason:'Reason', approve:'Approve', reject:'Reject',
    loading:'Loading...', empty:'Nothing here', notePh:'Write proof / note', note:'Note', status:'Status', date:'Date',
    walletShort:'Wallet', historyShort:'History', profileShort:'Profile', tasksShort:'Tasks', depositFeeNote:'Deposit fee',
    min:'Minimum', max:'Maximum', depositNote:'Deposit stays Pending/Processing until verified', allRights:'All rights reserved',
    coming:'Coming soon — backend setup required', announcements:'Announcements', memberPlans:'Membership Plans', currentLvl:'Current level',
    secChangePass:'Change password', session:'Session', language:'Language', change:'Change', notify:'Notifications',
  }
};

/* ================= HELPERS ================= */
const money = (v, lang) => (lang==='bn'?'৳':'$') + Number(v||0).toLocaleString(lang==='bn'?'bn-BD':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const stColor = s => ({pending:'#f59e0b',processing:'#3b82f6',approved:'#16a34a',completed:'#16a34a',rejected:'#dc2626',active:'#16a34a',paused:'#f59e0b',closed:'#6b7280'}[s]||'#6b7280');
const stTxt = (s,t)=> ({pending:t.pending,processing:t.processing,approved:t.completed,completed:t.completed,rejected:t.rejected,active:'Active',paused:'Paused',closed:'Closed'}[s]||s);

function useApi(token){
  return async (path, {method='GET', body, form}={}) => {
    const res = await fetch(API+path, {
      method,
      headers: { ...(body?{'Content-Type':'application/json'}:{}), ...(token?{Authorization:'Bearer '+token}:{}) },
      body: form?form:(body?JSON.stringify(body):undefined),
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message||('HTTP '+res.status));
    return data;
  };
}

/* ================= AUTH ================= */
function Auth({onOk}){
  const [mode,setMode]=useState('login');
  const [f,setF]=useState({fullName:'',username:'',email:'',whatsapp:'',password:'',referralCode:'',login:''});
  const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const go=async e=>{
    e.preventDefault(); setErr(''); setBusy(true);
    try{
      const r = mode==='login'
        ? await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:f.login,password:f.password})})
        : await fetch(API+'/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName:f.fullName,username:f.username,email:f.email,whatsapp:f.whatsapp,password:f.password,referralCode:f.referralCode})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.message||'Failed');
      onOk(d.token||d.accessToken||d);
    }catch(e){ setErr(e.message); } finally{ setBusy(false); }
  };
  return <div className="auth-wrap">
    <div className="auth-art">
      <div className="auth-logo">🍃 <b>PayGlow</b></div>
      <p>Earn · Grow · Shine</p>
    </div>
    <form className="card auth-card" onSubmit={go}>
      <h2>{mode==='login'?'PayGlow Login':'Create Account'}</h2>
      {mode==='register'&&<><input required placeholder="Full name" value={f.fullName} onChange={set('fullName')}/>
        <input required placeholder="Username (a-z 0-9 _)" value={f.username} onChange={set('username')}/>
        <input required type="email" placeholder="Email" value={f.email} onChange={set('email')}/>
        <input required placeholder="WhatsApp number" value={f.whatsapp} onChange={set('whatsapp')}/>
        <input placeholder="Referral code (optional)" value={f.referralCode} onChange={set('referralCode')}/></>}
      {mode==='login'&&<input required placeholder="Username or email" value={f.login} onChange={set('login')}/>}
      <input required type="password" placeholder="Password" value={f.password} onChange={set('password')}/>
      {err&&<div className="err">{err}</div>}
      <button className="btn grad" disabled={busy}>{busy?'...':(mode==='login'?'Login':'Register')}</button>
      <button type="button" className="link" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'New here? Register':'Have an account? Login'}</button>
    </form>
  </div>;
}

/* ================= SHARED BITS ================= */
function Badge({s,t}){ return <span className="badge" style={{background:stColor(s)+'1a',color:stColor(s)}}>{stTxt(s,t)}</span>; }
function PageHead({t,icon,onBack,right}){
  return <div className="phead">
    <button className="icobtn" onClick={onBack} aria-label="back">{ic.chevL({})}</button>
    <div className="phead-t">{icon}<h2>{t}</h2></div>{right}
  </div>;
}
function Stat({icon,label,val,color}){ return <div className="stat card"><span className="stat-ic" style={{background:color+'18',color}}>{icon}</span><div><b>{val}</b><small>{label}</small></div></div>; }

/* ================= HOME ================= */
const SERVICES = [
  {k:'gmail', icon:()=>ic.mail({}), t:'gmailTask', c:'#ea4335', page:'tasks', cat:'Gmail'},
  {k:'fb', icon:()=>ic.fb({}), t:'fbTask', c:'#1877F2', page:'tasks', cat:'Facebook'},
  {k:'ig', icon:()=>ic.ig({}), t:'igTask', c:'#d62976', page:'tasks', cat:'Instagram'},
  {k:'ads', icon:()=>ic.megaphone({}), t:'adsView', c:'#0d9488'},
  {k:'micro', icon:()=>ic.briefcase({}), t:'microJob', c:'#16a34a'},
  {k:'job', icon:()=>ic.clip({}), t:'jobPost', c:'#0e9f6e'},
  {k:'refer', icon:()=>ic.users({}), t:'refer', c:'#2563eb', page:'referral'},
  {k:'target', icon:()=>ic.target({}), t:'target', c:'#16a34a'},
  {k:'lead', icon:()=>ic.trophy({}), t:'leadership', c:'#d97706', page:'leaderboard'},
  {k:'member', icon:()=>ic.gem({}), t:'membership', c:'#0d9488', page:'membership'},
  {k:'bonus', icon:()=>ic.gift({}), t:'dailyBonus', c:'#d97706'},
  {k:'type', icon:()=>ic.type({}), t:'typing', c:'#2563eb'},
  {k:'drive', icon:()=>ic.percent({}), t:'driveOffer', c:'#16a34a'},
  {k:'shop', icon:()=>ic.cart({}), t:'shopping', c:'#0e9f6e'},
  {k:'smm', icon:()=>ic.share({}), t:'smm', c:'#d62976'},
  {k:'wallet', icon:()=>ic.wallet({}), t:'wallet', c:'#0e9f6e', page:'wallet'},
  {k:'dep', icon:()=>ic.card({}), t:'deposit', c:'#2563eb', page:'deposit'},
  {k:'wd', icon:()=>ic.minus({}), t:'withdraw', c:'#dc2626', page:'withdraw'},
];

function Home({go, user, t, lang, stats}){
  const balance = stats?.wallet?.main_balance ?? user?.balance ?? 0;
  return <div className="page">
    <div className="hero-banner">
      <div>
        <h3>{t.bannerT}</h3>
        <p>{t.bannerS}</p>
        <button className="btn pill" onClick={()=>go('tasks')}>{t.startNow} →</button>
      </div>
      <span className="hero-gift">🎁</span>
    </div>

    <div className="card bal-card" onClick={()=>go('wallet')}>
      <span className="bal-ic">{ic.wallet({s:26})}</span>
      <div className="grow"><small>My Balance / {t.balance}</small><b>{money(balance, lang)}</b></div>
      {ic.chevR({})}
    </div>

    <div className="row2">
      <a className="card soc tg" href="https://t.me/" target="_blank" rel="noreferrer">{ic.tg({s:26})}<b>Telegram</b></a>
      <a className="card soc yt" href="https://youtube.com/" target="_blank" rel="noreferrer">{ic.yt({s:26})}<b>YouTube</b></a>
    </div>

    <div className="card guide" onClick={()=>go('support')}>
      <span className="g-ic">{ic.clip({s:24})}</span>
      <div className="grow"><b>{t.guide}</b><small>{t.guideS}</small></div>
      {ic.chevR({})}
    </div>

    <div className="sec-head"><h3>▎{t.services}</h3><button className="link" onClick={()=>go('tasks')}>{t.seeAll} →</button></div>
    <div className="svc-grid">
      {SERVICES.map(s=><button key={s.k} className="svc card" onClick={()=>s.page?go(s.page,s.cat?s.cat:undefined):(s.cat?go('tasks',s.cat):go('soon',s.t))}>
        <span className="svc-ic" style={{background:s.c+'16',color:s.c}}>{s.icon()}</span>
        <small>{t[s.t]}</small>
      </button>)}
    </div>

    <div className="card sup-card" onClick={()=>go('support')}>
      <span className="sup-ic">{ic.headset({s:22})}</span>
      <div className="grow"><b>{t.custSupport}</b><small>{t.custS}</small></div>
      {ic.chevR({})}
    </div>
  </div>;
}

/* ================= TASKS LIST ================= */
function catKind(name){
  const n=(name||'').toLowerCase();
  if(n.includes('fb')||n.includes('facebook')) return 'facebook';
  if(n.includes('ig')||n.includes('insta')) return 'instagram';
  if(n.includes('gmail')) return 'gmail';
  return 'other';
}
function catIcon(kind){
  if(kind==='facebook') return <span style={{color:'#1877F2'}}>{ic.fb({s:22})}</span>;
  if(kind==='instagram') return <span>{ic.ig({s:22})}</span>;
  if(kind==='gmail') return <span style={{color:'#ea4335'}}>{ic.mail({s:22})}</span>;
  return <span style={{color:'var(--pg-primary)'}}>{ic.zap({s:22})}</span>;
}

function Tasks({api, go, t, lang, filterCat}){
  const [list,setList]=useState(null); const [q,setQ]=useState('');
  useEffect(()=>{ api('/tasks').then(d=>setList(d.tasks||d)).catch(()=>setList([])); },[]);
  const items=useMemo(()=> (list||[]).filter(x=>!filterCat||((x.category_name||x.category||'')+' '+(x.title_en||'')).toLowerCase().includes(filterCat.toLowerCase())).filter(x=>!q||((x.title_en||'')+(x.title_bn||'')).toLowerCase().includes(q.toLowerCase())),[list,q,filterCat]);
  return <div className="page">
    <div className="search card"><span>{ic.search({s:18})}</span><input placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)}/></div>
    {!list&&<p className="muted">{t.loading}</p>}
    {list&&!items.length&&<div className="empty card">{t.noTasks}</div>}
    <div className="task-list">
      {items.map(x=>{ const k=catKind(x.category_name||x.category);
        return <button key={x.id} className="card taskrow" onClick={()=>go('task',x.id)}>
          <span className="svc-ic">{catIcon(k)}</span>
          <div className="grow">
            <b>{lang==='bn'?(x.title_bn||x.title_en):x.title_en}</b>
            <small>{x.category_name||x.category||''} · {t.available} {x.remaining??''}</small>
          </div>
          <span className="reward">{money(x.reward_amount,lang)}</span>
          {ic.chevR({})}
        </button>;})}
    </div>
  </div>;
}

/* ================= TASK DETAIL (ধাপ ধাপ — FB/IG/Gmail) ================= */
function TaskDetail({api, id, go, t, lang}){
  const [task,setTask]=useState(null); const [step,setStep]=useState(0);
  const [uid,setUid]=useState(''); const [ck,setCk]=useState(''); const [key,setKey]=useState('');
  const [code,setCode]=useState(null); const [note,setNote]=useState('');
  const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false); const [subs,setSubs]=useState([]);
  const kind = catKind(task?.category_name||task?.category);
  const load=()=>{ api('/tasks/'+id).then(d=>setTask(d.task||d)).catch(e=>setMsg(e.message)); api('/user/submissions').then(d=>setSubs(Array.isArray(d)?d:[])).catch(()=>{}); };
  useEffect(load,[id]);

  if(!task) return <div className="page"><p className="muted">{t.loading}</p></div>;
  const finish=async ()=>{
    setBusy(true); setMsg('');
    try{
      const proof = kind==='facebook' ? `UID: ${uid}\nCookies: ${ck}` : kind==='instagram' ? `2FA Key: ${key}` : note;
      await api('/tasks/'+id+'/submit',{method:'POST',body:{note:proof}});
      setMsg('✅ '+t.saved); setStep(9);
    }catch(e){ setMsg('⚠️ '+e.message); } finally{ setBusy(false); }
  };
  const genCode=async ()=>{
    const k=key.replace(/\s+/g,'').toUpperCase();
    if(!/^[A-Z2-7]{16,64}$/.test(k)){ setMsg('⚠️ '+t.wrongKey); return; }
    setMsg(''); setCode(t.genCode);
    try{ const d=await api('/tasks/totp?key='+encodeURIComponent(k)); setCode(d.code); setStep(2); }
    catch(e){ setCode(null); setMsg('⚠️ '+e.message); }
  };
  const dataCard = <div className="card datacard">
      <h4>📋 {t.instructions}</h4>
      <p className="prewrap">{task.instructions || task.description || task.title_en}</p>
      {task.required_link&&<a className="link" href={task.required_link} target="_blank" rel="noreferrer">{task.required_link}</a>}
      <div className="datarow"><span>💰 {t.reward}</span><b>{money(task.reward_amount,lang)}</b></div>
      <div className="datarow"><span>⏳ {t.deadline}</span><b>{task.ends_at?new Date(task.ends_at).toLocaleString():'—'}</b></div>
    </div>;

  return <div className="page">
    <PageHead t={(lang==='bn'?(task.title_bn||task.title_en):task.title_en)} icon={catIcon(kind)} onBack={()=>go('tasks')}/>
    {dataCard}
    {msg&&<div className="notice">{msg}</div>}

    {step===0&&<div className="steps">
      {kind==='facebook'&&<div className="card">
        <h4>{t.step1} — Facebook UID</h4>
        <input value={uid} onChange={e=>setUid(e.target.value)} placeholder={t.uidPh}/>
        <button className="btn grad" onClick={()=>{ if(!/\b\d{14,16}\b/.test(uid)){setMsg('⚠️ '+t.wrongUid);return;} setMsg(''); setStep(1);} }>{t.step2} →</button>
      </div>}
      {kind==='instagram'&&<div className="card">
        <h4>{t.step1} — 2FA Set</h4>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder={t.keyPh}/>
        <button className="btn grad" onClick={genCode}>{t.yourCode} →</button>
      </div>}
      {kind!=='facebook'&&kind!=='instagram'&&<div className="card">
        <h4>{t.submitTask}</h4>
        <textarea rows="3" value={note} onChange={e=>setNote(e.target.value)} placeholder={t.notePh}/>
        <button className="btn grad" disabled={busy} onClick={finish}>{t.submit}</button>
      </div>}
    </div>}

    {kind==='facebook'&&step===1&&<div className="card">
      <h4>{t.step2} — Cookies</h4>
      <textarea rows="3" value={ck} onChange={e=>setCk(e.target.value)} placeholder={t.cookiePh}/>
      <button className="btn grad" disabled={busy} onClick={()=>{ if(!/c_user|datr/.test(ck)){setMsg('⚠️ '+t.wrongCookie);return;} setMsg(''); finish(); }}>{t.submit}</button>
    </div>}

    {kind==='instagram'&&step===2&&<div className="card center">
      <h4>{t.yourCode}</h4>
      {code&&code.length===6?<>
        <div className="otp">{code}</div>
        <button className="btn" onClick={()=>{navigator.clipboard?.writeText(code); setMsg('✅ '+t.copied);}}>{ic.copy({})} {t.copy}</button>
      </>:<p className="muted">{code||t.genCode}</p>}
      <button className="btn grad" disabled={busy} onClick={finish}>{t.doneAcc} → {t.submit}</button>
    </div>}

    {step===9&&<div className="card center"><span style={{color:'#16a34a'}}>{ic.check({s:40})}</span><h3>{t.saved}</h3><Badge s="pending" t={t}/></div>}

    {!!subs?.length&&<><h3 className="mt">▎{t.mySub}</h3>{subs.map(s=><div key={s.id||Math.random()} className="card taskrow"><div className="grow"><b>#{s.task_id}</b><small>{new Date(s.created_at||Date.now()).toLocaleString()}</small></div><Badge s={s.status} t={t}/></div>)}</>}
  </div>;
}

/* ================= WALLET / DEPOSIT / WITHDRAW / HISTORY ================= */
function Wallet({stats, t, lang, go}){
  const w=stats?.wallet||{};
  return <div className="page">
    <div className="card bal-big">
      <small>{t.balance}</small><h2>{money(w.main_balance,lang)}</h2>
      <div className="wrow"><span>💼 {t.pending} / Hold</span><b>{money(w.pending_cashout,lang)}</b></div>
      <div className="wrow"><span>🎁 {t.refEarn}</span><b>{money(w.referral_earnings,lang)}</b></div>
    </div>
    <div className="row2">
      <button className="btn grad" onClick={()=>go('deposit')}>＋ {t.deposit}</button>
      <button className="btn danger" onClick={()=>go('withdraw')}>－ {t.withdraw}</button>
    </div>
  </div>;
}

const DEP_METHODS=[
  {k:'bkash', n:'bKash', icon:'📱', ins:'Personal/Send Money করুন → TxID দিন'},
  {k:'nagad', n:'Nagad', icon:'📱', ins:'Send Money করুন → TxID দিন'},
  {k:'rocket', n:'Rocket', icon:'🚀', ins:'Send Money করুন → TxID দিন'},
  {k:'usdt', n:'USDT (BEP-20)', icon:'🪙', ins:'BSC/BEP20 নেটওয়ার্কে পাঠান → TxHash দিন'},
  {k:'bitcoin', n:'Bitcoin', icon:'₿', ins:'Bitcoin Mainnet-এ পাঠান → TxHash দিন'},
];
function Deposit({api, t, lang, notify}){
  const [m,setM]=useState('bkash'); const [amt,setAmt]=useState(''); const [sender,setSender]=useState(''); const [txn,setTxn]=useState('');
  const [quote,setQuote]=useState(null); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
  useEffect(()=>{ setQuote(null);
    const a=parseFloat(amt); if(a>0) api(`/deposits/quote?amount=${a}&method=${m}`).then(setQuote).catch(()=>setQuote(null));
  },[amt,m]);
  const sub=async()=>{
    setBusy(true); setMsg('');
    try{
      await api('/deposits',{method:'POST',body:{method:m,amount:parseFloat(amt),senderNumber:sender.trim(),transactionRef:txn.trim()}});
      setMsg('✅ '+t.saved); setAmt(''); setSender(''); setTxn(''); notify();
    }catch(e){ setMsg('⚠️ '+e.message); } finally{ setBusy(false); }
  };
  return <div className="page">
    <div className="card">
      <div className="chips">{DEP_METHODS.map(x=><button key={x.k} className={"chip"+(m===x.k?" on":"")} onClick={()=>setM(x.k)}>{x.icon} {x.n}</button>)}</div>
      <p className="muted">ℹ️ {DEP_METHODS.find(x=>x.k===m).ins}</p>
      <label>{t.amount} (min 10)</label>
      <input type="number" min="10" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="100"/>
      {quote&&<div className="quote">
        <div><span>{t.amount}</span><b>{money(quote.amount,lang)}</b></div>
        <div><span>＋ {t.fee}</span><b>{money(quote.fee,lang)}</b></div>
        <div className="q-total"><span>= {t.totalPay}</span><b>{money(quote.total,lang)}</b></div>
      </div>}
      <label>{t.senderNo}</label>
      <input value={sender} onChange={e=>setSender(e.target.value)} placeholder="01XXXXXXXXX / 0x..."/>
      <label>{t.txnId}</label>
      <input value={txn} onChange={e=>setTxn(e.target.value)} placeholder="TrxID / TxHash"/>
      {msg&&<div className="notice">{msg}</div>}
      <button className="btn grad" disabled={busy||!(parseFloat(amt)>=10&&sender.trim()&&txn.trim())} onClick={sub}>{t.sendReq}</button>
      <small className="muted">🔒 {t.depositNote}</small>
    </div>
  </div>;
}

const WD_METHODS=[{k:'bkash',n:'bKash',icon:'📱'},{k:'nagad',n:'Nagad',icon:'📱'},{k:'rocket',n:'Rocket',icon:'🚀'}];
function Withdraw({api, stats, t, lang}){
  const [m,setM]=useState('bkash'); const [amt,setAmt]=useState(''); const [ph,setPh]=useState('');
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
  const bal=stats?.wallet?.main_balance||0;
  const fee=10; const total=parseFloat(amt||0)+fee;
  const sub=async()=>{
    setBusy(true); setMsg('');
    try{
      await api('/withdrawals',{method:'POST',body:{method:m,phoneNumber:ph.trim(),amount:parseFloat(amt)}});
      setMsg('✅ '+t.saved); setAmt(''); setPh('');
    }catch(e){ setMsg('⚠️ '+e.message); } finally{ setBusy(false); }
  };
  return <div className="page">
    <div className="card">
      <div className="wrow big"><span>{t.balance}</span><b>{money(bal,lang)}</b></div>
      <div className="chips">{WD_METHODS.map(x=><button key={x.k} className={"chip"+(m===x.k?" on":"")} onClick={()=>setM(x.k)}>{x.icon} {x.n}</button>)}</div>
      <label>{t.phoneNo}</label>
      <input value={ph} onChange={e=>setPh(e.target.value)} placeholder="01XXXXXXXXX"/>
      <label>{t.amount} ({t.min} 100 · {t.max} 50,000 · +{money(fee,lang)} {t.fee})</label>
      <input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="500"/>
      {parseFloat(amt)>0&&<div className="quote"><div className="q-total"><span>{t.totalPay}</span><b>{money(total,lang)}</b></div></div>}
      {parseFloat(amt)>0&&(bal<total)&&<div className="err">{t.notEnough} ({t.balance}: {money(bal,lang)})</div>}
      {msg&&<div className="notice">{msg}</div>}
      <button className="btn grad" disabled={busy||!(parseFloat(amt)>=100&&ph.trim()&&bal>=total)} onClick={sub}>{t.sendReq}</button>
    </div>
  </div>;
}

function History({stats, t, lang}){
  const rows=useMemo(()=>{
    const a=(stats?.depositHistory||[]).map(x=>({...x,kind:'deposit'}));
    const b=(stats?.withdrawalHistory||[]).map(x=>({...x,kind:'withdraw'}));
    return [...a,...b].sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));
  },[stats]);
  return <div className="page">
    <h3>▎{t.allTx}</h3>
    {!rows.length&&<div className="empty card">{t.empty}</div>}
    {rows.map((r,i)=><div key={i} className="card taskrow">
      <span className="svc-ic" style={{background:(r.kind==='deposit'?'#2563eb':'#dc2626')+'16',color:r.kind==='deposit'?'#2563eb':'#dc2626'}}>{r.kind==='deposit'?ic.plus({}):ic.minus({})}</span>
      <div className="grow"><b>{r.method}</b><small>{r.kind==='deposit'?(r.transaction_ref||''):(r.destination||'')} · {new Date(r.created_at).toLocaleString()}</small></div>
      <div className="right"><b>{money(r.amount,lang)}</b><Badge s={r.status} t={t}/></div>
    </div>)}
  </div>;
}

/* ================= OTHER PAGES ================= */
function Referral({api, t, lang}){
  const [d,setD]=useState(null);
  useEffect(()=>{ api('/referrals/mine').then(setD).catch(()=>setD({})); },[]);
  const link=d?.link||d?.referral_link||'';
  return <div className="page">
    <div className="card center refer">
      <span className="sup-ic">{ic.gift({s:28})}</span>
      <h3>{t.howRef}</h3>
      <div className="reflink"><span>{link||'—'}</span>
        <button className="icobtn" onClick={()=>{navigator.clipboard?.writeText(link);}}>{ic.copy({})}</button>
      </div>
      <div className="row2">
        <div className="stat mini"><b>{d?.referral_count??d?.count??0}</b><small>{t.refCount}</small></div>
        <div className="stat mini"><b>{money(d?.total_earnings??d?.earnings??0,lang)}</b><small>{t.refEarn}</small></div>
      </div>
    </div>
  </div>;
}
function Leaderboard({api, t, lang}){
  const [rows,setRows]=useState(null);
  useEffect(()=>{ api('/leaderboard').then(d=>setRows(d.leaderboard||d)).catch(()=>setRows([])); },[]);
  return <div className="page"><h3>▎{t.leadership} 🏆</h3>
    {!rows&&<p className="muted">{t.loading}</p>}
    {(rows||[]).map((r,i)=><div key={i} className="card taskrow">
      <span className="rank">{['🥇','🥈','🥉'][i]||'🎖️'}</span>
      <div className="grow"><b>{r.username||r.full_name||'User'}</b><small>{r.tasks_completed??''} tasks</small></div>
      <b className="reward">{money(r.total_earnings??r.earnings,lang)}</b>
    </div>)}
  </div>;
}
function Membership({t, lang}){
  const plans=[{n:'Silver',p:200,b:['৫% extra reward','Priority review']},{n:'Gold',p:500,b:['১০% extra reward','Instant withdraw']},{n:'Platinum',p:1000,b:['১৫% extra reward','Dedicated support']}];
  return <div className="page"><h3>▎{t.memberPlans} 💎</h3>
    {plans.map(p=><div key={p.n} className="card plan"><div className="grow"><b>{p.n}</b><small>{p.b.join(' · ')}</small></div><b>{money(p.p,lang)}</b><button className="btn" disabled title={t.coming}>{t.coming}</button></div>)}
    <p className="muted">⚠️ {t.coming}</p>
  </div>;
}
function Notifications({stats, t}){
  const items=useMemo(()=>{
    const out=[];
    (stats?.depositHistory||[]).forEach(x=>out.push({s:x.status,d:`${x.method} ${x.amount} — ${x.status}`,dt:x.created_at}));
    (stats?.withdrawalHistory||[]).forEach(x=>out.push({s:x.status,d:`${x.method} ${x.amount} — ${x.status}`,dt:x.created_at}));
    return out.sort((a,b)=>new Date(b.dt)-new Date(a.dt)).slice(0,30);
  },[stats]);
  return <div className="page"><h3>▎{t.notifications} 🔔</h3>
    {!items.length&&<div className="empty card">{t.empty}</div>}
    {items.map((x,i)=><div key={i} className="card taskrow"><div className="grow"><small>{x.d}</small><small className="muted">{new Date(x.dt).toLocaleString()}</small></div><Badge s={x.s} t={t}/></div>)}
  </div>;
}
function Profile({user, lang, setLang, t, logout}){
  const u=user||{};
  return <div className="page">
    <div className="card center prof">
      <span className="avatar big">{ic.user({s:44})}</span>
      <h3>{u.full_name||u.username}</h3><small className="muted">@{u.username} · {u.email}</small>
    </div>
    <div className="card">
      <div className="setrow"><span>🌐 {t.language}</span>
        <select value={lang} onChange={e=>setLang(e.target.value)}><option value="bn">বাংলা</option><option value="en">English</option></select></div>
      <div className="setrow"><span>🔒 {t.secChangePass}</span><button className="btn" disabled title={t.coming}>{t.coming}</button></div>
    </div>
    <button className="btn danger wide" onClick={logout}>⎋ {t.logout}</button>
  </div>;
}
function Support({t}){
  const faqs=[['কীভাবে কাজ করবো?','টাস্কে গিয়ে নির্দেশনা পড়ে কাজ সম্পন্ন করে প্রমাণ জমা দিন।'],['পেমেন্ট কবে পাবো?','অ্যাডমিন রিভিউ করে Approve করলে সাথে সাথে ব্যালেন্সে যোগ হবে।'],['উইথড্র কীভাবে?','Wallet → Withdraw থেকে মিনিমাম ৳100 তুলতে পারবেন।']];
  return <div className="page"><h3>▎{t.custSupport} 🎧</h3>
    <div className="card"><b>{t.faq}</b>{faqs.map((f,i)=><details key={i}><summary>{f[0]}</summary><p>{f[1]}</p></details>)}</div>
    <div className="card"><b>📢 Telegram:</b> <a className="link" href="https://t.me/" target="_blank" rel="noreferrer">@PayGlowSupport</a><p className="muted">সাপোর্ট টিকিট সিস্টেম শীঘ্রই আসছে।</p></div>
  </div>;
}
function Soon({t, label}){ return <div className="page center-col"><div className="empty card"><span style={{fontSize:40}}>🚧</span><h3>{label}</h3><p className="muted">⚠️ {t.coming}</p></div></div>; }

/* ================= DASHBOARD (user) ================= */
function Dashboard({stats, t, lang, go}){
  const s=stats?.submissions||{}; const w=stats?.wallet||{};
  return <div className="page">
    <div className="stat-grid">
      <Stat icon={ic.wallet({})} label={t.balance} val={money(w.main_balance,lang)} color="#0e9f6e"/>
      <Stat icon={ic.zap({})} label={t.totalEarn} val={money((s.approved||0)*0+ (stats?.earned||0),lang)} color="#2563eb"/>
      <Stat icon={ic.check({})} label={t.completed} val={s.approved||0} color="#16a34a"/>
      <Stat icon={ic.clock({})} label={t.pending} val={s.pending||0} color="#f59e0b"/>
      <Stat icon={ic.play({})} label={t.processing} val={s.processing||0} color="#3b82f6"/>
      <Stat icon={ic.x({})} label={t.rejected} val={s.rejected||0} color="#dc2626"/>
      <Stat icon={ic.card({})} label={t.deposit} val={money(stats?.deposited||0,lang)} color="#2563eb"/>
      <Stat icon={ic.minus({})} label={t.withdraw} val={money(stats?.withdrawn||0,lang)} color="#dc2626"/>
    </div>
  </div>;
}


/* ================= REFERRAL LEADERBOARD (VIP) ================= */
function RefLB({api, t, lang, go}){
  const [cfg,setCfg]=useState(null); const [data,setData]=useState(null);
  const [mine,setMine]=useState(null); const [q,setQ]=useState(''); const [page,setPage]=useState(1); const [lvlF,setLvlF]=useState(0);
  useEffect(()=>{ fetch(API+'/settings/reflb').then(r=>r.json()).then(setCfg).catch(()=>setCfg({notices:[]})); },[]);
  useEffect(()=>{ setPage(1); },[q]);
  useEffect(()=>{ api('/referrals/leaderboard?page='+page+(q?('&q='+encodeURIComponent(q)):'')).then(setData).catch(()=>setData({rows:[],total:0,pages:1})); },[page,q]);
  useEffect(()=>{ api('/referrals/mine').then(setMine).catch(()=>{}); },[]);
  const rows=(data?.rows||[]).filter(r=>!lvlF||r.level===lvlF);
  const top3=rows.slice(0,3);
  const podium=[
    {r:top3[0],medal:'🥇',cls:'gold',prize:cfg?.prize1},
    {r:top3[1],medal:'🥈',cls:'silver',prize:cfg?.prize2},
    {r:top3[2],medal:'🥉',cls:'bronze',prize:cfg?.prize3},
  ].filter(x=>x.r);
  const share=encodeURIComponent(mine?.link||'');
  return <div className="page vip">
    <div className="vip-banner">
      <span className="vb-tag">👑 বেশি রেফার করুন, বেশি জিতুন!</span>
      <h2>🏆 {cfg?.banner||'রেফারেল চ্যাম্পিয়নশিপ'}</h2>
      <p>আপনার রেফারেলের দিয়ে গড়ুন আপনার সাফল্যের নতুন ইতিহাস!</p>
      <button className="btn vb-cta" onClick={()=>go('referral')}>👥 এখনই রেফার করুন →</button>
      <span className="vb-crown">👑</span>
      <div className="vb-notices">{(cfg?.notices||[]).map(n=><span key={n.id} className="vb-n">{n.icon} {lang==='bn'?n.text_bn:(n.text_en||n.text_bn)}</span>)}</div>
    </div>

    <div className="vip-sec">
      <div className="vip-sec-h"><h3>🏆 সেরা ৩ রেফারার (VIP)</h3><small>⚙️ পুরস্কারের পরিমাণ অ্যাডমিন সেটিংস অনুযায়ী</small></div>
      <div className="podium">
        {podium.map(({r,medal,cls,prize})=><div key={r.rank} className={"pod "+cls}>
          <span className="pod-medal">{medal}</span>
          <span className="avatar">{ic.user({s:34})}</span>
          <b>{r.full_name||r.username}</b>
          <small>কাজ: {r.tasks_completed} · রেফার: {r.total_refers}</small>
          <span className="pod-prize">🏆 পুরস্কার ৳{(prize||0).toLocaleString()}+</span>
        </div>)}
        {!podium.length&&<p className="muted">এখনও কোনো রেফারার নেই</p>}
      </div>
    </div>

    <div className="vip-sec">
      <div className="vip-sec-h"><h3>👥 রেফারার লিডারবোর্ড (টপ ১০০)</h3>
        <div className="lb-tools">
          <span className="lb-search">🔍 <input placeholder={lang==='bn'?'ইউজারের নাম দিয়ে সার্চ...':'Search username...'} value={q} onChange={e=>setQ(e.target.value)}/></span>
          <select value={lvlF} onChange={e=>setLvlF(+e.target.value)}>
            <option value="0">{lang==='bn'?'সব লেভেল':'All levels'}</option><option value="1">লেভেল ১</option><option value="2">লেভেল ২</option><option value="3">লেভেল ৩</option>
          </select>
        </div>
      </div>
      <div className="lb-table">
        <div className="lb-row lb-head"><span>র‍্যাঙ্ক</span><span>ইউজার</span><span>লেভেল</span><span>মোট কাজ</span><span>মোট রেফার</span><span>মোট আয়</span><span>স্ট্যাটাস</span></div>
        {rows.map(r=><div key={r.id} className="lb-row">
          <span>{['👑','🥈','🥉'][r.rank-1]||r.rank}.</span>
          <span className="lb-user"><span className="avatar xs">{ic.user({s:16})}</span><b>{r.full_name||r.username}</b></span>
          <span><i className={"lvltag l"+r.level}>লেভেল {r.level}</i></span>
          <span>{r.tasks_completed}</span><span>{r.total_refers}</span>
          <span className="lb-earn">৳{r.total_earned>=1000?(r.total_earned/1000).toFixed(1)+'k+':r.total_earned+'+'}</span>
          <span><i className="oktag">সক্রিয়</i></span>
        </div>)}
        {!rows.length&&<p className="muted center" style={{padding:16}}>{t.empty}</p>}
      </div>
      {data&&data.pages>1&&<div className="lb-pager">
        <button className="icobtn" disabled={page<=1} onClick={()=>setPage(page-1)}>‹</button>
        {Array.from({length:data.pages},(_,i)=>i+1).slice(0,10).map(p=><button key={p} className={"pgn"+(p===page?" on":"")} onClick={()=>setPage(p)}>{p}</button>)}
        <button className="icobtn" disabled={page>=data.pages} onClick={()=>setPage(page+1)}>›</button>
      </div>}
    </div>

    {mine&&<div className="vip-sec">
      <h3>👥 আমার রেফারেল তথ্য</h3>
      <p className="muted">আপনার রেফারেল লিংক দিয়ে বন্ধুরা জয়েন করালে পয়েন্ট ও আয় করুন।</p>
      <div className="reflink dark"><span>{mine.link}</span>
        <button className="btn mini grad" onClick={()=>{navigator.clipboard?.writeText(mine.link);}}>{ic.copy({})} কপি করুন</button></div>
      <div className="share-row">
        <a className="btn wa" href={'https://wa.me/?text='+share} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className="btn tg2" href={'https://t.me/share/url?url='+share} target="_blank" rel="noreferrer">Telegram</a>
        <a className="btn fb2" href={'https://www.facebook.com/sharer/sharer.php?u='+share} target="_blank" rel="noreferrer">Facebook</a>
      </div>
      <div className="mine-stats">
        <div className="mstat"><span>👥 মোট রেফার</span><b>{mine.total_refers}</b></div>
        <div className="mstat"><span>✅ বৈধ রেফার</span><b>{mine.valid_refers}</b></div>
        <div className="mstat"><span>💰 মোট আয়</span><b>৳{mine.total_earned}+</b></div>
      </div>
      <div className="lvline"><span>বর্তমান লেভেল: <b>লেভেল {mine.level} {mine.level>=3?'(VIP)':''}</b></span><span>পরবর্তী লেভেল: লেভেল {Math.min(3,mine.level+1)}</span></div>
      <div className="prog"><i style={{width:(mine.progress||0)+'%'}}/></div>
      <small className="muted">আরও {(mine.next_at?mine.next_at-mine.total_refers:0)} জন বৈধ রেফার দরকার</small>
    </div>}
  </div>;
}

/* ================= ADMIN ================= */
function Admin({api, t, lang}){
  const [tab,setTab]=useState('dashboard'); const [rows,setRows]=useState(null);
  const [cats,setCats]=useState([]); const [reason,setReason]=useState({}); const [msg,setMsg]=useState('');
  const [theme,setTheme]=useState(null);
  const TABS=['dashboard','submissions','deposits','withdrawals','users','categories','tasks','reflb','theme'];
  const load=()=>{
    setRows(null);
    if(tab==='theme'){ api('/admin/theme').then(setTheme).catch(e=>setMsg(e.message)); return; }
    if(tab==='reflb'){ api('/admin/reflb').then(d=>setTheme({reflb:d})).catch(e=>setMsg(e.message)); api('/admin/notices').then(d=>setCats(d)).catch(()=>{}); setRows([]); return; }
    if(tab==='categories'){ api('/admin/categories').then(d=>{setCats(d); setRows([]);}).catch(e=>setMsg(e.message)); return; }
    const p = tab==='tasks' ? '/tasks' : '/admin/'+tab;
    api(p).then(d=>{ const arr = d.rows||d.tasks||d; setRows(arr); }).catch(e=>{ setMsg(e.message); setRows([]); });
  };
  useEffect(load,[tab]);
  const review=async(kind,id,decision)=>{
    try{
      const body={decision}; if(decision==='rejected') body.reason=reason[id]||'';
      if(kind==='deposits') body.note=reason[id]||'';
      if(kind==='withdrawals'&&decision!=='processing') body.tx_ref=reason['tx'+id]||'';
      await api(`/admin/${kind}/${id}/review`,{method:'POST',body});
      setMsg('✅'); load();
    }catch(e){ setMsg('⚠️ '+e.message); }
  };
  const saveTheme=async()=>{ try{ await api('/admin/theme',{method:'PUT',body:theme}); setMsg('✅ '+t.saved); loadTheme(); }catch(e){ setMsg('⚠️ '+e.message);} };

  return <div className="page">
    <div className="chips wrap">{TABS.map(x=><button key={x} className={"chip"+(tab===x?" on":"")} onClick={()=>setTab(x)}>{t[x]||x}</button>)}</div>
    {msg&&<div className="notice">{msg}</div>}


    {tab==='reflb'&&theme?.reflb&&<div className="card">
      <h3>🏆 রেফারেল লিডারবোর্ড সেটিংস</h3>
      <label>ব্যানার শিরোনাম</label>
      <input value={theme.reflb.banner||''} onChange={e=>setTheme({...theme,reflb:{...theme.reflb,banner:e.target.value}})}/>
      <div className="row3">
        {[['prize1','🥇 ১ম পুরস্কার'],['prize2','🥈 ২য় পুরস্কার'],['prize3','🥉 ৩য় পুরস্কার']].map(([k,l])=>
          <div key={k}><label>{l}</label>
          <input type="number" value={theme.reflb[k]||''} onChange={e=>setTheme({...theme,reflb:{...theme.reflb,[k]:e.target.value}})}/></div>)}
      </div>
      <button className="btn grad" onClick={async()=>{ await api('/admin/reflb',{method:'PUT',body:theme.reflb}); setMsg('✅ '+t.saved); }}>{t.save}</button>
      <h4 style={{marginTop:14}}>📢 নোটিশ ব্যাজ (ব্যানারের ডান পাশে)</h4>
      <div className="row3"><input id="ntxt" placeholder="নোটিশ লিখুন..."/><input id="nico" defaultValue="📢" placeholder="আইকন"/></div>
      <button className="btn" onClick={async()=>{ const v=document.getElementById('ntxt').value; if(!v)return;
        await api('/admin/notices',{method:'POST',body:{text_bn:v,icon:document.getElementById('nico').value}}); setMsg('✅'); api('/admin/notices').then(setCats); }}>＋ যোগ করুন</button>
      {cats.map(n=><div key={n.id} className="taskrow card"><span className="svc-ic">{n.icon}</span>
        <div className="grow"><b>{n.text_bn}</b></div>
        <button className="icobtn" onClick={async()=>{ await api('/admin/notices/'+n.id,{method:'DELETE'}); api('/admin/notices').then(setCats); }}>{ic.trash({})}</button></div>)}
    </div>}

    {tab==='theme'&&theme&&<div className="card">
      <h3>{t.themeSet}</h3>
      {[['primaryColor',t.primary],['secondaryColor',t.secondary],['gradientStart',t.gStart],['gradientEnd',t.gEnd]].map(([k,l])=>
        <div key={k} className="setrow"><span>{l}</span><input type="color" value={theme[k]||'#0e9f6e'} onChange={e=>setTheme({...theme,[k]:e.target.value})}/></div>)}
      <div className="setrow"><span>{t.gDir}</span><input type="number" min="0" max="360" value={theme.gradientDirection||135} onChange={e=>setTheme({...theme,gradientDirection:e.target.value})}/></div>
      <div className="preview" style={{background:`linear-gradient(${theme.gradientDirection||135}deg, ${theme.gradientStart}, ${theme.gradientEnd})`}}>{t.preview}</div>
      <button className="btn grad" onClick={saveTheme}>{t.save}</button>
      <button className="btn" onClick={async()=>{ const d={primaryColor:'#0e9f6e',secondaryColor:'#0d9488',gradientStart:'#0e9f6e',gradientEnd:'#0d9488',gradientDirection:'135'}; setTheme(d); await api('/admin/theme',{method:'PUT',body:d}); loadTheme(); }}>{t.reset}</button>
    </div>}

    {tab==='categories'&&<div className="card">
      <h3>{t.categories}</h3>
      <div className="row3"><input id="cname" placeholder="Name"/><input id="cen" placeholder="EN"/><input id="cicon" placeholder="Icon" defaultValue="📋"/></div>
      <button className="btn grad" onClick={async()=>{ const n=document.getElementById('cname').value; if(!n)return; await api('/admin/categories',{method:'POST',body:{name:n,name_en:document.getElementById('cen').value,icon:document.getElementById('cicon').value}}); load(); }}>＋ Add</button>
      {cats.map(c=><div key={c.id} className="taskrow card">
        <span className="svc-ic">{c.icon}</span>
        <div className="grow"><b>{c.name}</b><small>{c.name_en}</small></div>
        <Badge s={c.status} t={t}/>
        <button className="icobtn" onClick={async()=>{ await api('/admin/categories/'+c.id,{method:'PATCH',body:{status:c.status==='active'?'paused':'active'}}); load(); }}>{ic.edit({})}</button>
        <button className="icobtn" onClick={async()=>{ if(confirm('Delete?')){ await api('/admin/categories/'+c.id,{method:'DELETE'}); load(); } }}>{ic.trash({})}</button>
      </div>)}
    </div>}

    {tab==='tasks'&&<NewTask api={api} cats={cats} onDone={load} t={t}/>}

    {tab!=='theme'&&tab!=='categories'&&tab!=='tasks'&&<>
      {!rows&&<p className="muted">{t.loading}</p>}
      {(rows||[]).map(r=>{ const isDash=tab==='dashboard';
        return <div key={r.id||Math.random()} className="card taskrow">
          <div className="grow"><b>{isDash?(r.method||''):(`#${r.id} ${r.username||r.user_id||r.task_id||''}`)}</b>
          <small>{[r.category_name||r.category, r.method, r.note||r.admin_note||r.reason, r.created_at?new Date(r.created_at).toLocaleString():''].filter(Boolean).join(' · ')}</small></div>
          {(r.amount!=null||r.reward_amount!=null)&&<b className="reward">{money(r.amount??r.reward_amount,lang)}</b>}
          {r.status&&<Badge s={r.status} t={t}/>}
          {!isDash&&<span className="rev">
            <input placeholder={t.reason} value={reason[r.id]||''} onChange={e=>setReason({...reason,[r.id]:e.target.value})} style={{display:(tab==='submissions'||tab==='withdrawals')?'inline-block':'none'}}/>
            <button className="btn mini" onClick={()=>review(tab==='submissions'?'submissions':tab, r.id, tab==='submissions'?'approved':tab==='deposits'?'completed':'completed')}>{t.approve}</button>
            <button className="btn mini danger" onClick={()=>review(tab==='submissions'?'submissions':tab, r.id, 'rejected')}>{t.reject}</button>
          </span>}
        </div>;})}
    </>}
  </div>;
}

function NewTask({api, cats, onDone, t}){
  const [f,setF]=useState({category_id:'',title_en:'',title_bn:'',reward_amount:'',instructions:'',required_link:'',total_limit:0,per_user_limit:0,starts_at:'',ends_at:'',sort_order:0});
  const set=k=>e=>setF({...f,[k]:e.target.value});
  return <div className="card">
    <h3>{t.newTask}</h3>
    <div className="row2">
      <select value={f.category_id} onChange={set('category_id')}><option value="">Category…</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <input value={f.reward_amount} onChange={set('reward_amount')} type="number" placeholder="Reward"/>
    </div>
    <input value={f.title_en} onChange={set('title_en')} placeholder="Title (EN)"/>
    <input value={f.title_bn} onChange={set('title_bn')} placeholder="Title (BN)"/>
    <textarea rows="2" value={f.instructions} onChange={set('instructions')} placeholder={t.instructions}/>
    <input value={f.required_link} onChange={set('required_link')} placeholder="https://…"/>
    <div className="row3"><input type="number" value={f.total_limit} onChange={set('total_limit')} placeholder="Total limit"/><input type="number" value={f.per_user_limit} onChange={set('per_user_limit')} placeholder="Per-user limit"/><input type="number" value={f.sort_order} onChange={set('sort_order')} placeholder="Order"/></div>
    <button className="btn grad" onClick={async()=>{ await api('/admin/tasks',{method:'POST',body:{...f,category_id:parseInt(f.category_id),reward_amount:parseFloat(f.reward_amount),total_limit:+f.total_limit,per_user_limit:+f.per_user_limit,sort_order:+f.sort_order,starts_at:f.starts_at||null,ends_at:f.ends_at||null}}); onDone(); }}>{t.save}</button>
  </div>;
}

/* ================= LAYOUT ================= */
const SIDE = [
  ['home','home'],['dash','dash'],['tasks','tasks'],
  ['gmail','gmailTask','tasks','Gmail'],['fb','fbTask','tasks','Facebook'],['ig','igTask','tasks','Instagram'],
  ['ads','adsView'],['micro','microJob'],['job','jobPost'],['refer','refer','referral'],['target','target'],
  ['lead','leadership','leaderboard'],['reflb','refLB','ref-lb'],['member','membership','membership'],['bonus','dailyBonus'],
  ['type','typing'],['drive','driveOffer'],['shop','shopping'],['smm','smm'],
  ['wallet','wallet','wallet'],['dep','deposit','deposit'],['wd','withdraw','withdraw'],
  ['hist','txHistory','history'],['notif','notifications','notifications'],['prof','profile','profile'],
  ['sec','security','security'],['sup','support','support'],
];
const SIDE_IC = {reflb:ic.trophy,home:ic.home,dash:ic.grid,tasks:ic.clip,gmail:ic.mail,fb:ic.fb,ig:ic.ig,ads:ic.megaphone,micro:ic.briefcase,job:ic.clip,refer:ic.users,target:ic.target,lead:ic.trophy,member:ic.gem,bonus:ic.gift,type:ic.type,drive:ic.percent,shop:ic.cart,smm:ic.share,wallet:ic.wallet,dep:ic.card,wd:ic.minus,hist:ic.history,notif:ic.bell,prof:ic.user,sec:ic.shield,sup:ic.headset};

function Sidebar({open, onClose, go, user, t, lang, stats, isAdmin, logout}){
  const bal = stats?.wallet?.main_balance ?? 0;
  return <div className={"side-wrap"+(open?" on":"")} onClick={onClose}>
    <div className="sidebar" onClick={e=>e.stopPropagation()}>
      <div className="side-head">
        <span className="avatar">{ic.user({s:34})}</span>
        <div><b>{user?.full_name||user?.username}</b><small className="lvl">★ {t.level} 1</small></div>
      </div>
      <div className="side-bal"><small>{t.balance}</small><b>{money(bal,lang)}</b><span>{ic.chevR({s:16})}</span></div>
      <nav>
        {SIDE.map(([k,label,page,cat])=><button key={k} className="snav" onClick={()=>{go(page||'soon',cat,label); onClose();}}>{SIDE_IC[k]({})}<span>{t[label]}</span></button>)}
        {isAdmin&&<button className="snav adm" onClick={()=>{go('admin'); onClose();}}>{ic.shield({})}<span>{t.admin}</span></button>}
      </nav>
      <button className="btn grad wide" onClick={logout}>⎋ {t.logout}</button>
    </div>
  </div>;
}

function Header({onMenu, go, t, unread}){
  return <header className="topbar">
    <button className="icobtn lite" onClick={onMenu} aria-label="menu">{ic.menu({s:22})}</button>
    <div className="logo" onClick={()=>go('home')}>🍃 <b>PayGlow</b><small>Earn · Grow · Shine</small></div>
    <div className="hright">
      <button className="icobtn lite" onClick={()=>go('notifications')} aria-label="notify">{ic.bell({})}{unread>0&&<i className="dot"/>}</button>
      <button className="avatar sm" onClick={()=>go('profile')}>{ic.user({s:20})}</button>
    </div>
  </header>;
}
function BottomNav({page, go, t}){
  const B=[['home',ic.home,t.home],['tasks',ic.clip,t.tasksShort],['wallet',ic.wallet,t.walletShort],['history',ic.history,t.historyShort],['profile',ic.user,t.profileShort]];
  return <nav className="bnav">{B.map(([p,icn,l])=><button key={p} className={page===p?'on':''} onClick={()=>go(p)}>{icn({s:22})}<small>{l}</small></button>)}</nav>;
}

/* ================= APP ================= */
function App(){
  const [token,setToken]=useState(localStorage.getItem('pg_token')||'');
  const [lang,setLang]=useState(localStorage.getItem('pg_lang')||'bn');
  const [page,setPage]=useState('home'); const [param,setParam]=useState(undefined); const [label,setLabel]=useState('');
  const [user,setUser]=useState(null); const [stats,setStats]=useState(null);
  const [side,setSide]=useState(false); const [err,setErr]=useState('');
  const t=T[lang]; const api=useApi(token);
  useEffect(()=>{ localStorage.setItem('pg_lang',lang); },[lang]);
  useEffect(()=>{ loadTheme(); },[]);
  const refreshStats=()=>{ if(token) api('/user/stats').then(setStats).catch(()=>{}); };
  useEffect(()=>{ if(token){ api('/user/profile').then(d=>setUser(d.user||d)).catch(()=>{}); refreshStats(); } },[token]);
  const go=(p,prm,lab)=>{ setPage(p); setParam(prm); setLabel(lab||''); window.scrollTo(0,0); };
  const logout=()=>{ localStorage.removeItem('pg_token'); setToken(''); setUser(null); setPage('home'); };
  if(!token) return <Auth onOk={tk=>{ const tkk=tk.token||tk; localStorage.setItem('pg_token',tkk); setToken(tkk); }}/>;

  const titles={home:t.home,dash:t.dash,tasks:t.tasks,task:t.submitTask,wallet:t.wallet,deposit:t.deposit,withdraw:t.withdraw,history:t.txHistory,referral:t.refer,'ref-lb':lang==='bn'?'রেফারেল লিডারবোর্ড':'Referral Leaderboard',leaderboard:t.leadership,membership:t.membership,profile:t.profile,notifications:t.notifications,support:t.support,admin:t.admin,soon:label};
  const isAdmin=user?.role==='admin';
  const back=()=>{ if(page==='task') go('tasks'); else go('home'); };
  const inner=(()=>{
    switch(page){
      case 'home': return <Home go={go} user={user} t={t} lang={lang} stats={stats}/>;
      case 'dash': return <Dashboard stats={stats} t={t} lang={lang} go={go}/>;
      case 'tasks': return <Tasks api={api} go={go} t={t} lang={lang} filterCat={param}/>;
      case 'task': return <TaskDetail api={api} id={param} go={go} t={t} lang={lang}/>;
      case 'wallet': return <Wallet stats={stats} t={t} lang={lang} go={go}/>;
      case 'deposit': return <Deposit api={api} t={t} lang={lang} notify={refreshStats}/>;
      case 'withdraw': return <Withdraw api={api} stats={stats} t={t} lang={lang}/>;
      case 'history': return <History stats={stats} t={t} lang={lang}/>;
      case 'referral': return <Referral api={api} t={t} lang={lang}/>;
      case 'ref-lb': return <RefLB api={api} t={t} lang={lang} go={go}/>;
      case 'leaderboard': return <Leaderboard api={api} t={t} lang={lang}/>;
      case 'membership': return <Membership t={t} lang={lang}/>;
      case 'profile': return <Profile user={user} lang={lang} setLang={setLang} t={t} logout={logout}/>;
      case 'security': return <Soon t={t} label={t.security}/>;
      case 'notifications': return <Notifications stats={stats} t={t}/>;
      case 'support': return <Support t={t}/>;
      case 'admin': return isAdmin? <Admin api={api} t={t} lang={lang}/> : <Soon t={t} label="403"/>;
      default: return <Soon t={t} label={label||t.coming}/>;
    }
  })();
  return <div className="app">
    <Header onMenu={()=>setSide(true)} go={go} t={t} unread={stats?.submissions?.pending||0}/>
    <div className="body">
      {page!=='home'&&<PageHead t={titles[page]||page} onBack={back}/>}
      {inner}
    </div>
    <BottomNav page={['home','tasks','wallet','history','profile'].includes(page)?page:(page==='task'?'tasks':'home')} go={go} t={t}/>
    <Sidebar open={side} onClose={()=>setSide(false)} go={go} user={user} t={t} lang={lang} stats={stats} isAdmin={isAdmin} logout={logout}/>
    {err&&<div className="toast">{err}</div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
