(()=> {
  const player=document.querySelector('.live-video-screen iframe');
  if(!player)return;
  const valid=value=>typeof value==='string'&&/^https:\/\/www\.youtube\.com\/embed\/[\w-]{11}$/.test(value);
  try{const saved=localStorage.getItem('aonang-youtube-live');if(valid(saved))player.src=saved}catch{}
  const refresh=()=>fetch('/api/site-config',{cache:'no-store',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(config=>{if(config&&valid(config.youtubeEmbed)&&player.src!==config.youtubeEmbed){player.src=config.youtubeEmbed;try{localStorage.setItem('aonang-youtube-live',config.youtubeEmbed);if(config.youtubeUrl)localStorage.setItem('aonang-youtube-live-url',config.youtubeUrl)}catch{}}}).catch(()=>{});
  refresh();setInterval(refresh,60000);
})();
