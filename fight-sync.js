(()=>{
  const endpoint='/api/fights';
  window.FightScheduleSync={
    async readState(){
      const response=await fetch(endpoint,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error(`Schedule API returned ${response.status}`);
      const result=await response.json();
      return {fights:Array.isArray(result.fights)?result.fights:null,initialized:result.initialized!==false};
    },
    async read(){return (await this.readState()).fights;},
    async write(fights,token){
      const response=await fetch(endpoint,{method:'PUT',cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({fights})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||`Schedule API returned ${response.status}`);
      return result;
    }
  };
})();