(()=>{
  const tokenKey='aonang-fight-sync-token';
  const token=()=>{try{return localStorage.getItem(tokenKey)||''}catch{return ''}};
  let localSchedulePending=false,localScheduleFreshUntil=0;
  async function refreshSchedule(){if(!token()||localSchedulePending||Date.now()<localScheduleFreshUntil||!window.FightScheduleSync)return;const state=await window.FightScheduleSync.readState();if(!state.initialized||!Array.isArray(state.fights))return;let current=[];try{current=JSON.parse(localStorage.getItem('aonang-fights')||'[]')}catch{}if(JSON.stringify(current)!==JSON.stringify(state.fights)){localStorage.setItem('aonang-fights',JSON.stringify(state.fights));window.dispatchEvent(new CustomEvent('shared-fights-loaded',{detail:{fights:state.fights}}))}}
  const isThai=()=>{try{return localStorage.getItem('aonang-language-v2')==='th'}catch{return false}};
  const bookingStatus=document.getElementById('fightSyncStatus');
  const tokenInput=document.getElementById('fightSyncToken');
  const connectButton=document.getElementById('saveFightSyncToken');
  const youtubeInput=document.getElementById('youtubeLiveUrl');
  const youtubeSave=document.getElementById('saveYoutubeLive');
  const youtubeStatus=document.getElementById('youtubeLiveStatus');
  const status=(el,message,ok=false)=>{if(!el)return;el.textContent=message;el.classList.toggle('saved',ok)};
  const authHeaders=value=>({Authorization:'Bearer '+value,Accept:'application/json'});
  async function loadBookings(value){
    const response=await fetch('/api/bookings',{cache:'no-store',headers:authHeaders(value)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Could not load shared booking requests.');
    window.dispatchEvent(new CustomEvent('shared-bookings-loaded',{detail:{bookings:Array.isArray(data.bookings)?data.bookings:[]}}));
  }
  async function migrateBookings(value){
    let old=[];try{old=JSON.parse(localStorage.getItem('aonang-bookings')||'[]')}catch{}
    if(Array.isArray(old)&&old.length){
      const response=await fetch('/api/bookings',{method:'PUT',cache:'no-store',headers:{...authHeaders(value),'Content-Type':'application/json'},body:JSON.stringify({bookings:old})});
      if(!response.ok)throw new Error('Could not merge booking requests from this device.');
    }
  }
  async function syncYoutube(value){
    const response=await fetch('/api/site-config',{cache:'no-store'});
    if(!response.ok)return;
    const config=await response.json().catch(()=>({}));
    if(config.youtubeEmbed){localStorage.setItem('aonang-youtube-live',config.youtubeEmbed);if(config.youtubeUrl)localStorage.setItem('aonang-youtube-live-url',config.youtubeUrl);if(youtubeInput&&config.youtubeUrl)youtubeInput.value=config.youtubeUrl;return}
    const current=localStorage.getItem('aonang-youtube-live-url')||youtubeInput?.value||'';
    if(current){await fetch('/api/site-config',{method:'PUT',headers:{...authHeaders(value),'Content-Type':'application/json'},body:JSON.stringify({youtubeUrl:current})})}
  }
  async function connect(value,manual=false){
    if(!value){status(bookingStatus,isThai()?'กรุณากรอกคีย์ผู้ดูแลจาก Cloudflare':'Enter the Cloudflare admin key.');return}
    if(connectButton)connectButton.disabled=true;
    status(bookingStatus,isThai()?'กำลังซิงก์ข้อมูลกับเซิร์ฟเวอร์…':'Syncing website data with the server…');
    try{
      const state=await window.FightScheduleSync.readState();
      if(!Array.isArray(state.fights))throw new Error('The shared schedule response is invalid.');
      const schedule=state.initialized?state.fights:(window.getDashboardFightSchedule?.()||state.fights);
      if(!state.initialized){await window.FightScheduleSync.write(schedule,value);localScheduleFreshUntil=Date.now()+65000}
      localStorage.setItem(tokenKey,value);
      localSchedulePending=false;
      localStorage.setItem('aonang-fights',JSON.stringify(schedule));
      window.dispatchEvent(new CustomEvent('shared-fights-loaded',{detail:{fights:schedule}}));
      await migrateBookings(value);
      await loadBookings(value);
      await syncYoutube(value);
      let imageCount=0;
      if(window.SiteImageStore?.migrateLocalToCloud)imageCount=await window.SiteImageStore.migrateLocalToCloud();
      status(bookingStatus,isThai()?'เชื่อมต่อแล้ว ข้อมูลตาราง การจอง และรูปภาพใช้ร่วมกันข้ามอุปกรณ์':'Connected. Schedule, bookings and images are shared across devices.',true);
      if(imageCount)status(bookingStatus,isThai()?`ซิงก์ข้อมูลแล้ว และอัปโหลดรูปเดิม ${imageCount} รูป`:`Synced data and uploaded ${imageCount} existing photos.`,true);
    }catch(error){
      if(error.message==='Invalid admin key.')status(bookingStatus,isThai()?'คีย์ไม่ถูกต้อง กรุณาตรวจสอบคีย์ใน Cloudflare':'The key is invalid. Check the key in Cloudflare.');
      else status(bookingStatus,isThai()?'ซิงก์ไม่สำเร็จ ตรวจสอบ Cloudflare D1/KV, การเผยแพร่ API และลองอีกครั้ง':'Sync failed. Check Cloudflare D1/KV, API deployment, and try again.');
      if(manual)console.warn('Shared data connection failed:',error);
    }finally{if(connectButton)connectButton.disabled=false}
  }
  window.AdminBookingApi={
    async update(id,statusValue){const value=token();if(!value)throw new Error('Connect the Cloudflare admin key first.');const response=await fetch('/api/bookings',{method:'PATCH',headers:{...authHeaders(value),'Content-Type':'application/json'},body:JSON.stringify({id,status:statusValue})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Could not update booking.');return data},
    async remove(id){const value=token();if(!value)throw new Error('Connect the Cloudflare admin key first.');const response=await fetch('/api/bookings?id='+encodeURIComponent(id),{method:'DELETE',headers:authHeaders(value)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Could not delete booking.');return data},
    async refresh(){const value=token();if(!value)throw new Error('Connect the Cloudflare admin key first.');await loadBookings(value)}
  };
  if(tokenInput&&connectButton&&bookingStatus&&window.FightScheduleSync){
    tokenInput.value=token();
    connectButton.addEventListener('click',()=>connect(tokenInput.value.trim(),true));
    window.addEventListener('aonang-fights-saved',async event=>{
      const value=token();localSchedulePending=true;if(!value){status(bookingStatus,isThai()?'บันทึกเฉพาะอุปกรณ์นี้ กรุณาเชื่อมต่อ Cloudflare เพื่อซิงก์':'Saved on this device only. Connect Cloudflare to sync.');return}
      try{await window.FightScheduleSync.write(event.detail.fights,value);localSchedulePending=false;localScheduleFreshUntil=Date.now()+65000;status(bookingStatus,isThai()?'ซิงก์ตารางแข่งขันแล้ว':'Fight schedule synced.',true)}catch(error){status(bookingStatus,isThai()?'ซิงก์ตารางไม่สำเร็จ ตรวจสอบ Cloudflare แล้วลองใหม่':'Schedule sync failed. Check Cloudflare and try again.')}
    });
    if(token())connect(token());
  }
  if(youtubeInput&&youtubeSave&&youtubeStatus){
    try{youtubeInput.value=localStorage.getItem('aonang-youtube-live-url')||'https://www.youtube.com/watch?v=oKAavY0z3o8'}catch{}
    youtubeSave.addEventListener('click',async()=>{
      let videoId='';
      try{const url=new URL(youtubeInput.value.trim());if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(url.hostname))throw new Error('host');videoId=url.hostname.endsWith('youtu.be')?url.pathname.split('/').filter(Boolean)[0]||'':(url.searchParams.get('v')||url.pathname.match(/\/(?:embed|live|shorts)\/([^/?]+)/)?.[1]||'');if(!/^[\w-]{11}$/.test(videoId))throw new Error('id');
        const youtubeUrl=youtubeInput.value.trim(),youtubeEmbed='https://www.youtube.com/embed/'+videoId;
        localStorage.setItem('aonang-youtube-live-url',youtubeUrl);localStorage.setItem('aonang-youtube-live',youtubeEmbed);
        const value=token();if(!value)throw new Error('Connect the Cloudflare admin key first.');
        const response=await fetch('/api/site-config',{method:'PUT',headers:{...authHeaders(value),'Content-Type':'application/json'},body:JSON.stringify({youtubeUrl})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Could not save the shared YouTube link.');
        status(youtubeStatus,isThai()?'บันทึกลิงก์และซิงก์ไปยังทุกอุปกรณ์แล้ว':'Link saved and synced to all devices.',true);
      }catch(error){status(youtubeStatus,error.message==='Connect the Cloudflare admin key first.'?(isThai()?'บันทึกไว้ในอุปกรณ์นี้แล้ว เชื่อมต่อ Cloudflare เพื่อซิงก์':'Saved on this device. Connect Cloudflare to sync.'):(isThai()?'ลิงก์ไม่ถูกต้องหรือซิงก์ไม่สำเร็จ กรุณาตรวจสอบ Cloudflare':'Invalid link or sync failed. Check Cloudflare.'))}
    });
  }
  if(tokenInput)setInterval(()=>{if(token()){window.AdminBookingApi?.refresh().catch(()=>{});refreshSchedule().catch(()=>{});}},30000);
})();








