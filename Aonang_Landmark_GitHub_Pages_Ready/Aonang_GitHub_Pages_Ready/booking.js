const fightFields = document.getElementById('fightFields');
const trainingFields = document.getElementById('trainingFields');
const kindButtons = [...document.querySelectorAll('.booking-type')];
const bookingSuccessPopup = document.getElementById('bookingSuccessPopup');
const seatMap = document.getElementById('seatMap');
let bookingPopupTimer;
let bookingKind = new URLSearchParams(location.search).get('type') === 'training' ? 'training' : 'fight';

const tiers = [
  { id:'ringside', name:'Ringside', price:1500, color:'black' },
  { id:'vip', name:'VIP SEAT', price:1200, color:'red' },
  { id:'grand', name:'GRAND STAND', price:1000, color:'teal' }
];
const selectedSeats = new Set();
const unavailableSeats = new Map();
let activeLockToken = null;
let activeLockExpiresAt = 0;
let lockCountdownTimer = null;
const isEnglish = () => window.siteLanguage === 'en';
const baht = value => `฿${Number(value || 0).toLocaleString('en-US')}`;
const localize = text => (window.localizeSiteText || (value => value))(text);
const seatTier = id => id.startsWith('S') ? tiers[0] : /^[A-H]/.test(id) ? tiers[1] : tiers[2];

