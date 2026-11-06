(() => {
  const pairs = [
    ['HOME','หน้าแรก'],['ticket enquiries','สอบถามเรื่องบัตร'],['CHAT ON WHATSAPP','แชตผ่าน WhatsApp'],['Aonang Landmark Boxing Stadium','สนามมวยอ่าวนาง แลนด์มาร์ก'],['Aonang Landmark Boxing Stadium | Booking','สนามมวยอ่าวนาง แลนด์มาร์ก | จองบัตร'],['สัมผัสพลังมวยไทยและค่ำคืนแห่งการต่อสู้','Experience Muay Thai and an unforgettable fight night'],['ใจกลางอ่าวนาง กระบี่','in the heart of Ao Nang, Krabi'],['Thai Fight · 5 Rounds','มวยไทย 5 ยก'],['Muay Thai Super Fight','มวยไทยซูเปอร์ไฟต์'],['Local Fight Night','ค่ำคืนมวยท้องถิ่น'],['LIVE','ถ่ายทอดสด'],['FIGHT SCHEDULE','ตารางแข่งขัน'],['TRAINING','ฝึกมวยไทย'],['GALLERY','แกลเลอรี'],['CONTACT','ติดต่อ'],['BOOKING','จอง'],
    ['MUAY THAI · FIGHT NIGHT · KRABI','มวยไทย · ค่ำคืนแห่งการต่อสู้ · กระบี่'],['AUTHENTIC MUAY THAI','มวยไทยแท้'],['FIGHT NIGHT ENERGY','พลังแห่งค่ำคืนมวย'],['AO NANG · KRABI','อ่าวนาง · กระบี่'],['สัมผัสศิลปะการต่อสู้แบบไทย','Experience the art of Thai martial arts'],['ตื่นเต้นทุกคู่ ทุกยก','Feel the excitement in every bout and every round'],['ประสบการณ์มวยไทยริมทะเล','Muay Thai by the sea'],
    ["DON'T MISS THE ACTION",'ห้ามพลาดทุกความมัน'],['UPCOMING FIGHTS','โปรแกรมการแข่งขัน'],['BOOK YOUR TICKETS','จองบัตรเข้าชม'],['BOOK TICKETS','จองบัตร'],['VIEW FIGHT SCHEDULE','ดูตารางการแข่งขัน'],['WATCH LIVE','รับชมสด'],['ALL FIGHTS','ทุกรายการ'],['MAIN EVENT','คู่เอก'],['CO-MAIN','คู่รอง'],['LOCAL FIGHT','มวยท้องถิ่น'],['FIGHT NIGHT','ค่ำคืนมวย'],['THAI FIGHT · 5 ROUNDS','มวยไทย 5 ยก'],['MUAY THAI SUPER FIGHT','มวยไทยซูเปอร์ไฟต์'],['คู่เอกประจำค่ำคืน','Main event of the night'],['คู่รองประจำรายการ','Co-main event'],['นักชกท้องถิ่นและดาวรุ่ง','Local fighters and rising stars'],['UP NEXT','รายการถัดไป'],['SOON','เร็ว ๆ นี้'],['UPCOMING','เร็ว ๆ นี้'],['VIEW FULL SCHEDULE','ดูตารางทั้งหมด'],['LIVE FROM AO NANG','ถ่ายทอดสดจากอ่าวนาง'],['LIVE STREAMING','ถ่ายทอดสด'],['รับชมบรรยากาศการแข่งขันมวยไทยจาก Aonang Landmark Boxing Stadium','Watch the Muay Thai action from Aonang Landmark Boxing Stadium'],['FIGHT NIGHT SCHEDULE','ตารางการแข่งขัน'],['OFFICIAL LIVE PLAYER','เครื่องเล่นถ่ายทอดสดทางการ'],['ใส่ลิงก์ถ่ายทอดสดจริงเพื่อเปิดใช้งาน','Add a live stream link to activate'],
    ['THE NEXT BOUT STARTS HERE','ศึกครั้งต่อไปรอคุณอยู่'],['ตารางการแข่งขันและรายละเอียดรายการชก','ตารางและรายละเอียดการแข่งขัน'],['DATE','วันที่'],['FIGHT / EVENT','รายการแข่งขัน'],['TYPE','ประเภท'],['STATUS','สถานะ'],['เวทีสำหรับนักชกท้องถิ่นและดาวรุ่ง','A platform for local fighters and rising stars'],['คู่เอก · รายละเอียดนักชกรอประกาศ','Main event · fighters to be announced'],['คู่รอง · รายละเอียดนักชกรอประกาศ','Co-main event · fighters to be announced'],['โปรดติดตามประกาศคู่ชก','Fighters to be announced'],['ตารางนี้เป็นตัวอย่างสำหรับงานออกแบบ ต้องยืนยันวัน เวลา และคู่ชกกับสนามก่อนใช้งานจริง','This schedule is a design sample. Confirm dates, times, and fighters with the stadium before use.'],
    ['LEARN THE ART OF MUAY THAI','เรียนรู้ศิลปะแห่งมวยไทย'],['MUAY THAI TRAINING','คลาสฝึกมวยไทย'],['เริ่มต้นฝึกมวยไทยกับทีมผู้ฝึกสอน','Train Muay Thai with our coaching team'],['เพื่อพัฒนาทักษะ ความมั่นใจ และสมรรถภาพ','Build your skills, confidence, and fitness'],['BOOK A SESSION','จองคลาสฝึก'],['FIND YOUR LEVEL','เลือกระดับที่เหมาะกับคุณ'],['TRAINING PROGRAMS','โปรแกรมฝึกซ้อม'],['BEGINNER','ผู้เริ่มต้น'],['INTERMEDIATE','ระดับกลาง'],['ADVANCED','ระดับสูง'],['PRIVATE TRAINING','ฝึกส่วนตัว'],['พื้นฐานมวยไทยสำหรับผู้เริ่มต้น ฝึกท่ายืน หมัด เตะ และการป้องกัน','Muay Thai fundamentals: stance, punches, kicks, and defense'],['พัฒนาความแม่นยำ จังหวะ การเคลื่อนไหว และการออกอาวุธ','Improve precision, timing, movement, and combinations'],['ฝึกเทคนิคขั้นสูงและรูปแบบการซ้อมตามเป้าหมายส่วนบุคคล','Advanced techniques and training tailored to your goals'],['เซสชันส่วนตัวที่ปรับให้เหมาะกับประสบการณ์และเป้าหมายของคุณ','One-to-one training tailored to your experience and goals'],['ENQUIRE','สอบถาม'],['MOMENTS FROM THE RING','ภาพประทับใจบนเวที'],['FIGHT NIGHT GALLERY','แกลเลอรีค่ำคืนมวย'],['รวมภาพบรรยากาศการแข่งขัน การฝึกซ้อม และกิจกรรมภายในสนาม','Scenes from fights, training, and events at the stadium'],['THE ARENA','สนามแข่งขัน'],['TRAINING CAMP','ค่ายฝึกซ้อม'],['IN THE RING','บนเวที'],['FIGHT NIGHT CROWD','แฟนมวยในสนาม'],['THE ART OF MUAY THAI','ศิลปะแห่งมวยไทย'],['ภาพประกอบใช้ภาพตัวอย่างจากแหล่งภาพออนไลน์ สามารถเปลี่ยนเป็นภาพจริงของสนามได้','Sample images from online sources can be replaced with stadium photos.'],
    ['COME FEEL THE ENERGY','มาสัมผัสบรรยากาศด้วยตัวคุณเอง'],['CONTACT US','ติดต่อเรา'],['วางแผนค่ำคืนมวยไทยของคุณที่อ่าวนาง กระบี่','Plan your Muay Thai night in Ao Nang, Krabi'],['GET IN TOUCH','ติดต่อเรา'],["LET'S TALK FIGHTS.",'พูดคุยเรื่องมวย'],['LOCATION','สถานที่'],['PHONE','โทรศัพท์'],['EMAIL','อีเมล'],['SEND US A MESSAGE','ส่งข้อความถึงเรา'],['HOW CAN WE HELP?','เราช่วยอะไรคุณได้บ้าง'],['ชื่อ / NAME','Name'],['อีเมล / EMAIL','Email'],['หัวข้อ / SUBJECT','Subject'],['ข้อความ / MESSAGE','Message'],['Your name','ชื่อของคุณ'],['Tell us how we can help...','แจ้งให้เราทราบว่าต้องการความช่วยเหลือเรื่องใด'],['Booking tickets','จองบัตรเข้าชม'],['Muay Thai training','ฝึกมวยไทย'],['Fight schedule','ตารางแข่งขัน'],['Other enquiry','สอบถามเรื่องอื่น'],['SEND MESSAGE','ส่งข้อความ'],['แบบฟอร์มตัวอย่าง — ต้องเชื่อมต่อระบบส่งอีเมลก่อนใช้งานจริง','This is a sample form. Connect an email service before use.'],['แบบฟอร์มตัวอย่าง — ต้องเชื่อมต่อระบบรับข้อความก่อนเปิดใช้งานจริง','This is a sample form. Connect a messaging service before launch.'],['BACK TO TOP','กลับด้านบน'],['All rights reserved.','สงวนลิขสิทธิ์'],
    ['YOUR FIGHT NIGHT STARTS HERE','ค่ำคืนมวยของคุณเริ่มต้นที่นี่'],['BOOK YOUR EXPERIENCE','จองประสบการณ์'],['เลือกชมการแข่งขันมวยไทย หรือจองคลาสฝึกซ้อมที่อ่าวนาง','Book a Muay Thai fight night or training session in Ao Nang'],['CHOOSE YOUR EXPERIENCE','เลือกประสบการณ์'],['เลือกประสบการณ์','Choose your experience'],['ชมมวยไทย','Watch Muay Thai'],['คลาสฝึกมวยไทย','Muay Thai training'],['วันที่เข้าชม','Fight date'],['เลือกวันที่ต้องการ','Choose a date'],['อาทิตย์','Sun'],['จันทร์','Mon'],['อังคาร','Tue'],['พุธ','Wed'],['ตุลาคม','October'],['ประเภทบัตร','Ticket type'],['ราคาตัวอย่าง','Sample price'],['ที่นั่งมาตรฐาน · มองเห็นเวทีชัดเจน','Standard seating · clear view of the ring'],['ที่นั่งข้างเวที · ใกล้ชิดทุกจังหวะ','Ringside seats · up close to the action'],['ที่นั่งพรีเมียม · ประสบการณ์พิเศษ','Premium seats · a special experience'],['จำนวนบัตร','Number of tickets'],['สูงสุด 10 ใบต่อรายการ','Up to 10 tickets per booking'],['คลาสฝึกซ้อม','Training class'],['คลาสกลุ่ม 1 ชั่วโมง','1-hour group class'],['วันที่สะดวก','Preferred date'],['ช่วงเวลาที่ต้องการ','Preferred time'],['จำนวนผู้เข้าฝึก','Number of trainees'],['สูงสุด 8 คน','Up to 8 people'],['ข้อมูลผู้จอง','Guest details'],['ชื่อผู้จอง','Full name'],['ชื่อ - นามสกุล','Full name'],['เบอร์โทรศัพท์','Phone number'],['ประเทศ','Country'],['ฉันยอมรับเงื่อนไขการจองและนโยบายความเป็นส่วนตัว','I agree to the booking terms and privacy policy'],['ส่งคำขอจอง','Submit booking request'],['หน้านี้เป็นตัวอย่างสำหรับออกแบบ ราคาและวันแข่งขันเป็นข้อมูลตัวอย่าง การส่งฟอร์มยังไม่ยืนยันบัตรหรือรับชำระเงิน','This is a design sample. Prices and fight dates are examples; submitting does not confirm tickets or take payment.'],['YOUR SELECTION','รายการที่เลือก'],['สรุปรายการ','Booking summary'],['ค่าธรรมเนียม','Fees'],['ยอดรวมโดยประมาณ','Estimated total'],['ยอดจริงอาจเปลี่ยนแปลงตามราคาและเงื่อนไขของสนาม','Final prices may vary according to the stadium’s pricing and terms.'],['เลือกวันและประเภทที่นั่งได้','Choose a date and seating type'],['รับรายละเอียดทางอีเมลหลังยืนยัน','Receive details by email after confirmation'],['ติดต่อทีมงานเพื่อสอบถามเพิ่มเติม','Contact our team for more information'],['ต้องการความช่วยเหลือ?','Need help?'],['เลือกวันฝึกซ้อม','Choose a training date'],['STADIUM SEAT','ที่นั่งมาตรฐาน'],['RINGSIDE','ข้างเวที'],['VIP EXPERIENCE','ประสบการณ์ VIP'],['Stadium Seat','ที่นั่งมาตรฐาน'],['Ringside','ข้างเวที'],['VIP Experience','ประสบการณ์ VIP'],['BEGINNER TRAINING','คลาสผู้เริ่มต้น'],['INTERMEDIATE TRAINING','คลาสระดับกลาง'],['PRIVATE TRAINING','คลาสส่วนตัว'],['บันทึกคำขอไว้ในเบราว์เซอร์นี้แล้ว และไม่มีการส่งข้อความไป WhatsApp','Your request was saved in this browser only. No WhatsApp message was sent.']
  ];
  pairs.push(
    ['Your request has been saved. We will contact you soon.', 'คำขอของคุณได้บันทึกไว้แล้ว เราจะติดต่อคุณในเร็วๆนี้'],
    ['TOTAL VISITORS', 'จำนวนผู้เข้าชม'],
    ['FIND THE STADIUM', 'ค้นหาที่ตั้งสนาม'],
    ['AONANG LANDMARK BOXING STADIUM', 'สนามมวยอ่าวนาง แลนด์มาร์ก'],
    ['77/45 Moo 3, Ao Nang, Krabi 81180, Thailand', '77/45 หมู่ 3 อ่าวนาง กระบี่ 81180 ประเทศไทย'],
    ['OPEN DIRECTIONS', 'เปิดแผนที่นำทาง'],
    ['Map to Aonang Landmark Boxing Stadium', 'แผนที่ไปสนามมวยอ่าวนาง แลนด์มาร์ก'],
    ['Stadium location', 'ที่ตั้งสนามมวย']
  );  pairs.push(
    ['CLINCH BATTLE','วงในดวลเดือด'],
    ['KICK EXCHANGE','จังหวะแลกแข้ง'],
    ['WINNER ANNOUNCEMENT','ประกาศผู้ชนะ'],
    ['FIGHTERS AFTER THE BOUT','นักชกหลังจบการแข่งขัน'],
    ['MUAY THAI ACTION','แอ็กชันมวยไทย'],
    ['Fight night photo 1','ภาพค่ำคืนมวย 1'],
    ['Fight night photo 2','ภาพค่ำคืนมวย 2'],
    ['Fight night photo 3','ภาพค่ำคืนมวย 3'],
    ['Fight night photo 4','ภาพค่ำคืนมวย 4'],
    ['Fight night photo 5','ภาพค่ำคืนมวย 5'],
    ['Fight night photo 6','ภาพค่ำคืนมวย 6']
  );  pairs.push(
    ['CLINCH BATTLE','วงในดวลเดือด'],
    ['KICK EXCHANGE','จังหวะแลกแข้ง'],
    ['Fight night photo 1','ภาพค่ำคืนมวย 1'],
    ['Fight night photo 2','ภาพค่ำคืนมวย 2']
  );  pairs.push(
    ['RING ACTION','แอ็กชันบนเวที'],
    ['Stadium photo 1','ภาพสนาม 1'],['Stadium photo 2','ภาพสนาม 2'],['Stadium photo 3','ภาพสนาม 3'],
    ['Stadium photo 4','ภาพสนาม 4'],['Stadium photo 5','ภาพสนาม 5'],['Stadium photo 6','ภาพสนาม 6']
  );  pairs.push(
    ['TRAINING MOMENT · 01', 'ช่วงฝึกซ้อม · 01'], ['Training photo 1', 'ภาพฝึกซ้อม 1'],
    ['TRAINING MOMENT · 02', 'ช่วงฝึกซ้อม · 02'], ['Training photo 2', 'ภาพฝึกซ้อม 2'],
    ['TRAINING MOMENT · 03', 'ช่วงฝึกซ้อม · 03'], ['Training photo 3', 'ภาพฝึกซ้อม 3'],
    ['TRAINING MOMENT · 04', 'ช่วงฝึกซ้อม · 04'], ['Training photo 4', 'ภาพฝึกซ้อม 4'],
    ['TRAINING MOMENT · 05', 'ช่วงฝึกซ้อม · 05'], ['Training photo 5', 'ภาพฝึกซ้อม 5'],
    ['TRAINING MOMENT · 06', 'ช่วงฝึกซ้อม · 06'], ['Training photo 6', 'ภาพฝึกซ้อม 6']
  );
  pairs.push(
    ['20:00 onwards', '20:00 น. เป็นต้นไป'],
    ['/ person', '/ คน'],
    ['Reduce quantity', 'ลดจำนวน'],
    ['Increase quantity', 'เพิ่มจำนวน'],
    ['Open menu', 'เปิดเมนู'],
    ['Ticket booking type', 'ประเภทการจอง'],
    ['Select seats', 'เลือกที่นั่ง'], ['Select up to 10 seats', 'เลือกได้สูงสุด 10 ที่นั่ง'],
    ['Illustrative seat map · seat availability is not connected to live booking', 'ผังที่นั่งตัวอย่างสำหรับแสดงผล · สถานะที่นั่งยังไม่ได้เชื่อมกับระบบจองจริง'],
    ['Please select at least one seat', 'กรุณาเลือกที่นั่งอย่างน้อย 1 ที่'],
    ['Seat selection and form submission are for demonstration only. Seats are not reserved and no payment is taken. Contact the stadium to confirm your booking.', 'การเลือกที่นั่งและส่งแบบฟอร์มนี้เป็นเพียงการสาธิต ไม่ใช่การจองที่นั่งจริง ไม่มีการกันที่นั่งหรือรับชำระเงิน กรุณาติดต่อสนามเพื่อยืนยันการจอง'],
    ['No seats selected', 'ยังไม่ได้เลือกที่นั่ง'], ['Select multiple seats', 'เลือกที่นั่งได้หลายที่'],
    ['See prices and your total instantly', 'ดูราคาและยอดรวมทันที'], ['Switch between seat booking and training', 'สลับจองที่นั่งหรือคลาสฝึกซ้อม'],
    ['Example total · final price not confirmed', 'ยอดรวมตัวอย่าง · ยังไม่ใช่ราคายืนยัน'],
    ['Your demo request was received. Seats are not reserved and payment was not taken. Please contact the stadium to confirm availability.', 'ได้รับคำขอสาธิตแล้ว แต่ยังไม่ได้สำรองที่นั่งหรือรับชำระเงิน กรุณาติดต่อสนามเพื่อยืนยันที่นั่งว่าง'],
    ['Your demo request is saved on this device only. Seats are not reserved and payment was not taken. Please contact the stadium to confirm availability.', 'บันทึกคำขอสาธิตไว้ในอุปกรณ์นี้เท่านั้น ยังไม่ได้สำรองที่นั่งหรือรับชำระเงิน กรุณาติดต่อสนามเพื่อยืนยันที่นั่งว่าง']
  );  const thToEn = new Map(pairs.map(([en, th]) => [th, en]));
  const enToTh = new Map(pairs.map(([en, th]) => [en, th]));
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) source.push([walker.currentNode, walker.currentNode.nodeValue]);
  const attrs = [];
  document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach(el => ['placeholder','aria-label','title','alt'].forEach(a => {if(el.hasAttribute(a))attrs.push([el,a,el.getAttribute(a)])}));
  function translate(text, lang) {
    const dict = lang === 'en' ? thToEn : enToTh;
    const keys = [...dict.keys()].sort((a,b)=>b.length-a.length);
    if (!keys.length) return text;
    return text.replace(new RegExp(keys.map(escape).join('|'),'g'), match => dict.get(match));
  }
  let language = 'en';
  function setLanguage(lang) {
    language = lang;
    document.documentElement.lang = lang;
    const isBooking = document.body.classList.contains('booking-page');
    document.title = isBooking
      ? (lang === 'en' ? 'Book Tickets | Aonang Landmark Boxing Stadium' : 'จองบัตร | สนามมวยอ่าวนาง แลนด์มาร์ก')
      : (lang === 'en' ? 'Aonang Landmark Boxing Stadium' : 'สนามมวยอ่าวนาง แลนด์มาร์ก');
    source.forEach(([node, text]) => node.nodeValue = translate(text, lang));
    attrs.forEach(([el, name, value]) => el.setAttribute(name, translate(value, lang)));
    document.querySelectorAll('#languageBtn').forEach(btn => {btn.textContent=lang==='th'?'🇹🇭':'🇬🇧';btn.setAttribute('aria-label',lang==='th'?'Switch language to English':'เปลี่ยนภาษาเป็นภาษาไทย');});
    window.siteLanguage=lang;
    window.localizeSiteText=text=>translate(text,language);
    document.dispatchEvent(new CustomEvent('site-language-change', {detail:{language:lang}}));
    try {localStorage.setItem('aonang-language-v2',lang)} catch (_) {}
  }
  document.querySelectorAll('#languageBtn').forEach(btn => btn.addEventListener('click',()=>setLanguage(language==='th'?'en':'th')));
  let saved='en';try{saved=localStorage.getItem('aonang-language-v2')||'en'}catch(_){}
  setLanguage(saved==='en'?'en':'th');
})();




