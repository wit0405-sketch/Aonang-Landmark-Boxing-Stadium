(()=>{let ok=false;try{ok=localStorage.getItem('aonang-admin-credentials')!==null&&sessionStorage.getItem('aonang-admin-session')==='active'}catch{}if(ok){document.documentElement.classList.remove('auth-pending')}else{location.replace(new URL('../login.html',location.href).href)}})();