function addSeat(id, tierId, x, y, width, height, extra='') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `seat seat-${tierId} ${extra}`.trim();
  button.textContent = id;
  button.dataset.seatId = id;
  button.dataset.tier = tierId;
  button.style.left = `${x}%`;
  button.style.top = extra.split(/\s+/).includes('vip-top') ? `calc(${y}% - 30px)` : `${y}%`;
  button.style.width = `${width}%`;
  button.style.height = `${height}%`;
  button.setAttribute('aria-pressed', String(selectedSeats.has(id)));
  if (unavailableSeats.has(id)) { button.disabled = true; button.classList.add('seat-unavailable'); button.title = `${id} · ${isEnglish()?'Unavailable':'ไม่ว่าง'}`; }
  const tier = tiers.find(item => item.id === tierId);
  button.setAttribute('aria-label', `${isEnglish()?'Seat':'ที่นั่ง'} ${id}, ${tier.name}, ${baht(tier.price)}`);
  button.title = `${id} · ${tier.name} · ${baht(tier.price)}`;
  if (selectedSeats.has(id)) button.classList.add('selected');
  seatMap.append(button);
}
function renderSeatMap() {
  if (!seatMap) return;
  seatMap.replaceChildren();
  const stage = document.createElement('div');
  stage.className = 'map-stage';
  stage.innerHTML = `<span>AONANG LANDMARK</span><b>${isEnglish()?'MUAY THAI RING':'เวทีมวยไทย'}</b><small>●</small>`;
  seatMap.append(stage);

  // VIP seating follows the reference: four rows above and four rows below the ring.
  // Each row is split into two banks with the seat numbering facing the ring.
  const addVipBank = (row, y, topBank=true) => {
    for (let n=18; n>=10; n--) {
      const col = 18-n;
      addSeat(`${row}${n}`,'vip',8.0+col*3.05,y,2.55,4.0, topBank?'vip-top':'vip-bottom');
    }
    for (let n=9; n>=1; n--) {
      const col = 9-n;
      addSeat(`${row}${n}`,'vip',48.0+col*3.05,y,2.55,4.0, topBank?'vip-top':'vip-bottom');
    }
  };
  ['D','C','B','A'].forEach((row,i)=>addVipBank(row,8.5+i*6.0,true));
  ['E','F','G','H'].forEach((row,i)=>addVipBank(row,79.0+i*5.7,false));

  // Ringside seats along the top and bottom edges of the ring.
  for (let i=0;i<15;i++) addSeat(`S${37+i}`,'ringside',16.0+i*3.35,29.0,2.9,4.2,'ring-top');
  for (let i=0;i<15;i++) addSeat(`S${52+i}`,'ringside',16.0+i*3.35,73.0,2.9,4.2,'ring-bottom');

  // S1-S36 occupy the three vertical banks inside the right-side green-framed area.
  // Each bank contains 12 seats, progressing from top to bottom.
  for (let bank=0;bank<3;bank++) {
    for (let row=0;row<12;row++) {
      const number=bank*12+row+1;
      addSeat(`S${number}`,'ringside',69.0+bank*5.0,35.0+row*3.0,4.0,2.65,'ring-side');
    }
  }

  // Grandstand G1-G80: 8 columns x 10 rows in the far-right zone.
  const grandstand = document.createElement('div');
  grandstand.className = 'grandstand-sign';
  grandstand.textContent = isEnglish() ? 'GRANDSTAND' : 'อัฒจันทร์';
  seatMap.append(grandstand);
  for (let row=0; row<10; row++) {
    for (let col=0; col<8; col++) {
      const number = row*8+col+1;
      addSeat(`G${number}`,'grand',84.8+col*1.35,33.0+row*3.65,1.15,2.9,'grandstand-seat');
    }
  }

  applySeatFilter(activeSeatFilter);
  updateSummary();
}
let activeSeatFilter = 'all';
function applySeatFilter(filter) {
  activeSeatFilter = filter;
  document.querySelectorAll('.seat-zone-filter').forEach(button => {
    const active = button.dataset.seatFilter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  seatMap.querySelectorAll('.seat').forEach(seat => {
    const show = filter === 'all' || seat.dataset.tier === filter;
    seat.hidden = !show;
  });
  document.querySelectorAll('.seat-choice-panel').forEach(panel => {
    panel.hidden = filter === 'all' || panel.dataset.choiceZone !== filter;
  });
}
document.querySelectorAll('.seat-zone-filter').forEach(button => {
  button.addEventListener('click', () => applySeatFilter(button.dataset.seatFilter));
});

function setKind(kind) {
  bookingKind = kind;
  kindButtons.forEach(button => button.classList.toggle('active', button.dataset.kind === kind));
  fightFields.classList.toggle('hidden', kind !== 'fight');
  trainingFields.classList.toggle('hidden', kind !== 'training');
  fightFields.querySelectorAll('select, input').forEach(control => control.disabled = kind !== 'fight');
  trainingFields.querySelectorAll('select, input').forEach(control => control.disabled = kind !== 'training');
  document.getElementById('fightDate').required = kind === 'fight';
  document.getElementById('trainingDate').required = kind === 'training';
  document.querySelector('.seat-map-note').classList.toggle('hidden', kind !== 'fight');
  document.querySelector('.seat-legend').classList.toggle('hidden', kind !== 'fight');
  updateSummary();
}
kindButtons.forEach(button => button.addEventListener('click', () => setKind(button.dataset.kind)));

seatMap.addEventListener('click', event => {
  const button = event.target.closest('.seat:not(:disabled)');
  if (!button) return;
  const id = button.dataset.seatId;
  if (selectedSeats.has(id)) selectedSeats.delete(id);
  else if (selectedSeats.size >= 10) {
    document.getElementById('seatLimitMessage').textContent = localize('เลือกได้สูงสุด 10 ที่นั่ง');
    return;
  } else selectedSeats.add(id);
  document.getElementById('seatLimitMessage').textContent = '';
  renderSeatMap();
  seatMap.querySelector(`[data-seat-id="${id}"]`)?.focus();
});

const traineeCount = document.getElementById('traineeCount');
function boundedQuantity(input, delta = 0) {
  input.value = Math.max(Number(input.min), Math.min(Number(input.max), Number(input.value || 1) + delta));
  updateSummary();
}
document.getElementById('traineeMinus').addEventListener('click', () => boundedQuantity(traineeCount, -1));
document.getElementById('traineePlus').addEventListener('click', () => boundedQuantity(traineeCount, 1));
traineeCount.addEventListener('change', () => boundedQuantity(traineeCount));
['fightDate','trainingLevel','trainingDate','trainingTime'].forEach(id => document.getElementById(id).addEventListener('change', updateSummary));
document.getElementById('fightDate').addEventListener('change',refreshSeatAvailability);

function seatIdsForZone(zone) {
  if (zone === 'ringside') return Array.from({length:66},(_,i)=>`S${i+1}`);
  if (zone === 'vip') return 'ABCDEFGH'.split('').flatMap(row=>Array.from({length:18},(_,i)=>`${row}${i+1}`));
  return Array.from({length:80},(_,i)=>`G${i+1}`);
}
function renderSeatChoiceButtons() {
  const zones = [
    ['ringside','selectedRingside'],
    ['vip','selectedVip'],
    ['grand','selectedGrandstand']
  ];
  zones.forEach(([zone,id]) => {
    const container = document.getElementById(id);
    if (!container) return;
    container.replaceChildren();
    seatIdsForZone(zone).forEach(seatId => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'seat-choice-chip';
      button.textContent = seatId;
      button.dataset.seatId = seatId;
      button.setAttribute('aria-pressed', String(selectedSeats.has(seatId)));
      if (unavailableSeats.has(seatId)) { button.disabled = true; button.classList.add('unavailable'); button.title = isEnglish()?'Unavailable':'ไม่ว่าง'; }
      button.classList.toggle('selected', selectedSeats.has(seatId));
      button.addEventListener('click', () => {
        if (selectedSeats.has(seatId)) selectedSeats.delete(seatId);
        else if (selectedSeats.size >= 10) {
          document.getElementById('seatLimitMessage').textContent = localize('เลือกได้สูงสุด 10 ที่นั่ง');
          return;
        } else selectedSeats.add(seatId);
        document.getElementById('seatLimitMessage').textContent = '';
        renderSeatMap();
      });
      container.append(button);
    });
  });
}
function updateSeatSelectionLists() {
  renderSeatChoiceButtons();
}
function updateSummary() {
  updateSeatSelectionLists();
  let name, date, item, total;
  if (bookingKind === 'training') {
    const level = document.getElementById('trainingLevel');
    const selected = level.options[level.selectedIndex];
    const labels = {beginner:'BEGINNER TRAINING',intermediate:'INTERMEDIATE TRAINING',private:'PRIVATE TRAINING'};
    name = labels[selected.value];
    const day = document.getElementById('trainingDate').value;
    date = `${day || (isEnglish()?'Choose a training date':'เลือกวันฝึกซ้อม')} · ${document.getElementById('trainingTime').value}`;
    item = `${selected.text.split(' · ')[0]} × ${traineeCount.value || 1}`;
    total = Number(selected.dataset.price) * Number(traineeCount.value || 1);
  } else {
    const dateInput = document.getElementById('fightDate');
    const selectedDate = dateInput.options[dateInput.selectedIndex];
    name = selectedDate.text.split(' · ')[1]?.toUpperCase() || 'FIGHT NIGHT';
    date = `${new Date(`${dateInput.value}T12:00:00`).toLocaleDateString(isEnglish()?'en-GB':'th-TH',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()} · 20:00`;
    const seats = [...selectedSeats].map(id => ({id,tier:seatTier(id)}));
    total = seats.reduce((sum,seat)=>sum+seat.tier.price,0);
    item = seats.length ? `${seats.length} ${isEnglish()?'seat(s)':'ที่นั่ง'} · ${seats.map(seat=>seat.id).join(', ')}` : (isEnglish()?'No seats selected':'ยังไม่ได้เลือกที่นั่ง');
  }
  document.getElementById('summaryName').textContent = localize(name);
  document.getElementById('summaryDate').textContent = localize(date);
  document.getElementById('summaryItem').textContent = localize(item);
  document.getElementById('summarySubtotal').textContent = baht(total);
  document.getElementById('summaryTotal').textContent = baht(total);
}


function currentFightDate() { return document.getElementById('fightDate')?.value || ''; }
function showLockStatus(message, isError=false) {
  const el=document.getElementById('seatLockStatus');
  if(!el) return;
  el.hidden=!message;
  el.textContent=message||'';
  el.classList.toggle('error',Boolean(isError));
}
async function refreshSeatAvailability() {
  const date=currentFightDate();
  if(!date) return;
  try {
    const response=await fetch(`/api/seat-locks?date=${encodeURIComponent(date)}`,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok) throw new Error('Seat lock service unavailable');
    const data=await response.json();
    unavailableSeats.clear();
    (data.seats||[]).forEach(item=>unavailableSeats.set(item.seat_id,item));
    renderSeatMap();
    const unavailableSelected=[...selectedSeats].filter(id=>unavailableSeats.has(id));
    unavailableSelected.forEach(id=>selectedSeats.delete(id));
    if(unavailableSelected.length) {
      showLockStatus(isEnglish()?'Some seats were taken by another customer and have been removed from your selection.':'มีลูกค้ารายอื่นเลือกที่นั่งบางรายการไปแล้ว ระบบนำที่นั่งเหล่านั้นออกจากรายการของคุณ',true);
      updateSummary();
    }
  } catch(error) {
    showLockStatus(isEnglish()?'Live seat availability is not connected. Booking is unavailable until the server is configured.':'ยังไม่ได้เชื่อมต่อระบบตรวจสอบที่นั่งแบบเรียลไทม์ กรุณาตั้งค่าเซิร์ฟเวอร์ก่อนเปิดรับจอง',true);
  }
}
function startLockCountdown(expiresAt) {
  if(lockCountdownTimer) clearInterval(lockCountdownTimer);
  const tick=()=>{
    const remaining=Math.max(0,Math.ceil((expiresAt-Date.now())/1000));
    const minutes=String(Math.floor(remaining/60)).padStart(2,'0');
    const seconds=String(remaining%60).padStart(2,'0');
    showLockStatus(remaining
      ? (isEnglish()?`Your seats are held for ${minutes}:${seconds}. Complete payment before the timer ends.`:`ระบบล็อกที่นั่งให้แล้ว เหลือเวลา ${minutes}:${seconds} กรุณาชำระเงินก่อนหมดเวลา`)
      : (isEnglish()?'Your seat hold has expired.':'หมดเวลาล็อกที่นั่งแล้ว'),remaining===0);
    if(remaining===0){clearInterval(lockCountdownTimer);activeLockToken=null;activeLockExpiresAt=0;refreshSeatAvailability();}
  };
  tick();lockCountdownTimer=setInterval(tick,1000);
}
async function lockSelectedSeats() {
  const response=await fetch('/api/seat-locks',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({action:'lock',date:currentFightDate(),seats:[...selectedSeats]})});
  const result=await response.json().catch(()=>({}));
  if(!response.ok) {
    if(Array.isArray(result.seats)){
      unavailableSeats.clear();result.seats.forEach(item=>unavailableSeats.set(item.seat_id,item));
      renderSeatMap();
    }
    throw new Error(result.error||'Unable to lock selected seats.');
  }
  activeLockToken=result.lockToken;activeLockExpiresAt=result.expiresAt;
  return result;
}

