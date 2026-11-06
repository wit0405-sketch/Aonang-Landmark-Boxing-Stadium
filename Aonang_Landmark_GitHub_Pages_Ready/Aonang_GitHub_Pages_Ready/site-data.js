(()=>{
  const key='aonang-fights';
  const defaults=[
    {id:'f1',date:'2026-10-25',title:'Thai Fight · 5 Rounds',type:'main',status:'upcoming'},
    {id:'f2',date:'2026-10-26',title:'Muay Thai Super Fight',type:'main',status:'upcoming'},
    {id:'f3',date:'2026-10-27',title:'Local Fight Night',type:'local',status:'upcoming'},
    {id:'f4',date:'2026-10-28',title:'Thai Fight · 5 Rounds',type:'main',status:'upcoming'}
  ];
  const lang=()=>document.documentElement.lang==='en'?'en':'th';
  function readFights(){
    try{
      const saved=localStorage.getItem(key);
      if(saved===null)return defaults;
      const parsed=JSON.parse(saved);
      return Array.isArray(parsed)?parsed:defaults;
    }catch{return defaults}
  }
  function fmt(date){return new Date(date+'T12:00:00').toLocaleDateString(lang()==='th'?'th-TH':'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
  function render(){
    const fights=readFights();
    const table=document.querySelector('.schedule-table');
    if(table){
      table.querySelectorAll('.schedule-row[data-type]').forEach(row=>row.remove());
      const redDefaults=['Upcoming Fights/CO RED.jpg','Upcoming Fights/MP RED.jpg','Gallery/Fight night/G1.jpg','Gallery/Fight night/G3.jpg'];
      const blueDefaults=['Upcoming Fights/CO BLUE.jpg','Upcoming Fights/MP BLUE.jpg','Gallery/Fight night/G2.jpg','Gallery/Fight night/G4.jpg'];
      fights.forEach((fight,index)=>{
        const row=document.createElement('div');
        row.className='schedule-row';
        row.dataset.type=fight.type==='local'?'local':'main';
        row.dataset.fightId=fight.id;
        const date=new Date(fight.date+'T12:00:00');
        const pair=document.createElement('div');
        pair.className='schedule-photo-pair';
        ['red','blue'].forEach(corner=>{
          const photo=document.createElement('div');
          photo.className='schedule-photo '+corner+'-corner';
          photo.dataset.fightId=fight.id;
          photo.dataset.corner=corner;
          photo.dataset.cornerLabel=corner==='red'?'RED':'BLUE';
          photo.style.backgroundImage='url("'+(corner==='red'?redDefaults:blueDefaults)[index%(corner==='red'?redDefaults.length:blueDefaults.length)].replaceAll(' ','%20')+'")';
          pair.append(photo);
        });
        const dateCell=document.createElement('div');dateCell.className='date-cell';
        const dateTitle=document.createElement('b');dateTitle.textContent=date.toLocaleDateString(lang()==='th'?'th-TH':'en-GB',{day:'2-digit',month:'short'}).toUpperCase();
        const dateDetail=document.createElement('small');dateDetail.textContent=date.getFullYear()+' · 20:00';dateCell.append(dateTitle,dateDetail);
        const eventCell=document.createElement('div');eventCell.className='event-cell';
        const eventTitle=document.createElement('b');eventTitle.textContent=fight.title||'';
        const eventDetail=document.createElement('small');eventDetail.textContent=fight.description||(lang()==='th'?'รายละเอียดกำหนดการแข่งขัน':'Event details');eventCell.append(eventTitle,eventDetail);
        const tag=document.createElement('span');tag.className='tag '+(fight.type==='main'?'red':'');tag.textContent=(fight.type||'main').toUpperCase();
        const status=document.createElement('span');status.className='status';status.textContent=(fight.status||'upcoming').toUpperCase();
        const book=document.createElement('a');book.className='schedule-book';book.href='booking.html?date='+encodeURIComponent(fight.date);book.textContent=(window.localizeSiteText?window.localizeSiteText('BOOK TICKETS'):'BOOK TICKETS')+' ↗';
        row.append(pair,dateCell,eventCell,tag,status,book);table.append(row);
      });
    }
    const liveSchedule=document.getElementById('liveFightSchedule');
    if(liveSchedule){
      liveSchedule.replaceChildren();
      const labelForType=type=>type==='main'?(lang()==='th'?'คู่เอกประจำค่ำคืน':'Main event of the night'):type==='co-main'?(lang()==='th'?'คู่รองประจำรายการ':'Co-main event'):type==='local'?(lang()==='th'?'นักชกท้องถิ่นและดาวรุ่ง':'Local fighters and rising stars'):(lang()==='th'?'รายละเอียดกำหนดการแข่งขัน':'Event details');
      fights.slice(0,3).forEach((fight,index)=>{
        const article=document.createElement('article');
        const time=document.createElement('time');
        const date=new Date(fight.date+'T12:00:00');
        const day=document.createElement('span');day.textContent=date.toLocaleDateString(lang()==='th'?'th-TH':'en-GB',{day:'2-digit'});
        const month=document.createElement('small');month.textContent=date.toLocaleDateString(lang()==='th'?'th-TH':'en-GB',{month:'short'}).replace('.','').toUpperCase();
        time.append(day,document.createElement('br'),month);
        const details=document.createElement('div');
        const title=document.createElement('b');title.textContent=fight.title||'';
        const description=document.createElement('small');description.textContent=fight.description||labelForType(fight.type);
        details.append(title,description);
        const badge=document.createElement('span');badge.className='tag';
        const status=(fight.status||'upcoming').toLowerCase();
        const badgeText=status==='live'?(lang()==='th'?'ถ่ายทอดสด':'LIVE'):status==='completed'?(lang()==='th'?'จบแล้ว':'COMPLETED'):status==='cancelled'?(lang()==='th'?'ยกเลิก':'CANCELLED'):index===0?(lang()==='th'?'รายการถัดไป':'UP NEXT'):(lang()==='th'?'เร็ว ๆ นี้':'SOON');
        if(status==='live'||(status==='upcoming'&&index===0))badge.classList.add('red');
        badge.textContent=badgeText;
        article.append(time,details,badge);liveSchedule.append(article);
      });
      if(!fights.length){const empty=document.createElement('p');empty.className='live-schedule-empty';empty.textContent=lang()==='th'?'ยังไม่มีรายการแข่งขัน':'No fights scheduled yet';liveSchedule.append(empty)}
    }    const select=document.getElementById('fightDate');
    if(select){
      const current=select.value;
      select.replaceChildren(...fights.map(fight=>{const option=document.createElement('option');option.value=fight.date;option.textContent=`${fmt(fight.date)} · ${fight.title}`;return option}));
      if([...select.options].some(option=>option.value===current))select.value=current;
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    const cards=document.querySelectorAll('.fight-card');
    fights.slice(0,2).forEach((fight,index)=>{
      const card=cards[index];if(!card)return;
      const date=new Date(fight.date+'T12:00:00');
      card.querySelector('.fight-date b').textContent=date.toLocaleDateString(lang()==='th'?'th-TH':'en-GB',{day:'2-digit'});
      card.querySelector('.fight-date span').textContent=date.toLocaleDateString('en-GB',{month:'short'}).toUpperCase();
      card.querySelector('.fight-date small').textContent=date.getFullYear();
      card.querySelector('.fight-info b').textContent=fight.title||'';
      card.querySelector('.fight-info span').textContent=fight.type==='main'?'MAIN EVENT':(fight.type||'').toUpperCase();
      const bookingButton=card.querySelector('.fight-booking-btn');if(bookingButton)bookingButton.href='booking.html?date='+encodeURIComponent(fight.date);
    });
    document.dispatchEvent(new CustomEvent('site-schedule-updated',{detail:{fights}}));
  }
  document.addEventListener('site-language-change',render);
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null)render()});
  try{const channel=new BroadcastChannel('aonang-fights');channel.addEventListener('message',render)}catch{}
  render();
        if(window.FightScheduleSync){
    const refreshSharedSchedule=()=>window.FightScheduleSync.readState().then(state=>{
      if(!state.initialized||!Array.isArray(state.fights))return;
      const shared=state.fights;
      let current=[];try{current=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
      if(JSON.stringify(current)!==JSON.stringify(shared)){try{localStorage.setItem(key,JSON.stringify(shared))}catch{};render()}
    }).catch(error=>console.info('Shared fight schedule is unavailable; showing the local schedule.',error));
    refreshSharedSchedule();
    setInterval(refreshSharedSchedule,60000);
  }
})();
