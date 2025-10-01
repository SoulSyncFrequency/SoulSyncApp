(function(){
  function setDate(i){
    try{
      var el = document.getElementById('last-updated')
      if(!el) return
      el.textContent = new Date(i.lastUpdated).toLocaleDateString('en-US',{month:'short',year:'numeric'}) + (i.version ? ' (v'+i.version+')' : '')
    }catch(e){}
  }
  fetch('/build-info.json')
    .then(function(r){return r.json()})
    .then(setDate)
    .catch(function(){ var el = document.getElementById('last-updated'); if(el) el.textContent='dev' })
})();