document.getElementById('bookingForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  if (bookingKind === 'fight' && selectedSeats.size === 0) {
    document.getElementById('seatLimitMessage').textContent = localize('กรุณาเลือกที่นั่งอย่างน้อย 1 ที่');
    seatMap.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  const submitButton = document.querySelector('.booking-submit');
  if (submitButton) submitButton.disabled = true;
  const isTraining = bookingKind === 'training';
  const selected = isTraining ? document.getElementById('trainingLevel') : document.getElementById('fightDate');
  let lockResult=null;
  if(!isTraining){
    try { lockResult=await lockSelectedSeats(); }
    catch(error) {
      if(submitButton) submitButton.disabled=false;
      showLockStatus(error.message,true);
      await refreshSeatAvailability();
      return;
    }
  }
  const seatDetails = [...selectedSeats].map(id => {
    const tier = seatTier(id);
    return {id,tier:tier.name,price:tier.price};
  });
  const booking = {
    id:`b${Date.now()}`,
    name:document.getElementById('guestName').value.trim(),
    email:document.getElementById('guestEmail').value.trim(),
    phone:document.getElementById('guestPhone').value.trim(),
    kind:isTraining?'Training':'Fight night',
    selection:isTraining?selected.options[selected.selectedIndex].text:`Seats ${seatDetails.map(seat=>seat.id).join(', ')} · ${selected.options[selected.selectedIndex].text}`,
    seats:isTraining?[]:seatDetails,
    total:isTraining?Number(selected.options[selected.selectedIndex].dataset.price)*Number(traineeCount.value):seatDetails.reduce((sum,seat)=>sum+seat.price,0),
    date:isTraining?document.getElementById('trainingDate').value:selected.value,
    count:isTraining?traineeCount.value:String(seatDetails.length),
    created:new Date().toISOString(),status:'pending_payment',lockToken:lockResult?.lockToken||null,lockExpiresAt:lockResult?.expiresAt||null,demo:true
  };
  let shared=false;
  try {
    const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(booking)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.booking) throw new Error(result.error||'Shared booking service unavailable');
    Object.assign(booking,result.booking); shared=true;
  } catch(error) {
    console.warn('Booking request could not be synced to the server.',error);
    if(activeLockToken) {
      fetch('/api/seat-locks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'release',date:currentFightDate(),lockToken:activeLockToken})}).catch(()=>{});
      activeLockToken=null;
    }
  }
  try {
    const requests=JSON.parse(localStorage.getItem('aonang-bookings')||'[]');
    requests.unshift(booking);localStorage.setItem('aonang-bookings',JSON.stringify(requests.slice(0,1000)));
  } catch(_) {}
  const confirmation=shared
    ? (isEnglish()?'Your seats are temporarily held for 15 minutes. Payment is not connected yet; contact the stadium to complete payment.':'ล็อกที่นั่งชั่วคราวให้แล้ว 15 นาที ขณะนี้ยังไม่ได้เชื่อมต่อระบบชำระเงิน กรุณาติดต่อสนามเพื่อดำเนินการชำระเงิน')
    : (isEnglish()?'The booking service is unavailable. No seats were held. Please try again later.':'ระบบจองยังไม่พร้อมใช้งาน ไม่มีการล็อกที่นั่ง กรุณาลองใหม่ภายหลัง');
  if(shared && lockResult) startLockCountdown(lockResult.expiresAt);
  document.getElementById('bookingSuccessText').textContent=confirmation;
  if(bookingPopupTimer) clearTimeout(bookingPopupTimer);
  bookingSuccessPopup.hidden=false;bookingSuccessPopup.focus();
  bookingPopupTimer=setTimeout(()=>{bookingSuccessPopup.hidden=true;document.querySelector('.booking-submit')?.focus()},5000);
  if(submitButton) submitButton.disabled=false;
});
document.addEventListener('site-language-change',()=>{renderSeatMap();updateSummary()});
const requestedFightDate=new URLSearchParams(location.search).get('date');
if(requestedFightDate){const fightDate=document.getElementById('fightDate');if([...fightDate.options].some(option=>option.value===requestedFightDate))fightDate.value=requestedFightDate}
renderSeatMap();setKind(bookingKind);refreshSeatAvailability();
